import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { algoliasearch } from "algoliasearch";
import { DatabaseService } from "../../common/database/database.service";

export interface SearchHit {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  retailPrice: number;
  photos: string[];
  condition: string;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly client: ReturnType<typeof algoliasearch> | null;
  private readonly indexName: string;

  constructor(
    private config: ConfigService,
    private db: DatabaseService
  ) {
    const appId = config.get<string>("ALGOLIA_APP_ID");
    const adminKey = config.get<string>("ALGOLIA_ADMIN_KEY");
    this.indexName = config.get<string>("ALGOLIA_INDEX_NAME") ?? "thread_items";
    // Algolia is optional: only build the client when both credentials exist.
    this.client = appId && adminKey ? algoliasearch(appId, adminKey) : null;
    if (!this.client) {
      this.logger.log("Algolia not configured — search uses the database, indexing is a no-op.");
    }
  }

  private get enabled() {
    return this.client !== null;
  }

  async syncItem(itemId: string) {
    if (!this.enabled) return;
    const item = await this.db.item.findUnique({ where: { id: itemId, isLive: true, deletedAt: null } });
    if (!item) return;
    try {
      await this.client!.saveObject({
        indexName: this.indexName,
        body: {
          objectID: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          size: item.size,
          condition: item.condition,
          price: item.retailPrice, // cents integer — never float
          images: item.photos,
          slug: item.slug,
          publishedAt: item.publishedAt ? Math.floor(item.publishedAt.getTime() / 1000) : 0,
        },
      });
    } catch (e) {
      this.logger.warn(`Algolia syncItem failed for ${itemId}: ${e instanceof Error ? e.message : e}`);
    }
  }

  async removeItem(itemId: string) {
    if (!this.enabled) return;
    try {
      await this.client!.deleteObject({ indexName: this.indexName, objectID: itemId });
    } catch (e) {
      this.logger.warn(`Algolia removeItem failed for ${itemId}: ${e instanceof Error ? e.message : e}`);
    }
  }

  /**
   * Search live items. Uses Algolia when configured (typo-tolerant ranking);
   * always falls back to a DB search so results work without Algolia or if it errors.
   */
  async search(query: string, limit = 8): Promise<SearchHit[]> {
    const q = query.trim();
    if (!q) return [];

    if (this.enabled) {
      try {
        const res = await this.client!.searchSingleIndex<{ slug: string; title: string; brand?: string | null; price: number; images: string[]; condition: string }>({
          indexName: this.indexName,
          searchParams: { query: q, hitsPerPage: limit },
        });
        return res.hits.map((h) => ({
          id: h.objectID,
          slug: h.slug,
          title: h.title,
          brand: h.brand ?? null,
          retailPrice: h.price,
          photos: h.images ?? [],
          condition: h.condition,
        }));
      } catch (e) {
        this.logger.warn(`Algolia search failed, falling back to DB: ${e instanceof Error ? e.message : e}`);
      }
    }

    return this.dbSearch(q, limit);
  }

  private async dbSearch(q: string, limit: number): Promise<SearchHit[]> {
    const items = await this.db.withRetry(() =>
      this.db.item.findMany({
        where: {
          isLive: true,
          deletedAt: null,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
            { itemType: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
        select: { id: true, slug: true, title: true, brand: true, retailPrice: true, photos: true, condition: true },
      })
    );
    return items as SearchHit[];
  }
}
