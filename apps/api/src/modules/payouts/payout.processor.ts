import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { PayoutsService } from "./payouts.service";
import { PAYOUT_QUEUE } from "../../queues/queue.constants";

interface QueuePayoutJob {
  itemId: string;
  orderId: string;
  settlementDueAt: string;
}

@Processor(PAYOUT_QUEUE)
export class PayoutProcessor {
  constructor(private payoutsService: PayoutsService) {}

  @Process("queue-payout")
  async handleQueuePayout(job: Job<QueuePayoutJob>) {
    const { itemId, orderId, settlementDueAt } = job.data;
    await this.payoutsService.queuePayout(itemId, orderId, new Date(settlementDueAt));
  }
}
