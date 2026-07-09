import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";

// Same projection the public catalogue returns, so the storefront store can use
// these items directly.
const ITEM_SELECT = {
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

type Kind = "cart" | "wishlist";

// Minimal shared shape of the two saved-item delegates. Prisma types the union
// of both delegates as non-callable, so we project onto a common interface.
interface SavedDelegate {
  findMany(args: { where: { userId: string }; orderBy: { createdAt: "asc" } }): Promise<{ itemId: string }[]>;
  upsert(args: {
    where: { userId_itemId: { userId: string; itemId: string } };
    create: { userId: string; itemId: string };
    update: Record<string, never>;
  }): Promise<unknown>;
  deleteMany(args: { where: { userId: string; itemId?: { in: string[] } | string } }): Promise<unknown>;
}

@Injectable()
export class SavedService {
  constructor(private db: DatabaseService) {}

  private model(kind: Kind): SavedDelegate {
    return (kind === "cart" ? this.db.savedCartItem : this.db.savedWishlistItem) as unknown as SavedDelegate;
  }

  /** Hydrate saved item ids against live items, pruning any that are gone/sold. */
  private async hydrate(userId: string, kind: Kind) {
    const rows = await this.model(kind).findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    const ids = rows.map((r) => r.itemId);
    if (ids.length === 0) return [];

    const items = await this.db.item.findMany({
      where: { id: { in: ids }, isLive: true, deletedAt: null, soldAt: null },
      select: ITEM_SELECT,
    });

    // Prune saved rows whose item is no longer purchasable.
    const liveIds = new Set(items.map((i) => i.id));
    const staleIds = ids.filter((id) => !liveIds.has(id));
    if (staleIds.length) {
      await this.model(kind).deleteMany({ where: { userId, itemId: { in: staleIds } } });
    }

    // Preserve saved order.
    const byId = new Map(items.map((i) => [i.id, i]));
    return ids.map((id) => byId.get(id)).filter((i): i is NonNullable<typeof i> => Boolean(i));
  }

  getCart(userId: string) {
    return this.hydrate(userId, "cart");
  }

  getWishlist(userId: string) {
    return this.hydrate(userId, "wishlist");
  }

  async add(userId: string, kind: Kind, itemId: string) {
    await this.model(kind).upsert({
      where: { userId_itemId: { userId, itemId } },
      create: { userId, itemId },
      update: {},
    });
    return this.hydrate(userId, kind);
  }

  async remove(userId: string, kind: Kind, itemId: string) {
    await this.model(kind).deleteMany({ where: { userId, itemId } });
    return this.hydrate(userId, kind);
  }

  /** Union the local (device) item ids into the server set — used on login. */
  async merge(userId: string, kind: Kind, itemIds: string[]) {
    const unique = [...new Set(itemIds)].filter(Boolean);
    if (unique.length) {
      const model = this.model(kind);
      await Promise.all(
        unique.map((itemId) =>
          model.upsert({
            where: { userId_itemId: { userId, itemId } },
            create: { userId, itemId },
            update: {},
          })
        )
      );
    }
    return this.hydrate(userId, kind);
  }

  async clear(userId: string, kind: Kind) {
    await this.model(kind).deleteMany({ where: { userId } });
    return [];
  }
}
