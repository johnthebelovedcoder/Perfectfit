import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayoutsService } from "./payouts.service";

// Minimal mocks for DatabaseService + the notification queue.
function makeService() {
  const db = {
    order: { findUnique: vi.fn() },
    item: { findUnique: vi.fn() },
    payout: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    submission: { update: vi.fn(), updateMany: vi.fn() },
    adminProfile: { findUnique: vi.fn() },
    $transaction: vi.fn().mockResolvedValue([{ id: "payout1", status: "COMPLETED" }]),
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
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED", totalAmountKobo: 5000, orderItems: [{ priceKobo: 5000 }] });
    ctx.db.item.findUnique.mockResolvedValue(ITEM_WITH_SELLER);
    ctx.db.payout.findUnique.mockResolvedValue(null);
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).toHaveBeenCalledOnce();
    const arg = ctx.db.payout.create.mock.calls[0]![0];
    expect(arg.data).toMatchObject({ sellerId: "seller1", itemId: "item1", amountKobo: 5000, status: "QUEUED" });
    expect(ctx.db.submission.update).toHaveBeenCalledOnce();
    expect(ctx.queue.add).toHaveBeenCalledWith("payout-queued", expect.objectContaining({ itemId: "item1" }), expect.anything());
  });

  it("includes the shipping pass-through in the seller's payout amount", async () => {
    // Order total = item 5000 + shipping 699, single item → seller gets 5000 + 699.
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED", totalAmountKobo: 5699, orderItems: [{ priceKobo: 5000 }] });
    ctx.db.item.findUnique.mockResolvedValue(ITEM_WITH_SELLER);
    ctx.db.payout.findUnique.mockResolvedValue(null);
    await ctx.service.queuePayout("item1", "order1", new Date());
    const arg = ctx.db.payout.create.mock.calls[0]![0];
    expect(arg.data.amountKobo).toBe(5699);
  });

  it("is idempotent — skips when a payout already exists (job retry)", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED", totalAmountKobo: 5000, orderItems: [{ priceKobo: 5000 }] });
    ctx.db.item.findUnique.mockResolvedValue(ITEM_WITH_SELLER);
    ctx.db.payout.findUnique.mockResolvedValue({ id: "existing" });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });

  it("skips admin-uploaded items with no seller submission", async () => {
    ctx.db.order.findUnique.mockResolvedValue({ status: "DELIVERED", totalAmountKobo: 5000, orderItems: [{ priceKobo: 5000 }] });
    ctx.db.item.findUnique.mockResolvedValue({ id: "item1", submissionId: null, submission: null });
    await ctx.service.queuePayout("item1", "order1", new Date());
    expect(ctx.db.payout.create).not.toHaveBeenCalled();
  });
});

describe("PayoutsService.markAsPaid — KYC gate", () => {
  let ctx: ReturnType<typeof makeService>;
  const ADMIN = { id: "user-admin" } as never;

  function queuedPayoutForSeller(kycStatus: string) {
    return {
      id: "payout1",
      itemId: "item1",
      sellerId: "seller1",
      status: "QUEUED",
      seller: { id: "seller1", kycStatus, user: { email: "seller@thread.com" } },
      item: { id: "item1" },
    };
  }

  beforeEach(() => {
    ctx = makeService();
    ctx.db.adminProfile.findUnique.mockResolvedValue({ id: "admin1" });
  });

  for (const status of ["NOT_STARTED", "SUBMITTED", "REJECTED"]) {
    it(`refuses to release a payout when seller KYC is ${status}`, async () => {
      ctx.db.payout.findUnique.mockResolvedValue(queuedPayoutForSeller(status));
      await expect(ctx.service.markAsPaid("payout1", ADMIN)).rejects.toThrow(/KYC is not approved/);
      expect(ctx.db.$transaction).not.toHaveBeenCalled();
      expect(ctx.queue.add).not.toHaveBeenCalled();
    });
  }

  it("releases the payout once seller KYC is APPROVED", async () => {
    ctx.db.payout.findUnique.mockResolvedValue(queuedPayoutForSeller("APPROVED"));
    await ctx.service.markAsPaid("payout1", ADMIN);
    expect(ctx.db.$transaction).toHaveBeenCalledOnce();
    expect(ctx.queue.add).toHaveBeenCalledWith(
      "payout-processed",
      expect.objectContaining({ payoutId: "payout1" }),
      expect.anything()
    );
  });
});
