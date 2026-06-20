import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { DatabaseService } from "../../common/database/database.service";
import { NOTIFICATION_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import type { SessionUser } from "@thread/types";

// Order states in which a settled item must NOT be paid out to the seller.
const NON_PAYABLE_ORDER_STATUSES = ["REFUNDED", "RETURN_REQUESTED", "CANCELLED"];

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private db: DatabaseService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue
  ) {}

  async findAll(page: number, limit: number, status?: string) {
    const where = status ? { status: status as "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" } : {};
    const [items, total] = await Promise.all([
      this.db.payout.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          seller: { include: { user: { select: { email: true } } } },
          item: { select: { title: true, retailPrice: true } },
        },
      }),
      this.db.payout.count({ where }),
    ]);
    return { items, total };
  }

  async markAsPaid(id: string, admin: SessionUser) {
    const payout = await this.db.payout.findUnique({
      where: { id },
      include: { seller: { include: { user: true } }, item: true },
    });
    if (!payout) throw new NotFoundException("Payout not found");
    if (payout.status !== "QUEUED") throw new BadRequestException("Payout is not in QUEUED status");

    const adminProfile = await this.db.adminProfile.findUnique({
      where: { userId: admin.id },
    });
    if (!adminProfile) throw new ForbiddenException();

    const transferReference = `TH-PAY-${Date.now()}`;

    const [updated] = await this.db.$transaction([
      this.db.payout.update({
        where: { id },
        data: {
          status: "COMPLETED",
          processedById: adminProfile.id,
          processedAt: new Date(),
          transferReference,
        },
      }),
      this.db.submission.updateMany({
        where: { item: { id: payout.itemId } },
        data: { status: "PAYOUT_PROCESSED" },
      }),
    ]);

    await this.notificationQueue.add(
      "payout-processed",
      { payoutId: id, sellerId: payout.sellerId },
      JOB_OPTS
    );

    return updated;
  }

  async queuePayout(itemId: string, orderId: string, settlementDueAt: Date) {
    // Critical guard: by the time this delayed settlement job fires, the order
    // may have been returned/refunded/cancelled. Never pay out in those cases —
    // the queued-payout cancellation in processReturn only covers payouts that
    // already exist, not this still-pending job.
    if (orderId) {
      const order = await this.db.order.findUnique({ where: { id: orderId }, select: { status: true } });
      if (order && NON_PAYABLE_ORDER_STATUSES.includes(order.status)) {
        this.logger.warn(`Skipping payout for item ${itemId}: order ${orderId} is ${order.status}`);
        return;
      }
    }

    const item = await this.db.item.findUnique({
      where: { id: itemId },
      include: { submission: true },
    });
    if (!item) return;
    // Admin-uploaded items (no submission/seller) don't need a payout
    if (!item.submissionId || !item.submission) return;

    // Guard against duplicate payouts (e.g. if the job is retried)
    const existing = await this.db.payout.findUnique({ where: { itemId } });
    if (existing) return;

    await this.db.payout.create({
      data: {
        sellerId: item.submission.sellerId,
        itemId,
        amountKobo: item.agreedPayoutPrice,
        status: "QUEUED",
        settlementDueAt,
      },
    });

    await this.db.submission.update({
      where: { id: item.submissionId },
      data: { status: "PAYOUT_QUEUED" },
    });

    await this.notificationQueue.add(
      "payout-queued",
      { itemId, submissionId: item.submissionId, sellerId: item.submission.sellerId },
      JOB_OPTS
    );
  }
}
