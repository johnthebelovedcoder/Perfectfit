import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { SearchService } from "./search.service";
import { SearchController } from "./search.controller";
import { SearchSyncProcessor } from "./search-sync.processor";
import { SEARCH_SYNC_QUEUE } from "../../queues/queue.constants";

@Module({
  imports: [BullModule.registerQueue({ name: SEARCH_SYNC_QUEUE })],
  controllers: [SearchController],
  providers: [SearchService, SearchSyncProcessor],
  exports: [SearchService],
})
export class SearchModule {}
