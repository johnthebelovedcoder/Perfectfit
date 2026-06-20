import { describe, it, expect, vi, beforeEach } from "vitest";
import { UnauthorizedException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

function makeService() {
  const config = { get: vi.fn((k: string) => (k === "STRIPE_SECRET_KEY" ? "sk_test_x" : k === "STRIPE_WEBHOOK_SECRET" ? "whsec_x" : "http://localhost:3000")) };
  const ordersService = { confirmPayment: vi.fn(), getById: vi.fn() };
  const service = new PaymentsService(config as never, ordersService as never);
  // Replace the real Stripe client with a controllable mock.
  const constructEvent = vi.fn();
  (service as unknown as { stripe: unknown }).stripe = { webhooks: { constructEvent } };
  return { service, ordersService, constructEvent };
}

describe("PaymentsService.handleStripeWebhook", () => {
  let ctx: ReturnType<typeof makeService>;
  beforeEach(() => { ctx = makeService(); });

  it("rejects an invalid signature and never confirms payment", async () => {
    ctx.constructEvent.mockImplementation(() => { throw new Error("bad sig"); });
    await expect(ctx.service.handleStripeWebhook(Buffer.from("{}"), "sig")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(ctx.ordersService.confirmPayment).not.toHaveBeenCalled();
  });

  it("confirms payment for a paid checkout.session.completed using the server-set orderId", async () => {
    ctx.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { payment_status: "paid", metadata: { orderId: "order123" }, payment_intent: "pi_123", id: "cs_1" } },
    });
    ctx.ordersService.confirmPayment.mockResolvedValue({ confirmed: true });
    const res = await ctx.service.handleStripeWebhook(Buffer.from("{}"), "sig");
    expect(ctx.ordersService.confirmPayment).toHaveBeenCalledWith("order123", "pi_123");
    expect(res).toEqual({ received: true });
  });

  it("ignores a session that is not fully paid", async () => {
    ctx.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { payment_status: "unpaid", metadata: { orderId: "order123" }, payment_intent: "pi_123" } },
    });
    await ctx.service.handleStripeWebhook(Buffer.from("{}"), "sig");
    expect(ctx.ordersService.confirmPayment).not.toHaveBeenCalled();
  });

  it("ignores events other than checkout.session.completed", async () => {
    ctx.constructEvent.mockReturnValue({ type: "payment_intent.created", data: { object: {} } });
    await ctx.service.handleStripeWebhook(Buffer.from("{}"), "sig");
    expect(ctx.ordersService.confirmPayment).not.toHaveBeenCalled();
  });

  it("swallows duplicate deliveries (order already paid) without throwing", async () => {
    ctx.constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { payment_status: "paid", metadata: { orderId: "order123" }, payment_intent: "pi_123", id: "cs_1" } },
    });
    ctx.ordersService.confirmPayment.mockRejectedValue(new Error("Order already paid — no duplicate charge"));
    await expect(ctx.service.handleStripeWebhook(Buffer.from("{}"), "sig")).resolves.toEqual({ received: true });
  });
});
