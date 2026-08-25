import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { OrdersService } from "./orders.service";
import { ORDERS_QUEUE } from "../../queues/queue.constants";

interface AutoConfirmJob {
  orderId: string;
}

@Processor(ORDERS_QUEUE)
export class OrdersProcessor {
  constructor(private ordersService: OrdersService) {}

  /** Fires AUTO_CONFIRM_DAYS after dispatch; confirms receipt if the buyer hasn't. */
  @Process("auto-confirm-receipt")
  async handleAutoConfirm(job: Job<AutoConfirmJob>) {
    await this.ordersService.autoConfirmReceipt(job.data.orderId);
  }
}
