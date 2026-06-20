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
import { NOTIFICATION_QUEUE, IMAGE_MIGRATE_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import type {
  CreateSubmission,
  ReviewSubmission,
  NegotiatePrice,
  SellerNegotiationResponse,
  SessionUser,
} from "@thread/types";

@Injectable()
export class SubmissionsService {
  constructor(
    private repo: SubmissionsRepository,
    private db: DatabaseService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @InjectQueue(IMAGE_MIGRATE_QUEUE) private imageMigrateQueue: Queue
  ) {}

  async create(dto: CreateSubmission, user: SessionUser) {
    const sellerProfile = await this.db.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!sellerProfile) throw new ForbiddenException("Seller profile required");
    if (!sellerProfile.isVerified) {
      throw new ForbiddenException("Seller account must be verified before submitting items");
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

    const reviewableStatuses = ["PENDING_REVIEW", "AWAITING_MORE_INFO", "UNDER_NEGOTIATION"];
    if (!reviewableStatuses.includes(submission.status)) {
      throw new BadRequestException(`Cannot review a submission with status ${submission.status}`);
    }

    const adminProfile = await this.db.adminProfile.findUnique({
      where: { userId: admin.id },
    });
    if (!adminProfile) throw new ForbiddenException();

    if (dto.decision === "ACCEPT") {
      const needsNegotiation = dto.agreedPayoutPrice !== submission.desiredPayoutPrice;
      const targetStatus = needsNegotiation ? "UNDER_NEGOTIATION" : "ACCEPTED";

      const updated = await this.repo.updateStatus(id, targetStatus, {
        retailPrice: dto.retailPrice,
        agreedPayoutPrice: dto.agreedPayoutPrice,
        adminNote: dto.adminNote,
        reviewedById: adminProfile.id,
        reviewedAt: new Date(),
      });

      if (needsNegotiation) {
        await this.notificationQueue.add(
          "negotiation-offer",
          { submissionId: id, sellerId: submission.sellerId },
          JOB_OPTS
        );
      } else {
        await this.notificationQueue.add(
          "submission-accepted",
          { submissionId: id, sellerId: submission.sellerId },
          JOB_OPTS
        );
      }

      return updated;
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

  async respondToNegotiation(id: string, dto: SellerNegotiationResponse, user: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException();
    if (submission.seller.userId !== user.id) throw new ForbiddenException();
    if (submission.status !== "UNDER_NEGOTIATION") {
      throw new BadRequestException("Submission is not awaiting negotiation response");
    }

    if (dto.accept) {
      await this.repo.updateStatus(id, "ACCEPTED");
      await this.notificationQueue.add(
        "submission-accepted",
        { submissionId: id, sellerId: submission.sellerId },
        JOB_OPTS
      );
    } else {
      // Seller declined — mark rejected so it doesn't re-enter the review queue
      await this.db.submission.update({
        where: { id },
        data: {
          status: "REJECTED" as any,
          rejectionReason: "OTHER",
          rejectionNote: "Seller declined the counter-offer.",
        },
      });
      await this.notificationQueue.add(
        "submission-rejected",
        { submissionId: id, sellerId: submission.sellerId, canResubmit: true },
        JOB_OPTS
      );
    }

    return { accepted: dto.accept };
  }

  async markShipped(id: string, user: SessionUser) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException();
    if (submission.seller.userId !== user.id) throw new ForbiddenException();
    if (submission.status !== "ACCEPTED") {
      throw new BadRequestException("Submission must be ACCEPTED before marking as shipped");
    }

    const updated = await this.repo.updateStatus(id, "AWAITING_SHIPMENT");

    await this.notificationQueue.add(
      "item-shipped",
      { submissionId: id, sellerId: submission.sellerId },
      JOB_OPTS
    );

    return updated;
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

  async markReceived(id: string) {
    const submission = await this.repo.findById(id);
    if (!submission) throw new NotFoundException();
    if (submission.status !== "AWAITING_SHIPMENT") {
      throw new BadRequestException("Item must be in AWAITING_SHIPMENT status before warehouse receipt");
    }

    return this.repo.updateStatus(id, "RECEIVED_AT_WAREHOUSE");
  }
}
