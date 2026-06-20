import { Controller, Get, Query } from "@nestjs/common";
import { SearchService } from "./search.service";
import { Public } from "../../common/decorators/public.decorator";

@Controller("search")
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Public()
  @Get()
  async search(@Query("q") q?: string) {
    const data = await this.searchService.search(q ?? "");
    return { data };
  }
}
