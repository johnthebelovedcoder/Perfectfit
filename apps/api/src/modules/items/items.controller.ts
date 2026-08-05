import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  Header,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { ItemsService } from "./items.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { UpdateItemSchema, CatalogueFilterSchema, CreateItemDirectSchema } from "@thread/types";
import type { UpdateItem, CatalogueFilter, CreateItemDirect } from "@thread/types";

@Controller("items")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ItemsController {
  constructor(private itemsService: ItemsService) {}

  @Public()
  @Header("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30")
  @Get()
  async findPublic(@Query(new ZodValidationPipe(CatalogueFilterSchema)) filter: CatalogueFilter) {
    const result = await this.itemsService.findPublic(filter);
    return {
      data: result.items,
      meta: { nextCursor: result.nextCursor, hasMore: result.hasMore, limit: filter.limit },
    };
  }

  @Get("admin-catalogue")
  @Roles("ADMIN")
  async findAllAdmin(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("search") search?: string
  ) {
    const result = await this.itemsService.findAllForAdmin(page, limit, search);
    return { data: result.items, meta: { total: result.total, hasMore: result.hasMore, limit } };
  }

  @Get("archived")
  @Roles("ADMIN")
  async findArchived(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query("search") search?: string
  ) {
    const result = await this.itemsService.findArchived(page, limit, search);
    return { data: result.items, meta: { total: result.total, hasMore: result.hasMore, limit } };
  }

  @Public()
  @Header("Cache-Control", "public, s-maxage=15, stale-while-revalidate=30")
  @Get(":slug")
  async findBySlug(@Param("slug") slug: string) {
    const data = await this.itemsService.findBySlug(slug);
    return { data };
  }

  @Patch(":id")
  @Roles("ADMIN")
  async update(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateItemSchema)) dto: UpdateItem
  ) {
    const data = await this.itemsService.update(id, dto);
    return { data };
  }

  @Post(":id/publish")
  @Roles("ADMIN")
  @HttpCode(200)
  async publish(@Param("id") id: string) {
    const data = await this.itemsService.publish(id);
    return { data };
  }

  @Post(":id/unpublish")
  @Roles("ADMIN")
  @HttpCode(200)
  async unpublish(@Param("id") id: string) {
    const data = await this.itemsService.unpublish(id);
    return { data };
  }

  @Post("direct")
  @Roles("ADMIN")
  async createDirect(
    @Body(new ZodValidationPipe(CreateItemDirectSchema)) dto: CreateItemDirect
  ) {
    const data = await this.itemsService.createDirect(dto);
    return { data };
  }

  @Post("from-submission/:submissionId")
  @Roles("ADMIN")
  async createFromSubmission(@Param("submissionId") submissionId: string) {
    const data = await this.itemsService.createFromSubmission(submissionId);
    return { data };
  }

  @Post(":id/restore")
  @Roles("ADMIN")
  @HttpCode(200)
  async restore(@Param("id") id: string) {
    const data = await this.itemsService.restore(id);
    return { data };
  }

  @Delete(":id")
  @Roles("ADMIN")
  async remove(@Param("id") id: string) {
    const data = await this.itemsService.remove(id);
    return { data };
  }
}
