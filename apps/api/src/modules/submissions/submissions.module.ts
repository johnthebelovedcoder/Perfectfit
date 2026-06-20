import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { SubmissionsController } from "./submissions.controller";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsRepository } from "./submissions.repository";
import { NOTIFICATION_QUEUE, IMAGE_MIGRATE_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: IMAGE_MIGRATE_QUEUE }
    ),
  ],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
