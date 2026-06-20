import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { ItemsController } from "./items.controller";
import { ItemsService } from "./items.service";
import { ItemsRepository } from "./items.repository";
import { NOTIFICATION_QUEUE, SEARCH_SYNC_QUEUE, IMAGE_MIGRATE_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [
    BullModule.registerQueue(
      { name: NOTIFICATION_QUEUE },
      { name: SEARCH_SYNC_QUEUE },
      { name: IMAGE_MIGRATE_QUEUE }
    ),
  ],
  controllers: [ItemsController],
  providers: [ItemsService, ItemsRepository],
  exports: [ItemsService],
})
export class ItemsModule {}
