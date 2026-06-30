import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { DatabaseService } from "../../common/database/database.service";
import { formatPrice } from "@thread/utils";
import {
  SubmissionReceived,
  SubmissionAccepted,
  SubmissionRejected,
  MoreInfoRequested,
  ItemLive,
  NegotiationOffer,
  ItemSold,
  PayoutProcessed,
  PayoutQueued,
  OrderConfirmation,
  OrderDispatched,
  OrderOutForDelivery,
  OrderDelivered,
} from "@thread/emails";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(
    private db: DatabaseService,
    private config: ConfigService
  ) {
    this.resend = new Resend(this.config.get<string>("RESEND_API_KEY"));
    // Use a verified-domain sender in production; onboarding@resend.dev works for testing.
    this.from = this.config.get<string>("RESEND_FROM") ?? "Perfect Fit <onboarding@resend.dev>";
  }

  private async sendEmail(to: string, subject: string, react: React.ReactElement) {
    const html = await render(react);
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to,
        subject,
        html,
        replyTo: "fgsperfectfit@gmail.com",
      });
      if (error) this.logger.error(`Resend error sending to ${to}: ${error.message}`);
    } catch (e) {
      this.logger.error(`Resend send failed to ${to}: ${e instanceof Error ? e.message : e}`);
    }
  }

  /** Delivers a customer contact-form message to the support inbox. */
  async sendContactMessage(input: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) {
    const support = "fgsperfectfit@gmail.com";
    const escape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const html = `
      <h2>New contact message</h2>
      <p><strong>From:</strong> ${escape(input.name)} &lt;${escape(input.email)}&gt;</p>
      <p><strong>Topic:</strong> ${escape(input.subject)}</p>
      <hr />
      <p style="white-space:pre-wrap">${escape(input.message)}</p>
    `;
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: support,
        subject: `[Contact] ${input.subject} — ${input.name}`,
        html,
        replyTo: input.email,
      });
      if (error) {
        this.logger.error(`Contact email failed: ${error.message}`);
        return false;
      }
      return true;
    } catch (e) {
      this.logger.error(`Contact email send failed: ${e instanceof Error ? e.message : e}`);
      return false;
    }
  }

  async handleSubmissionReceived(submissionId: string, sellerId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    const { seller } = submission;
    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    // Notify seller + write DB notification
    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Submission received — ${submission.itemType}`,
        SubmissionReceived({
          sellerFirstName: seller.firstName,
          submissionReference: submission.id.slice(-8).toUpperCase(),
          itemType: submission.itemType,
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "SUBMISSION_RECEIVED",
          title: "Submission received",
          body: `Your ${submission.itemType} submission is under review.`,
          submissionId,
        },
      }),
    ]);

    // Also notify all admins
    const admins = await this.db.adminProfile.findMany({ include: { user: true } });
    if (admins.length > 0) {
      await this.db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.userId,
          type: "NEW_SUBMISSION_ADMIN" as const,
          title: "New submission",
          body: `${seller.firstName} ${seller.lastName} submitted a ${submission.itemType} for review.`,
          submissionId,
        })),
      });
    }
  }

  async handleSubmissionAccepted(submissionId: string, sellerId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    const { seller } = submission;
    const warehouseAddress = this.config.get<string>("THREAD_WAREHOUSE_ADDRESS") ?? "";
    const warehouseContact = this.config.get<string>("THREAD_WAREHOUSE_CONTACT_NUMBER") ?? "";
    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Your ${submission.itemType} has been accepted`,
        SubmissionAccepted({
          sellerFirstName: seller.firstName,
          submissionReference: submission.id.slice(-8).toUpperCase(),
          itemType: submission.itemType,
          agreedPayoutFormatted: formatPrice(submission.agreedPayoutPrice ?? 0),
          warehouseAddress,
          warehouseContact,
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "SUBMISSION_ACCEPTED",
          title: "Submission accepted",
          body: `Your ${submission.itemType} was accepted. Please ship it to our warehouse.`,
          submissionId,
        },
      }),
    ]);
  }

  async handleSubmissionRejected(submissionId: string, sellerId: string, canResubmit: boolean) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    const { seller } = submission;
    const rejectionReasonMap: Record<string, string> = {
      ITEM_CONDITION_BELOW_STANDARD: "Item condition below standard",
      CATEGORY_NOT_ACCEPTED: "Category not currently accepted",
      PHOTOS_INSUFFICIENT: "Photos insufficient",
      ITEM_NOT_SELLABLE: "Item not sellable",
      OTHER: "Other",
    };

    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Update on your ${submission.itemType} submission`,
        SubmissionRejected({
          sellerFirstName: seller.firstName,
          submissionReference: submission.id.slice(-8).toUpperCase(),
          itemType: submission.itemType,
          rejectionReason: rejectionReasonMap[submission.rejectionReason ?? "OTHER"] ?? "Other",
          adminNote: submission.rejectionNote ?? undefined,
          canResubmit,
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "SUBMISSION_REJECTED",
          title: "Submission not accepted",
          body: `Your ${submission.itemType} was not accepted.`,
          submissionId,
        },
      }),
    ]);
  }

  async handleNegotiationOffer(submissionId: string, sellerId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    const { seller } = submission;
    // Link directly to the submission page — seller responds via the UI there
    const acceptUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}?action=accept`;
    const declineUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}?action=decline`;

    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Payout offer for your ${submission.itemType}`,
        NegotiationOffer({
          sellerFirstName: seller.firstName,
          submissionReference: submission.id.slice(-8).toUpperCase(),
          itemType: submission.itemType,
          originalPayoutFormatted: formatPrice(submission.desiredPayoutPrice),
          offeredPayoutFormatted: formatPrice(submission.agreedPayoutPrice ?? 0),
          adminNote: submission.adminNote ?? undefined,
          acceptUrl,
          declineUrl,
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "NEGOTIATION_OFFER",
          title: "Payout offer",
          body: `We've made a payout offer for your ${submission.itemType}.`,
          submissionId,
        },
      }),
    ]);
  }

  async handleMoreInfoRequested(submissionId: string, _sellerId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    const { seller } = submission;
    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    await Promise.all([
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "SUBMISSION_MORE_INFO",
          title: "Action needed on your submission",
          body: `We need more information about your ${submission.itemType} submission.`,
          submissionId,
        },
      }),
      this.sendEmail(
        seller.user.email,
        `We have a question about your ${submission.itemType} submission`,
        MoreInfoRequested({
          sellerFirstName: seller.firstName,
          submissionReference: submission.id.slice(-8).toUpperCase(),
          itemType: submission.itemType,
          question: submission.moreInfoRequest ?? "Our team has a question about your item.",
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ).catch(() => {}),
    ]);
  }

  async handleItemShipped(submissionId: string, _sellerId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { seller: { include: { user: true } } },
    });
    if (!submission) return;

    // Notify all admins that the item is on its way
    const admins = await this.db.adminProfile.findMany();
    if (admins.length > 0) {
      await this.db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.userId,
          type: "NEW_SUBMISSION_ADMIN" as const,
          title: "Item shipped by seller",
          body: `${submission.seller.firstName} ${submission.seller.lastName} has shipped their ${submission.itemType}. Awaiting warehouse receipt.`,
          submissionId,
        })),
      });
    }
  }

  async handleItemLive(itemId: string, submissionId: string) {
    const item = await this.db.item.findUnique({
      where: { id: itemId },
      include: { submission: { include: { seller: { include: { user: true } } } } },
    });
    if (!item || !item.submission) return;

    const { seller } = item.submission;
    const storefrontUrl = `${this.config.get("NEXT_PUBLIC_STOREFRONT_URL")}/item/${item.slug}`;

    await Promise.all([
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "ITEM_LIVE",
          title: "Your item is live!",
          body: `${item.title} is now live on the storefront.`,
          itemId,
          submissionId,
        },
      }),
      this.sendEmail(
        seller.user.email,
        `Your item is now live on Thread — ${item.title}`,
        ItemLive({
          sellerFirstName: seller.firstName,
          itemTitle: item.title,
          agreedPayoutFormatted: formatPrice(item.agreedPayoutPrice),
          storefrontUrl,
          sellerPortalUrl: `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`,
        }) as unknown as React.ReactElement
      ).catch(() => {}), // non-critical
    ]);
  }

  async handleItemSold(itemId: string, submissionId: string) {
    const item = await this.db.item.findUnique({
      where: { id: itemId },
      include: { submission: { include: { seller: { include: { user: true } } } } },
    });
    if (!item || !item.submission) return;

    const { seller } = item.submission;
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + 7);
    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Your item sold — payout incoming!`,
        ItemSold({
          sellerFirstName: seller.firstName,
          itemTitle: item.title,
          payoutFormatted: formatPrice(item.agreedPayoutPrice),
          settlementDate: settlementDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "ITEM_SOLD",
          title: "Your item sold!",
          body: `${item.title} has been sold. Payout incoming.`,
          itemId,
          submissionId,
        },
      }),
    ]);
  }

  async handlePayoutProcessed(payoutId: string, sellerId: string) {
    const payout = await this.db.payout.findUnique({
      where: { id: payoutId },
      include: {
        seller: { include: { user: true } },
        item: true,
      },
    });
    if (!payout) return;

    const { seller } = payout;

    await Promise.all([
      this.sendEmail(
        seller.user.email,
        `Payout sent — ${formatPrice(payout.amountKobo)}`,
        PayoutProcessed({
          sellerFirstName: seller.firstName,
          itemTitle: payout.item.title,
          payoutFormatted: formatPrice(payout.amountKobo),
          bankName: seller.bankName ?? "on file",
          transferReference: payout.transferReference ?? "N/A",
        }) as unknown as React.ReactElement
      ),
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "PAYOUT_PROCESSED",
          title: "Payout sent",
          body: `${formatPrice(payout.amountKobo)} has been sent to your account.`,
          payoutId,
          itemId: payout.itemId,
          submissionId: payout.item.submissionId,
        },
      }),
    ]);
  }

  async handleOrderPlaced(orderId: string, email: string) {
    const order = await this.db.order.findUnique({
      where: { id: orderId },
      include: { orderItems: { include: { item: { select: { title: true, retailPrice: true } } } } },
    });
    if (!order) return;

    // Notify all admins about the new order
    const admins = await this.db.adminProfile.findMany();
    if (admins.length > 0) {
      await this.db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.userId,
          type: "NEW_ORDER_ADMIN" as const,
          title: "New order received",
          body: `Order ${order.orderNumber} placed by ${order.firstName} ${order.lastName} — ${formatPrice(order.totalAmountKobo)}.`,
          orderId,
        })),
      });
    }

    const storeFrontUrl = this.config.get<string>("NEXT_PUBLIC_STOREFRONT_URL") ?? "";
    const trackingUrl = `${storeFrontUrl}/order/${order.guestToken ?? order.orderNumber}/track`;
    const address = `${order.addressLine1}, ${order.city}, ${order.state}`;

    const estDelivery = new Date();
    estDelivery.setDate(estDelivery.getDate() + 5);
    const estDeliveryStr = estDelivery.toLocaleDateString("en-US", { day: "numeric", month: "long" });

    await this.sendEmail(
      email,
      `Order confirmed — ${order.orderNumber}`,
      OrderConfirmation({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        items: order.orderItems.map((oi) => ({
          title: oi.item.title,
          priceFormatted: formatPrice(oi.priceKobo),
        })),
        totalFormatted: formatPrice(order.totalAmountKobo),
        deliveryAddress: address,
        estimatedDelivery: estDeliveryStr,
        trackingUrl,
      }) as unknown as React.ReactElement
    );
  }

  async handleOrderDispatched(orderId: string) {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const trackingUrl = `${this.config.get("NEXT_PUBLIC_STOREFRONT_URL")}/order/${order.guestToken ?? order.orderNumber}/track`;

    await this.sendEmail(
      order.email,
      "Your order is on its way",
      OrderDispatched({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        courierName: order.courierName ?? "our courier",
        trackingNumber: order.trackingNumber ?? undefined,
        trackingUrl,
      }) as unknown as React.ReactElement
    );
  }

  async handleOrderOutForDelivery(orderId: string) {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const trackingUrl = `${this.config.get("NEXT_PUBLIC_STOREFRONT_URL")}/order/${order.guestToken ?? order.orderNumber}/track`;

    await this.sendEmail(
      order.email,
      "Your order is out for delivery today",
      OrderOutForDelivery({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        courierName: order.courierName ?? "our courier",
        trackingNumber: order.trackingNumber ?? undefined,
        trackingUrl,
      }) as unknown as React.ReactElement
    );
  }

  async handleOrderDelivered(orderId: string) {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    const returnUrl = `${this.config.get("NEXT_PUBLIC_STOREFRONT_URL")}/order/${order.guestToken ?? order.orderNumber}/return`;

    await this.sendEmail(
      order.email,
      "Your order has been delivered",
      OrderDelivered({
        firstName: order.firstName,
        orderNumber: order.orderNumber,
        returnWindowHours: 48,
        returnUrl,
      }) as unknown as React.ReactElement
    );
  }

  async handlePayoutQueued(itemId: string, submissionId: string, sellerId: string) {
    const item = await this.db.item.findUnique({
      where: { id: itemId },
      include: { submission: { include: { seller: { include: { user: true } } } } },
    });
    if (!item || !item.submission) return;

    const { seller } = item.submission;
    const settlementDate = new Date();
    settlementDate.setDate(settlementDate.getDate() + 7);
    const portalUrl = `${this.config.get("NEXT_PUBLIC_SELLER_URL")}/submissions/${submissionId}`;

    await Promise.all([
      this.db.notification.create({
        data: {
          userId: seller.userId,
          type: "PAYOUT_QUEUED",
          title: "Payout scheduled",
          body: `Your payout of ${formatPrice(item.agreedPayoutPrice)} for ${item.title} is scheduled and will be sent within 7 days.`,
          itemId,
          submissionId,
        },
      }),
      this.sendEmail(
        seller.user.email,
        `Payout scheduled — ${formatPrice(item.agreedPayoutPrice)}`,
        PayoutQueued({
          sellerFirstName: seller.firstName,
          itemTitle: item.title,
          payoutFormatted: formatPrice(item.agreedPayoutPrice),
          expectedByDate: settlementDate.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }),
          sellerPortalUrl: portalUrl,
        }) as unknown as React.ReactElement
      ).catch(() => {}),
    ]);
  }

  async handleReturnRequested(orderId: string, reason: string) {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    // Notify all admins
    const admins = await this.db.adminProfile.findMany();
    if (admins.length > 0) {
      await this.db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.userId,
          type: "RETURN_REQUESTED" as const,
          title: "Return requested",
          body: `Order ${order.orderNumber} — ${order.firstName} ${order.lastName} requested a return. Reason: ${reason}`,
          orderId,
        })),
      });
    }
  }

  async getAll(userId: string) {
    return this.db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
  }

  async getUnread(userId: string) {
    return this.db.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.db.notification.findUnique({ where: { id } });
    if (!notification || notification.userId !== userId) {
      throw new Error("Notification not found");
    }
    return this.db.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    await this.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }
}
