import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdersService } from "./orders.service";

function makeService() {
  const repo = { findById: vi.fn(), updateStatus: vi.fn() };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = {
    order: { update: vi.fn().mockResolvedValue({}) },
    item: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    submission: { updateMany: vi.fn().mockResolvedValue({}) },
    payout: { updateMany: vi.fn() },
  };
  // Support both interactive ($transaction(fn)) and array ($transaction([...])) forms.
  db.$transaction = vi.fn().mockImplementation((arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: unknown) => unknown)(db) : Promise.all(arg as unknown[])
  );
  const notificationQueue = { add: vi.fn() };
  const payoutQueue = { add: vi.fn() };
  // Dummy key so the Stripe client constructs; refunds are only exercised for PAID orders.
  const config = { get: vi.fn().mockReturnValue("sk_test_dummy") };
  const service = new OrdersService(repo as never, db as never, config as never, notificationQueue as never, payoutQueue as never);
  return { service, repo, db, notificationQueue, payoutQueue };
}

describe("OrdersService.updateStatus — state machine", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); ctx.repo.updateStatus.mockResolvedValue({}); });

  it("rejects an illegal transition (PLACED -> DELIVERED)", async () => {
    ctx.repo.findById.mockResolvedValue({ id: "o1", status: "PLACED", orderItems: [] });
    await expect(ctx.service.updateStatus("o1", { status: "DELIVERED" } as never))
      .rejects.toThrow(/Cannot transition/);
    expect(ctx.repo.updateStatus).not.toHaveBeenCalled();
  });

  it("allows PROCESSING -> DISPATCHED and enqueues the dispatch notification", async () => {
    ctx.repo.findById.mockResolvedValue({ id: "o1", status: "PROCESSING", orderItems: [] });
    await ctx.service.updateStatus("o1", { status: "DISPATCHED" } as never);
    expect(ctx.repo.updateStatus).toHaveBeenCalledOnce();
    expect(ctx.notificationQueue.add).toHaveBeenCalledWith("order-dispatched", { orderId: "o1" }, expect.anything());
  });

  it("on DELIVERED, schedules a delayed payout job per order item", async () => {
    ctx.repo.findById.mockResolvedValue({
      id: "o1", status: "OUT_FOR_DELIVERY",
      orderItems: [{ itemId: "i1" }, { itemId: "i2" }],
    });
    await ctx.service.updateStatus("o1", { status: "DELIVERED" } as never);
    const payoutCalls = ctx.payoutQueue.add.mock.calls.filter((c) => c[0] === "queue-payout");
    expect(payoutCalls).toHaveLength(2);
    // payout jobs carry orderId (needed for the refund guard) and a delay
    expect(payoutCalls[0]![1]).toMatchObject({ itemId: "i1", orderId: "o1" });
    expect(payoutCalls[0]![2]).toHaveProperty("delay");
    expect((payoutCalls[0]![2] as { delay: number }).delay).toBeGreaterThan(0);
  });
});

describe("OrdersService.processReturn", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); ctx.repo.updateStatus.mockResolvedValue({}); });

  it("approved → refunds and does NOT re-queue payouts", async () => {
    ctx.repo.findById.mockResolvedValue({ id: "o1", status: "RETURN_REQUESTED", totalAmountKobo: 9000, orderItems: [{ itemId: "i1" }] });
    await ctx.service.processReturn("o1", { approved: true });
    expect(ctx.db.$transaction).toHaveBeenCalledOnce();
    const payoutJobs = ctx.payoutQueue.add.mock.calls.filter((c) => c[0] === "queue-payout");
    expect(payoutJobs).toHaveLength(0);
  });

  it("denied → returns to DELIVERED and re-queues a payout so the seller is still paid", async () => {
    ctx.repo.findById.mockResolvedValue({ id: "o1", status: "RETURN_REQUESTED", orderItems: [{ itemId: "i1" }, { itemId: "i2" }] });
    await ctx.service.processReturn("o1", { approved: false });
    expect(ctx.repo.updateStatus).toHaveBeenCalledWith("o1", expect.objectContaining({ status: "DELIVERED" }));
    const payoutJobs = ctx.payoutQueue.add.mock.calls.filter((c) => c[0] === "queue-payout");
    expect(payoutJobs).toHaveLength(2);
    expect(payoutJobs[0]![1]).toMatchObject({ itemId: "i1", orderId: "o1" });
  });

  it("rejects resolving an order with no active return", async () => {
    ctx.repo.findById.mockResolvedValue({ id: "o1", status: "DELIVERED", orderItems: [] });
    await expect(ctx.service.processReturn("o1", { approved: true })).rejects.toThrow(/No active return/);
  });
});

describe("OrdersService.confirmPayment — concurrent double-sale", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); });

  it("claims all items → marks PAID and notifies the seller", async () => {
    ctx.repo.findById.mockResolvedValue({
      id: "o1", paymentStatus: "PENDING",
      orderItems: [{ itemId: "i1", item: { submissionId: "s1" } }],
    });
    ctx.db.item.updateMany.mockResolvedValue({ count: 1 }); // item was available

    const res = await ctx.service.confirmPayment("o1", "pi_1");

    expect(res).toEqual({ confirmed: true });
    const soldJobs = ctx.notificationQueue.add.mock.calls.filter((c) => c[0] === "item-sold");
    expect(soldJobs).toHaveLength(1);
  });

  it("item already sold by a concurrent order → refunds the buyer and cancels", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const refundCreate = vi.fn().mockResolvedValue({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (ctx.service as any).stripe = { refunds: { create: refundCreate } };
    ctx.repo.findById.mockResolvedValue({
      id: "o1", paymentStatus: "PENDING", totalAmountKobo: 5699,
      orderItems: [{ itemId: "i1", item: { submissionId: "s1" } }],
    });
    ctx.db.item.updateMany.mockResolvedValue({ count: 0 }); // nothing left to claim

    const res = await ctx.service.confirmPayment("o1", "pi_123");

    expect(res).toMatchObject({ confirmed: false, oversold: true, refunded: true });
    expect(refundCreate).toHaveBeenCalledWith(expect.objectContaining({ payment_intent: "pi_123", amount: 5699 }));
    expect(ctx.db.order.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "CANCELLED", paymentStatus: "REFUNDED" }) })
    );
    // The seller must NOT be told the item sold.
    const soldJobs = ctx.notificationQueue.add.mock.calls.filter((c) => c[0] === "item-sold");
    expect(soldJobs).toHaveLength(0);
  });
});
