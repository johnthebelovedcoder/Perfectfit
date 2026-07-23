import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { ItemsRepository } from "./items.repository";
import { DatabaseService } from "../../common/database/database.service";
import { NOTIFICATION_QUEUE, SEARCH_SYNC_QUEUE, IMAGE_MIGRATE_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import { generateItemSlug } from "@thread/utils";
import { categoryLabel } from "@thread/types";
import type { UpdateItem, CatalogueFilter, CreateItemDirect } from "@thread/types";
import type { Prisma } from "@thread/database";

@Injectable()
export class ItemsService {
  constructor(
    private repo: ItemsRepository,
    private db: DatabaseService,
    @InjectQueue(NOTIFICATION_QUEUE) private notificationQueue: Queue,
    @InjectQueue(SEARCH_SYNC_QUEUE) private searchSyncQueue: Queue,
    @InjectQueue(IMAGE_MIGRATE_QUEUE) private imageMigrateQueue: Queue
  ) {}

  async findPublic(filter: CatalogueFilter) {
    return this.repo.findPublic(filter);
  }

  async findAllForAdmin(page: number, limit: number, search?: string) {
    return this.repo.findAllForAdmin(page, limit, search);
  }

  async findBySlug(slug: string) {
    const item = await this.repo.findBySlug(slug);
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  async findById(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException("Item not found");
    return item;
  }

  async createDirect(dto: CreateItemDirect) {
    const slug = generateItemSlug(dto.title, Date.now().toString(36));
    return this.repo.createDirect({ ...dto, slug });
  }

  async createFromSubmission(submissionId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { item: true },
    });

    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.status !== "RECEIVED_AT_WAREHOUSE") {
      throw new BadRequestException("Item must be received at warehouse before listing");
    }
    if (submission.item) throw new BadRequestException("Item already created for this submission");
    if (!submission.retailPrice || !submission.agreedPayoutPrice) {
      throw new BadRequestException("Retail price and payout price must be set before listing");
    }

    const titleBase = `${submission.brand ?? submission.itemType} ${categoryLabel(submission.category)}`;
    const tempId = submission.id;
    const slug = generateItemSlug(titleBase, tempId);

    const item = await this.repo.create({
      submissionId,
      slug,
      title: titleBase,
      description: submission.adminDescription ?? submission.sellerDescription,
      category: submission.category,
      itemType: submission.itemType,
      brand: submission.brand ?? undefined,
      size: submission.size,
      genderTarget: submission.genderTarget,
      condition: submission.condition,
      photos: submission.photos,
      retailPrice: submission.retailPrice,
      agreedPayoutPrice: submission.agreedPayoutPrice,
    });

    await this.imageMigrateQueue.add(
      "migrate-images",
      { submissionId, itemId: item.id, photos: submission.photos },
      JOB_OPTS
    );

    return item;
  }

  async update(id: string, dto: UpdateItem) {
    await this.findById(id);
    const item = await this.repo.update(id, dto);

    if (item.isLive) {
      await this.searchSyncQueue.add("sync-item", { itemId: id, action: "update" }, JOB_OPTS);
    }

    return item;
  }

  async publish(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException();
    if (item.isLive) throw new BadRequestException("Item is already live");

    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.db.item.update({ where: { id }, data: { isLive: true, publishedAt: new Date() } }),
    ];
    if (item.submissionId) {
      ops.push(this.db.submission.update({ where: { id: item.submissionId }, data: { status: "LIVE" } }));
    }
    const [published] = await this.db.$transaction(ops);

    await Promise.all([
      this.searchSyncQueue.add("sync-item", { itemId: id, action: "publish" }, JOB_OPTS),
      ...(item.submissionId
        ? [this.notificationQueue.add("item-live", { itemId: id, submissionId: item.submissionId }, JOB_OPTS)]
        : []),
    ]);

    return published;
  }

  async unpublish(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException();

    const ops: Prisma.PrismaPromise<unknown>[] = [
      this.db.item.update({ where: { id }, data: { isLive: false } }),
    ];
    if (item.submissionId) {
      ops.push(this.db.submission.update({ where: { id: item.submissionId }, data: { status: "RECEIVED_AT_WAREHOUSE" } }));
    }
    const [unpublished] = await this.db.$transaction(ops);

    await this.searchSyncQueue.add("sync-item", { itemId: id, action: "unpublish" }, JOB_OPTS);

    return unpublished;
  }
}
