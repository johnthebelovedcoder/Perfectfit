import { Process, Processor } from "@nestjs/bull";
import type { Job } from "bull";
import { SearchService } from "./search.service";
import { SEARCH_SYNC_QUEUE } from "../../queues/queue.constants";

interface SyncItemJob {
  itemId: string;
  action: "publish" | "update" | "unpublish";
}

@Processor(SEARCH_SYNC_QUEUE)
export class SearchSyncProcessor {
  constructor(private searchService: SearchService) {}

  @Process("sync-item")
  async handleSyncItem(job: Job<SyncItemJob>) {
    const { itemId, action } = job.data;

    if (action === "unpublish") {
      await this.searchService.removeItem(itemId);
    } else {
      await this.searchService.syncItem(itemId);
    }
  }
}
