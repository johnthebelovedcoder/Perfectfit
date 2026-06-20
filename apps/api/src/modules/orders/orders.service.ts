import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { OrdersRepository } from "./orders.repository";
import { DatabaseService } from "../../common/database/database.service";
import { NOTIFICATION_QUEUE, PAYOUT_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import { generateGuestToken } from "@thread/utils";
import type { GuestCheckout, UpdateOrderStatus } from "@thread/types";

const SETTLEMENT_DAYS = 7;

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private repo: OrdersRepository,
    private db: DatabaseService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @InjectQueue(PAYOUT_QUEUE) private payoutQueue: Queue
  ) {}

  async createGuestOrder(dto: GuestCheckout) {
    const items = await this.db.withRetry(() => this.db.item.findMany({
      where: { id: { in: dto.itemIds }, isLive: true, deletedAt: null, soldAt: null },
    }));

    if (items.length !== dto.itemIds.length) {
      throw new BadRequestException("One or more items are unavailable");
    }

    const totalAmountKobo = items.reduce((sum, item) => sum + item.retailPrice, 0);
    const guestToken = generateGuestToken();

    const order = await this.repo.create({
      guestToken,
      guestEmail: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      addressLine1: dto.addressLine1,
      addressLine2: dto.addressLine2,
      city: dto.city,
      state: dto.state,
      postalCode: dto.postalCode,
      totalAmountKobo,
      paymentMethod: dto.paymentMethod,
      itemIds: dto.itemIds,
      itemPrices: items.map((item) => ({ itemId: item.id, priceKobo: item.retailPrice })),
    });

    await this.notificationQueue.add(
      "order-placed",
      { orderId: order.id, email: dto.email },
      JOB_OPTS
    );

    return { order, guestToken };
  }

  async confirmPayment(orderId: string, paymentReference: string) {
    const order = await this.repo.findById(orderId);
    if (!order) throw new NotFoundException("Order not found");
    if (order.paymentStatus === "PAID") {
      throw new BadRequestException("Order already paid — no duplicate charge");
    }

    const soldItemIds = order.orderItems.map((oi) => oi.itemId);
    const now = new Date();

    // Atomic: mark order paid + de-list items + advance submissions in one transaction
    await this.db.$transaction([
      this.db.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", paymentReference, paidAt: now, status: "PROCESSING" },
      }),
      this.db.item.updateMany({
        where: { id: { in: soldItemIds } },
        data: { isLive: false, soldAt: now },
      }),
      this.db.submission.updateMany({
        where: { item: { id: { in: soldItemIds } } },
        data: { status: "SOLD" as any },
      }),
    ]);

    // Notify seller(s) — orderItems include item via repo.findById
    for (const oi of order.orderItems) {
      const submissionId = oi.item?.submissionId;
      if (!submissionId) {
        this.logger.warn(`confirmPayment: orderItem ${oi.id} has no submissionId — skipping item-sold notification`);
        continue;
      }
      await this.notificationQueue.add(
        "item-sold",
        { itemId: oi.itemId, submissionId },
        JOB_OPTS
      );
    }

    return { confirmed: true };
  }

  async trackByToken(token: string) {
    const order = await this.repo.findByGuestToken(token);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  /** A buyer's order history, matched by their account email (includes guest orders). */
  async findMine(email: string) {
    return this.repo.findByEmail(email);
  }

  /** Fetch a full order (with items) — used by the payments module to build a Stripe session. */
  async getById(id: string) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException("Order not found");
    return order;
  }

  private static readonly ALLOWED_TRANSITIONS: Record<string, string[]> = {
    PLACED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["DISPATCHED", "CANCELLED"],
    DISPATCHED: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: ["RETURN_REQUESTED"],
    RETURN_REQUESTED: ["REFUNDED", "DELIVERED"],
  };

  async updateStatus(id: string, dto: UpdateOrderStatus) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException();

    const allowed = OrdersService.ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${dto.status}`
      );
    }

    const updated = await this.repo.updateStatus(id, {
      status: dto.status,
      ...(dto.trackingNumber ? { trackingNumber: dto.trackingNumber } : {}),
      ...(dto.courierName ? { courierName: dto.courierName } : {}),
      ...(dto.status === "DISPATCHED" ? { dispatchedAt: new Date() } : {}),
      ...(dto.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    });

    if (dto.status === "DISPATCHED") {
      await this.notificationQueue.add("order-dispatched", { orderId: id }, JOB_OPTS);
    }

    if (dto.status === "OUT_FOR_DELIVERY") {
      await this.notificationQueue.add("order-out-for-delivery", { orderId: id }, JOB_OPTS);
    }

    if (dto.status === "DELIVERED") {
      await this.notificationQueue.add("order-delivered", { orderId: id }, JOB_OPTS);

      const settlementDueAt = new Date();
      settlementDueAt.setDate(settlementDueAt.getDate() + SETTLEMENT_DAYS);

      for (const orderItem of order.orderItems) {
        await this.payoutQueue.add(
          "queue-payout",
          {
            itemId: orderItem.itemId,
            orderId: id,
            settlementDueAt: settlementDueAt.toISOString(),
          },
          { ...JOB_OPTS, delay: SETTLEMENT_DAYS * 24 * 60 * 60 * 1000 }
        );
      }
    }

    return updated;
  }

  async findAll(page: number, limit: number, status?: string) {
    return this.repo.findAll(page, limit, status);
  }

  async requestReturn(token: string, reason: string) {
    const order = await this.repo.findByGuestToken(token);
    if (!order) throw new NotFoundException("Order not found");
    if (order.status !== "DELIVERED") {
      throw new BadRequestException("Returns can only be requested for delivered orders");
    }

    // 48-hour return window — use deliveredAt if available, fall back to updatedAt
    const windowStart = order.deliveredAt ? new Date(order.deliveredAt) : new Date(order.updatedAt);
    const hoursElapsed = (Date.now() - windowStart.getTime()) / 3_600_000;
    if (hoursElapsed > 48) {
      throw new BadRequestException("The 48-hour return window has passed");
    }

    await this.repo.updateStatus(order.id, { status: "RETURN_REQUESTED" });
    await this.notificationQueue.add("return-requested", { orderId: order.id, reason }, JOB_OPTS);

    return { requested: true };
  }

  async processReturn(id: string, resolution: { approved: boolean; refundAmountKobo?: number }) {
    const order = await this.repo.findById(id);
    if (!order) throw new NotFoundException();
    if (order.status !== "RETURN_REQUESTED") throw new BadRequestException("No active return request");

    if (resolution.approved) {
      const soldItemIds = order.orderItems.map((oi) => oi.itemId);
      await this.db.$transaction([
        this.db.order.update({
          where: { id },
          data: {
            status: "REFUNDED",
            returnResolvedAt: new Date(),
            refundAmountKobo: resolution.refundAmountKobo ?? order.totalAmountKobo,
          },
        }),
        // Cancel any queued payouts for the returned items so sellers aren't paid for refunded goods
        this.db.payout.updateMany({
          where: { itemId: { in: soldItemIds }, status: "QUEUED" },
          data: { status: "FAILED" },
        }),
      ]);
    } else {
      // Return denied → buyer keeps the item, so the seller must still be paid.
      // Re-queue the payout (immediately; dup-guarded in queuePayout) in case the
      // original settlement job already fired while the order sat in RETURN_REQUESTED.
      await this.repo.updateStatus(id, { status: "DELIVERED", returnResolvedAt: new Date() });
      const settlementDueAt = new Date();
      for (const oi of order.orderItems) {
        await this.payoutQueue.add(
          "queue-payout",
          { itemId: oi.itemId, orderId: id, settlementDueAt: settlementDueAt.toISOString() },
          JOB_OPTS
        );
      }
    }

    return { processed: true };
  }
}
