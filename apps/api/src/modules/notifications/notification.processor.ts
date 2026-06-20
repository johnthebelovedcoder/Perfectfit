import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { NotificationsService } from "./notifications.service";
import { NOTIFICATION_QUEUE } from "../../queues/queue.constants";

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor {
  constructor(private notificationsService: NotificationsService) {}

  @Process("submission-received")
  async onSubmissionReceived(job: Job<{ submissionId: string; sellerId: string }>) {
    await this.notificationsService.handleSubmissionReceived(job.data.submissionId, job.data.sellerId);
  }

  @Process("submission-accepted")
  async onSubmissionAccepted(job: Job<{ submissionId: string; sellerId: string }>) {
    await this.notificationsService.handleSubmissionAccepted(job.data.submissionId, job.data.sellerId);
  }

  @Process("submission-rejected")
  async onSubmissionRejected(job: Job<{ submissionId: string; sellerId: string; canResubmit: boolean }>) {
    await this.notificationsService.handleSubmissionRejected(job.data.submissionId, job.data.sellerId, job.data.canResubmit);
  }

  @Process("negotiation-offer")
  async onNegotiationOffer(job: Job<{ submissionId: string; sellerId: string }>) {
    await this.notificationsService.handleNegotiationOffer(job.data.submissionId, job.data.sellerId);
  }

  @Process("item-live")
  async onItemLive(job: Job<{ itemId: string; submissionId: string }>) {
    await this.notificationsService.handleItemLive(job.data.itemId, job.data.submissionId);
  }

  @Process("item-sold")
  async onItemSold(job: Job<{ itemId: string; submissionId: string }>) {
    await this.notificationsService.handleItemSold(job.data.itemId, job.data.submissionId);
  }

  @Process("payout-processed")
  async onPayoutProcessed(job: Job<{ payoutId: string; sellerId: string }>) {
    await this.notificationsService.handlePayoutProcessed(job.data.payoutId, job.data.sellerId);
  }

  @Process("order-placed")
  async onOrderPlaced(job: Job<{ orderId: string; email: string }>) {
    await this.notificationsService.handleOrderPlaced(job.data.orderId, job.data.email);
  }

  @Process("order-dispatched")
  async onOrderDispatched(job: Job<{ orderId: string }>) {
    await this.notificationsService.handleOrderDispatched(job.data.orderId);
  }

  @Process("order-out-for-delivery")
  async onOrderOutForDelivery(job: Job<{ orderId: string }>) {
    await this.notificationsService.handleOrderOutForDelivery(job.data.orderId);
  }

  @Process("order-delivered")
  async onOrderDelivered(job: Job<{ orderId: string }>) {
    await this.notificationsService.handleOrderDelivered(job.data.orderId);
  }

  @Process("more-info-requested")
  async onMoreInfoRequested(job: Job<{ submissionId: string; sellerId: string }>) {
    await this.notificationsService.handleMoreInfoRequested(job.data.submissionId, job.data.sellerId);
  }

  @Process("item-shipped")
  async onItemShipped(job: Job<{ submissionId: string; sellerId: string }>) {
    await this.notificationsService.handleItemShipped(job.data.submissionId, job.data.sellerId);
  }

  @Process("return-requested")
  async onReturnRequested(job: Job<{ orderId: string; reason: string }>) {
    await this.notificationsService.handleReturnRequested(job.data.orderId, job.data.reason);
  }

  @Process("payout-queued")
  async onPayoutQueued(job: Job<{ itemId: string; submissionId: string; sellerId: string }>) {
    await this.notificationsService.handlePayoutQueued(job.data.itemId, job.data.submissionId, job.data.sellerId);
  }
}
