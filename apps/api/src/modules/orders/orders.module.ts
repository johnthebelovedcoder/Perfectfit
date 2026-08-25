import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrdersRepository } from "./orders.repository";
import { OrdersProcessor } from "./orders.processor";
import { NOTIFICATION_QUEUE, PAYOUT_QUEUE, ORDERS_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: PAYOUT_QUEUE },
      { name: ORDERS_QUEUE }
    ),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersRepository, OrdersProcessor],
  exports: [OrdersService],
})
export class OrdersModule {}
