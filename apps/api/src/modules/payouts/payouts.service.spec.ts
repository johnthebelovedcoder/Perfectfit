import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayoutsService } from "./payouts.service";

// Minimal mocks for DatabaseService + the notification queue.
function makeService() {
  const db = {
    order: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
    payout: { findUnique: vi.fn(), create: vi.fn() },
    submission: { update: vi.fn() },
  };
  const queue = { add: vi.fn() };
  const service = new PayoutsService(db as never, queue as never);
  return { service, db, queue };
}

const ITEM_WITH_SELLER = {
  id: "item1",
  submissionId: "sub1",
  agreedPayoutPrice: 5000,
  submission: { sellerId: "seller1" },
};

describe("PayoutsService.queuePayout — refund guard", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); });

  it("does NOT create a payout when the order was refunded", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "REFUNDED" });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
    expect(ctx.db.item.findUnique).not.toHaveBeenCalled();
  });

  it("does NOT create a payout when a return is still pending", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "RETURN_REQUESTED" });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });

  it("does NOT create a payout when the order was cancelled", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "CANCELLED" });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });

  it("creates a payout when the order is delivered and no payout exists", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED" });
    ctx.db.item.findUnique.mockResolvedValue(ITEM_WITH_SELLER);
    ctx.db.payout.findUnique.mockResolvedValue(null);
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).toHaveBeenCalledOnce();
    const arg = ctx.db.payout.create.mock.calls[0]![0];
    expect(arg.data).toMatchObject({ sellerId: "seller1", itemId: "item1", amountKobo: 5000, status: "QUEUED" });
    expect(ctx.db.submission.update).toHaveBeenCalledOnce();
    expect(ctx.queue.add).toHaveBeenCalledWith("payout-queued", expect.objectContaining({ itemId: "item1" }), expect.anything());
  });

  it("is idempotent — skips when a payout already exists (job retry)", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED" });
    ctx.db.item.findUnique.mockResolvedValue(ITEM_WITH_SELLER);
    ctx.db.payout.findUnique.mockResolvedValue({ id: "existing" });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });

  it("skips admin-uploaded items with no seller submission", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED" });
    ctx.db.item.findUnique.mockResolvedValue({ id: "item1", submissionId: null, submission: null });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });
});
