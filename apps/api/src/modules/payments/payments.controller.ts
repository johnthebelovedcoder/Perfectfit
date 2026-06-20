import { Controller, Post, Body, Headers, RawBodyRequest, Req, HttpCode } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import { PaymentsService } from "./payments.service";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";
import type { Request } from "express";

const CheckoutSessionSchema = z.object({ orderId: z.string().min(1) });

@Controller()
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  /**
   * Storefront calls this after creating an order to get a Stripe Checkout URL.
   * Public because checkout is guest-based; the order itself is the authorization.
   */
  @Public()
  @Post("payments/checkout-session")
  @HttpCode(200)
  async createCheckoutSession(
    @Body(new ZodValidationPipe(CheckoutSessionSchema)) body: { orderId: string }
  ) {
    const data = await this.paymentsService.createCheckoutSession(body.orderId);
    return { data };
  }

  /** Stripe -> us. Verified by signature; the only place a payment is confirmed. */
  @Public()
  @SkipThrottle() // Stripe may send bursts/retries; signature verification is the gate here.
  @Post("webhooks/stripe")
  @HttpCode(200)
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    const raw = req.rawBody ?? Buffer.from("");
    return this.paymentsService.handleStripeWebhook(raw, signature);
  }
}
