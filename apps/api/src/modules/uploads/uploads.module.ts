import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { UploadsController } from "./uploads.controller";
import { UploadsService } from "./uploads.service";
import { ImageMigrateProcessor } from "./image-migrate.processor";
import { IMAGE_MIGRATE_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [BullModule.registerQueue({ name: IMAGE_MIGRATE_QUEUE })],
  controllers: [UploadsController],
  providers: [UploadsService, ImageMigrateProcessor],
  exports: [UploadsService],
})
export class UploadsModule {}
