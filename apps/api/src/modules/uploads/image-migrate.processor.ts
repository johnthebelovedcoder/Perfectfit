import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { UploadsService } from "./uploads.service";
import { DatabaseService } from "../../common/database/database.service";
import { IMAGE_MIGRATE_QUEUE } from "../../queues/queue.constants";

interface MigrateImagesJob {
  submissionId: string;
  itemId: string;
  photos: string[];
}

@Processor(IMAGE_MIGRATE_QUEUE)
export class ImageMigrateProcessor {
  constructor(
    private uploadsService: UploadsService,
    private db: DatabaseService
  ) {}

  @Process("migrate-images")
  async handleMigrateImages(job: Job<MigrateImagesJob>) {
    const { itemId, photos } = job.data;

    const newPublicIds = await Promise.all(
      photos.map((p) => this.uploadsService.migrateImage(p))
    );

    await this.db.item.update({
      where: { id: itemId },
      data: { photos: newPublicIds },
    });
  }
}
