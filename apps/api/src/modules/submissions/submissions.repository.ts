import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import type { SubmissionStatus } from "@thread/types";

@Injectable()
export class SubmissionsRepository {
  constructor(private db: DatabaseService) {}

  async findById(id: string) {
    return this.db.submission.findUnique({
      where: { id },
      include: {
        seller: {
          include: {
            user: { select: { id: true, email: true, emailVerified: true, role: true } },
          },
        },
        reviewedBy: true,
        item: true,
      },
    });
  }

  async findBySellerId(sellerId: string, page: number, limit: number) {
    const [items, total] = await Promise.all([
      this.db.submission.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.db.submission.count({ where: { sellerId } }),
    ]);
    return { items, total };
  }

  async findForReviewQueue(page: number, limit: number, status?: string) {
    // "ALL" is a special sentinel meaning no filter; undefined/empty defaults to PENDING_REVIEW
    const where = status === "ALL"
      ? {}
      : { status: (status ?? "PENDING_REVIEW") as SubmissionStatus };
    const [items, total] = await Promise.all([
      this.db.submission.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { seller: { include: { user: true } } },
      }),
      this.db.submission.count({ where }),
    ]);
    return { items, total };
  }

  async create(data: {
    sellerId: string;
    category: string;
    itemType: string;
    brand?: string;
    size: string;
    genderTarget: string;
    condition: string;
    conditionNote?: string;
    photos: string[];
    sellerDescription: string;
    desiredPayoutPrice: number;
  }) {
    return this.db.submission.create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: data as any,
    });
  }

  async updateStatus(id: string, status: SubmissionStatus, extra?: Record<string, unknown>) {
    return this.db.submission.update({
      where: { id },
      data: { status, ...extra },
    });
  }
}
