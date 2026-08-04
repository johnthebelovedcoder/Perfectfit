import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import type { CatalogueFilter } from "@thread/types";

@Injectable()
export class ItemsRepository {
  constructor(private db: DatabaseService) {}

  async findPublic(filter: CatalogueFilter) {
    const where: Record<string, unknown> = {
      isLive: true,
      deletedAt: null,
    };

    if (filter.category) where["category"] = filter.category;
    if (filter.condition) where["condition"] = filter.condition;
    if (filter.genderTarget) where["genderTarget"] = filter.genderTarget;
    if (filter.size) where["size"] = filter.size;
    if (filter.search) {
      where["OR"] = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { brand: { contains: filter.search, mode: "insensitive" } },
        { itemType: { contains: filter.search, mode: "insensitive" } },
      ];
    }
    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      where["retailPrice"] = {};
      if (filter.minPrice !== undefined) (where["retailPrice"] as Record<string, number>)["gte"] = filter.minPrice;
      if (filter.maxPrice !== undefined) (where["retailPrice"] as Record<string, number>)["lte"] = filter.maxPrice;
    }

    const select = {
      id: true,
      slug: true,
      title: true,
      description: true,
      category: true,
      itemType: true,
      brand: true,
      size: true,
      genderTarget: true,
      condition: true,
      photos: true,
      retailPrice: true,
      publishedAt: true,
    } as const;

    const orderBy =
      filter.sortBy === "price_asc"  ? { retailPrice: "asc" as const } :
      filter.sortBy === "price_desc" ? { retailPrice: "desc" as const } :
                                       { publishedAt: "desc" as const };

    // Wrapped in withRetry: the public catalogue is the hottest read path, so a
    // transient serverless-DB blip should retry rather than 500 the storefront.
    const rawItems = await this.db.withRetry(() =>
      filter.cursor
        ? this.db.item.findMany({ where, orderBy, take: filter.limit, cursor: { id: filter.cursor }, skip: 1, select })
        : this.db.item.findMany({ where, orderBy, take: filter.limit, select })
    );

    // Aggregate review stats in the DB (one grouped query) instead of loading
    // every rating row per item and averaging in JS.
    const ids = rawItems.map((i) => i.id);
    const aggregates = ids.length
      ? await this.db.review.groupBy({
          by: ["itemId"],
          where: { itemId: { in: ids } },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const statsById = new Map(
      aggregates.map((a) => [
        a.itemId,
        {
          reviewCount: a._count.rating,
          avgRating: a._avg.rating != null ? Math.round(a._avg.rating * 10) / 10 : null,
        },
      ])
    );

    const items = rawItems.map((i) => ({
      ...i,
      reviewCount: statsById.get(i.id)?.reviewCount ?? 0,
      avgRating: statsById.get(i.id)?.avgRating ?? null,
    }));

    const nextCursor = items.length === filter.limit ? (items[items.length - 1]?.id ?? null) : null;
    return { items, nextCursor, hasMore: items.length === filter.limit };
  }

  async findAllForAdmin(page: number, limit: number, search?: string) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) {
      where["OR"] = [
        { title: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      this.db.item.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { submission: { select: { seller: { select: { firstName: true, lastName: true } } } } },
      }),
      this.db.item.count({ where }),
    ]);
    return { items, total, hasMore: (page - 1) * limit + items.length < total };
  }

  /** Archived (soft-deleted) items only, newest-archived first. */
  async findArchived(page: number, limit: number, search?: string) {
    const where: Record<string, unknown> = { NOT: { deletedAt: null } };
    if (search) {
      where["OR"] = [
        { title: { contains: search, mode: "insensitive" } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }
    const [items, total] = await Promise.all([
      this.db.item.findMany({
        where,
        orderBy: { deletedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { submission: { select: { seller: { select: { firstName: true, lastName: true } } } } },
      }),
      this.db.item.count({ where }),
    ]);
    return { items, total, hasMore: (page - 1) * limit + items.length < total };
  }

  /** Restore an archived item — comes back offline (draft), ready to re-publish. */
  async restore(id: string) {
    return this.db.item.update({
      where: { id },
      data: { deletedAt: null },
    });
  }

  async findBySlug(slug: string) {
    const item = await this.db.withRetry(() =>
      this.db.item.findFirst({
        where: { slug, isLive: true, deletedAt: null },
      })
    );
    if (!item) return null;
    // Aggregate review stats in the DB rather than loading every rating row.
    const agg = await this.db.review.aggregate({
      where: { itemId: item.id },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const count = agg._count.rating;
    const avg = agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null;
    return { ...item, reviewCount: count, avgRating: avg };
  }

  async findById(id: string) {
    return this.db.item.findUnique({
      where: { id },
      include: { submission: { include: { seller: true } } },
    });
  }

  async createDirect(data: {
    slug: string;
    title: string;
    description: string;
    category: string;
    itemType: string;
    brand?: string;
    size: string;
    genderTarget: string;
    condition: string;
    photos: string[];
    retailPrice: number;
    agreedPayoutPrice: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.item.create({ data: data as any });
  }

  async create(data: {
    submissionId: string;
    slug: string;
    title: string;
    description: string;
    category: string;
    itemType: string;
    brand?: string;
    size: string;
    genderTarget: string;
    condition: string;
    photos: string[];
    retailPrice: number;
    agreedPayoutPrice: number;
  }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.db.item.create({ data: data as any });
  }

  async update(id: string, data: Record<string, unknown>) {
    return this.db.item.update({ where: { id }, data });
  }

  async publish(id: string) {
    return this.db.item.update({
      where: { id },
      data: { isLive: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string) {
    return this.db.item.update({
      where: { id },
      data: { isLive: false },
    });
  }

  async markSold(id: string) {
    return this.db.item.update({
      where: { id },
      data: { isLive: false, soldAt: new Date() },
    });
  }

  /**
   * Soft-delete (archive): sets deletedAt and drops the item offline. We never
   * hard-delete — items may be referenced by orders, payouts and reviews, and
   * every read path already filters `deletedAt: null`, so this removes it from
   * the storefront and admin catalogue while preserving history.
   */
  async softDelete(id: string) {
    return this.db.item.update({
      where: { id },
      data: { isLive: false, deletedAt: new Date() },
    });
  }
}
