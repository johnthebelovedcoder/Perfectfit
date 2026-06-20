import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { PayoutsController } from "./payouts.controller";
import { PayoutsService } from "./payouts.service";
import { PayoutProcessor } from "./payout.processor";
import { PAYOUT_QUEUE, NOTIFICATION_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: PAYOUT_QUEUE },
      { name: NOTIFICATION_QUEUE }
    ),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService, PayoutProcessor],
  exports: [PayoutsService],
})
export class PayoutsModule {}
