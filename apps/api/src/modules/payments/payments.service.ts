import { Injectable, BadRequestException, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe = require("stripe");
import { calculateShippingCents } from "@thread/utils";
import { OrdersService } from "../orders/orders.service";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly stripe: Stripe.Stripe;

  constructor(
    private config: ConfigService,
    private ordersService: OrdersService
  ) {
    this.stripe = new Stripe(this.config.get<string>("STRIPE_SECRET_KEY")!);
  }

  /**
   * Create an EMBEDDED Stripe Checkout Session for an existing (unpaid) order.
   * Returns the session client_secret the storefront mounts on-page (card form +
   * wallets). Payment is NEVER confirmed here — only the signed webhook can do that.
   */
  async createCheckoutSession(orderId: string): Promise<{ clientSecret: string }> {
    const order = await this.ordersService.getById(orderId);

    if (order.paymentStatus === "PAID") {
      throw new BadRequestException("Order is already paid");
    }

    const storefrontUrl = this.config.get<string>("NEXT_PUBLIC_STOREFRONT_URL");

    const subtotal = order.orderItems.reduce((sum, oi) => sum + oi.priceKobo, 0);
    const shipping = calculateShippingCents(subtotal);

    const itemLineItems = order.orderItems.map((oi) => ({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: oi.priceKobo, // integer cents
        product_data: {
          name: oi.item?.title ?? "Item",
          ...(oi.item?.photos?.length ? { images: [oi.item.photos[0]!] } : {}),
        },
      },
    }));

    const shippingLineItem =
      shipping > 0
        ? [
            {
              quantity: 1,
              price_data: {
                currency: "usd",
                unit_amount: shipping,
                product_data: { name: "Shipping" },
              },
            },
          ]
        : [];

    let session: Awaited<ReturnType<typeof this.stripe.checkout.sessions.create>>;
    try {
      session = await this.stripe.checkout.sessions.create({
        // `embedded` is a stable Stripe feature; the pinned SDK's UiMode type lags behind.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ui_mode: "embedded" as any,
        mode: "payment",
        customer_email: order.email,
        line_items: [...itemLineItems, ...shippingLineItem],
        // The webhook trusts ONLY this server-set metadata, never client input.
        metadata: { orderId: order.id },
        payment_intent_data: { metadata: { orderId: order.id } },
        // Stripe redirects here after payment; the webhook is the source of truth.
        return_url: `${storefrontUrl}/order/${order.guestToken}/track?placed=1`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Stripe checkout.sessions.create failed for order ${order.id}: ${msg}`);
      // Surface the real Stripe reason to the client instead of a generic 500.
      throw new BadRequestException(`Could not start payment: ${msg}`);
    }

    if (!session.client_secret) throw new BadRequestException("Failed to create checkout session");
    return { clientSecret: session.client_secret };
  }

  /**
   * Verify and process a Stripe webhook. Confirmation of payment happens
   * exclusively here, after Stripe's signature is cryptographically verified.
   */
  async handleStripeWebhook(rawBody: Buffer | string, signature: string) {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET")!;

    const event = (() => {
      try {
        return this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
      } catch (err) {
        this.logger.warn(`Stripe webhook signature verification failed: ${err instanceof Error ? err.message : err}`);
        throw new UnauthorizedException("Invalid Stripe signature");
      }
    })();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Only treat fully-paid sessions as confirmed.
      if (session.payment_status !== "paid") {
        this.logger.warn(`checkout.session.completed but payment_status=${session.payment_status}; ignoring`);
        return { received: true };
      }
      const orderId = session.metadata?.["orderId"];
      if (!orderId) {
        this.logger.error("checkout.session.completed missing metadata.orderId");
        return { received: true };
      }
      const reference =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? session.id;

      // confirmPayment is idempotent (rejects already-PAID orders), so webhook retries are safe.
      try {
        await this.ordersService.confirmPayment(orderId, reference);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("already paid")) {
          this.logger.log(`Order ${orderId} already paid — ignoring duplicate webhook`);
        } else {
          throw err;
        }
      }
    }

    return { received: true };
  }
}
