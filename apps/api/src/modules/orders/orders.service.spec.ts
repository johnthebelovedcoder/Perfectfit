import { describe, it, expect, vi, beforeEach } from "vitest";
import { OrdersService } from "./orders.service";

function makeService() {
  const repo = { findById: vi.fn(), updateStatus: vi.fn() };
  const db = {
    order: { update: vi.fn() },
    payout: { updateMany: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([]),
  };
  const notificationQueue = { add: vi.fn() };
  const payoutQueue = { add: vi.fn() };
  const service = new OrdersService(repo as never, db as never, notificationQueue as never, payoutQueue as never);
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
