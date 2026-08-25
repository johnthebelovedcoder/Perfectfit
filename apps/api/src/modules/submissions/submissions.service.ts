import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { SubmissionsRepository } from "./submissions.repository";
import { DatabaseService } from "../../common/database/database.service";
import { ItemsService } from "../items/items.service";
import { NOTIFICATION_QUEUE, IMAGE_MIGRATE_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import type {
  CreateSubmission,
  UpdateSubmission,
  ReviewSubmission,
  SessionUser,
} from "@thread/types";

@Injectable()
export class SubmissionsService {
  constructor(
    private repo: SubmissionsRepository,
    private db: DatabaseService,
    private itemsService: ItemsService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @InjectQueue(IMAGE_MIGRATE_QUEUE) private imageMigrateQueue: Queue
  ) {}

  async create(dto: CreateSubmission, user: SessionUser) {
    const sellerProfile = await this.db.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    // No admin approval gate: sellers are live as soon as they register. Identity
    // is checked separately via KYC, which gates payouts rather than listing.
    if (!sellerProfile) throw new ForbiddenException("Seller profile required");
    // Sellers must accept the Seller Agreement before listing anything.
    if (!sellerProfile.agreementAcceptedAt) {
      throw new ForbiddenException("You must accept the Seller Agreement before listing items");
    }

    const submission = await this.repo.create({
      sellerId: sellerProfile.id,
      ...dto,
    });

    await this.notificationQueue.add(
      "submission-received",
      { submissionId: submission.id, sellerId: sellerProfile.id },
      JOB_OPTS
    );

    return submission;
  }

  /**
   * Edit a submission's details. Admins can edit any submission; sellers only
   * their own. Allowed while it's still under review (before it's listed live).
   */
  async updateSubmission(id: string, dto: UpdateSubmission, user: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException("Submission not found");

    const isAdmin = user.role === "ADMIN";
    if (!isAdmin && submission.seller.userId !== user.id) throw new ForbiddenException();

    const editable = isAdmin
      ? ["PENDING_REVIEW", "AWAITING_MORE_INFO", "UNDER_NEGOTIATION"]
      : ["PENDING_REVIEW", "AWAITING_MORE_INFO"];
    if (!editable.includes(submission.status)) {
      throw new BadRequestException("This submission can no longer be edited");
    }
    return this.repo.updateContent(id, { ...dto });
  }

  async findById(id: string, user: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException("Submission not found");

    if (user.role === "SELLER" && submission.seller.userId !== user.id) {
      throw new ForbiddenException();
    }

    return submission;
  }

  async findMy(user: SessionUser, page: number, limit: number) {
    const sellerProfile = await this.db.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!sellerProfile) throw new ForbiddenException();
    return this.repo.findBySellerId(sellerProfile.id, page, limit);
  }

  async findReviewQueue(page: number, limit: number, status?: string) {
    return this.repo.findForReviewQueue(page, limit, status);
  }

  async review(id: string, dto: ReviewSubmission, admin: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException("Submission not found");

    const reviewableStatuses = ["PENDING_REVIEW", "AWAITING_MORE_INFO"];
    if (!reviewableStatuses.includes(submission.status)) {
      throw new BadRequestException(`Cannot review a submission with status ${submission.status}`);
    }

    const adminProfile = await this.db.adminProfile.findUnique({
      where: { userId: admin.id },
    });
    if (!adminProfile) throw new ForbiddenException();

    if (dto.decision === "ACCEPT") {
      // Approve → list live immediately. Pricing is automatic (seller price +
      // markup) and applied in createFromSubmission — no manual price entry.
      await this.repo.updateStatus(id, "ACCEPTED", {
        adminNote: dto.adminNote,
        reviewedById: adminProfile.id,
        reviewedAt: new Date(),
      });
      await this.itemsService.createFromSubmission(id);
      return this.repo.findById(id);
    }

    if (dto.decision === "REJECT") {
      const canResubmit = submission.resubmissionCount < 1;
      const cooldownUntil = canResubmit ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const updated = await this.repo.updateStatus(id, "REJECTED", {
        rejectionReason: dto.rejectionReason,
        rejectionNote: dto.rejectionNote,
        reviewedById: adminProfile.id,
        reviewedAt: new Date(),
        resubmissionCount: { increment: 1 },
        ...(cooldownUntil ? { cooldownUntil } : {}),
      });

      await this.notificationQueue.add(
        "submission-rejected",
        { submissionId: id, sellerId: submission.sellerId, canResubmit },
        JOB_OPTS
      );

      return updated;
    }

    if (dto.decision === "REQUEST_MORE_INFO") {
      const updated = await this.repo.updateStatus(id, "AWAITING_MORE_INFO", {
        moreInfoRequest: dto.moreInfoRequest,
      });

      await this.notificationQueue.add(
        "more-info-requested",
        { submissionId: id, sellerId: submission.sellerId },
        JOB_OPTS
      );

      return updated;
    }

    throw new BadRequestException("Invalid decision");
  }

  async respondToMoreInfo(id: string, additionalInfo: string, user: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException();
    if (submission.seller.userId !== user.id) throw new ForbiddenException();
    if (submission.status !== "AWAITING_MORE_INFO") {
      throw new BadRequestException("Submission is not awaiting more information");
    }

    // Append the seller's response to their description and reset to pending review
    const updatedDescription = `${submission.sellerDescription}\n\n---\nSeller response to admin request:\n${additionalInfo}`;

    return this.db.submission.update({
      where: { id },
      data: {
        sellerDescription: updatedDescription,
        moreInfoRequest: null,
        status: "PENDING_REVIEW",
      },
    });
  }
}
