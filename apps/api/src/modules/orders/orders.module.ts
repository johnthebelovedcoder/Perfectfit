import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrdersRepository } from "./orders.repository";
import { NOTIFICATION_QUEUE, PAYOUT_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: PAYOUT_QUEUE }
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository],
  exports: [OrdersService],
})
export class OrdersModule {}
