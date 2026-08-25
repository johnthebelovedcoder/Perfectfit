import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { ItemsRepository } from "./items.repository";
import { DatabaseService } from "../../common/database/database.service";
import { NOTIFICATION_QUEUE, SEARCH_SYNC_QUEUE, IMAGE_MIGRATE_QUEUE, JOB_OPTS } from "../../queues/queue.constants";
import { generateItemSlug, retailFromSellerPrice } from "@thread/utils";
import { categoryLabel } from "@thread/types";
import type { UpdateItem, CatalogueFilter, CreateItemDirect, SessionUser } from "@thread/types";
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

  async findArchived(page: number, limit: number, search?: string) {
    return this.repo.findArchived(page, limit, search);
  }

  /** Restore an archived item back to the catalogue (as an offline draft). */
  async restore(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException("Item not found");
    if (!item.deletedAt) throw new BadRequestException("Item is not archived");
    return this.repo.restore(id);
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
    // Admin-added items are published on creation; index them for search so they
    // show up on the storefront immediately without a separate publish step.
    const item = await this.repo.createDirect({ ...dto, slug });
    await this.searchSyncQueue.add("sync-item", { itemId: item.id, action: "publish" }, JOB_OPTS);
    return item;
  }

  /**
   * Turn an accepted seller submission into a LIVE catalogue item in one step.
   * Approved seller items go live immediately (like admin-added items) — there is
   * no separate ship-to-warehouse-then-publish gate. Idempotent: if the listing
   * already exists it just ensures it's live.
   */
  async createFromSubmission(submissionId: string) {
    const submission = await this.db.submission.findUnique({
      where: { id: submissionId },
      include: { item: true },
    });

    if (!submission) throw new NotFoundException("Submission not found");

    // Idempotent: listing already exists — make sure it's live and return it.
    if (submission.item) {
      if (!submission.item.isLive) {
        await this.repo.publish(submission.item.id);
        await this.db.submission.update({ where: { id: submissionId }, data: { status: "LIVE" } });
        await this.searchSyncQueue.add("sync-item", { itemId: submission.item.id, action: "publish" }, JOB_OPTS);
      }
      return submission.item;
    }

    // Listable once approved.
    const listable = ["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE"];
    if (!listable.includes(submission.status)) {
      throw new BadRequestException("Submission must be accepted before it can be listed");
    }

    // Automatic pricing: the seller receives exactly the price they set; buyers
    // pay that plus Perfect Fit's markup. No manual price entry.
    const agreedPayoutPrice = submission.desiredPayoutPrice;
    const retailPrice = retailFromSellerPrice(agreedPayoutPrice);

    const titleBase = `${submission.brand ?? submission.itemType} ${categoryLabel(submission.category)}`;
    const slug = generateItemSlug(titleBase, submission.id);

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
      retailPrice,
      agreedPayoutPrice,
    });

    // Go live immediately, mark the submission LIVE, and index for search.
    await this.repo.publish(item.id);
    await this.db.submission.update({ where: { id: submissionId }, data: { status: "LIVE" } });

    await Promise.all([
      this.searchSyncQueue.add("sync-item", { itemId: item.id, action: "publish" }, JOB_OPTS),
      this.imageMigrateQueue.add("migrate-images", { submissionId, itemId: item.id, photos: submission.photos }, JOB_OPTS),
      this.notificationQueue.add("item-live", { itemId: item.id, submissionId }, JOB_OPTS),
    ]);

    return { ...item, isLive: true };
  }

  /**
   * Edit a catalogue item (including live ones). Admins can edit any item;
   * sellers can edit only their own (items sourced from their submission), and
   * cannot change the retail price — their payout is fixed, so retail only moves
   * the platform's margin. Sold items are locked.
   */
  async update(id: string, dto: UpdateItem, user?: SessionUser) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException("Item not found");

    if (user?.role === "SELLER") {
      const profile = await this.db.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
      if (!profile || existing.submission?.sellerId !== profile.id) {
        throw new ForbiddenException("You can only edit your own items");
      }
      if (existing.soldAt) throw new BadRequestException("Sold items can no longer be edited");
      // Retail price is admin-controlled — strip it from seller edits.
      delete dto.retailPrice;
    }

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

  /**
   * Archive (soft-delete) an item: removes it from the storefront, admin catalogue
   * and search index while preserving order/payout history. A sold item is kept —
   * archiving it would hide it from the seller's own sales record.
   */
  async remove(id: string) {
    const item = await this.repo.findById(id);
    if (!item) throw new NotFoundException("Item not found");
    if (item.soldAt) throw new BadRequestException("Sold items cannot be archived");

    const archived = await this.repo.softDelete(id);
    // Drop it from the search index (reuses the "unpublish" action → removeItem).
    await this.searchSyncQueue.add("sync-item", { itemId: id, action: "unpublish" }, JOB_OPTS);

    return archived;
  }
}
