import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { NotificationsController } from "./notifications.controller";
import { ContactController } from "./contact.controller";
import { NotificationsService } from "./notifications.service";
import { NotificationProcessor } from "./notification.processor";
import { NOTIFICATION_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [BullModule.registerQueue({ name: NOTIFICATION_QUEUE })],
  controllers: [NotificationsController, ContactController],
  providers: [NotificationsService, NotificationProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}
