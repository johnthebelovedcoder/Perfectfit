import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from "@nestjs/common";
import { SellersService } from "./sellers.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";
import { UpdateSellerProfileSchema } from "@thread/types";
import type { UpdateSellerProfile, SessionUser } from "@thread/types";

const AdminNoteSchema = z.object({ note: z.string().min(1).max(1000) });

@Controller("sellers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Get("me")
  @Roles("SELLER")
  async getMyProfile(@CurrentUser() user: SessionUser) {
    const data = await this.sellersService.getProfile(user);
    return { data };
  }

  @Get("me/analytics")
  @Roles("SELLER")
  async getMyAnalytics(
    @CurrentUser() user: SessionUser,
    @Query("from") fromStr?: string,
    @Query("to") toStr?: string
  ) {
    const now = new Date();
    const parsedFrom = fromStr ? new Date(fromStr) : null;
    const parsedTo = toStr ? new Date(toStr) : null;
    const from = parsedFrom && !isNaN(parsedFrom.getTime())
      ? parsedFrom
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = parsedTo && !isNaN(parsedTo.getTime()) ? parsedTo : now;
    const data = await this.sellersService.getAnalytics(user, from, to);
    return { data };
  }

  @Patch("me")
  @Roles("SELLER")
  async updateMyProfile(
    @Body(new ZodValidationPipe(UpdateSellerProfileSchema)) dto: UpdateSellerProfile,
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.sellersService.updateProfile(dto, user);
    return { data };
  }

  @Get()
  @Roles("ADMIN")
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number
  ) {
    const result = await this.sellersService.findAll(page, limit);
    return { data: result.items, meta: { total: result.total, hasMore: (page - 1) * limit + result.items.length < result.total, limit } };
  }

  @Get(":id")
  @Roles("ADMIN")
  async findOne(@Param("id") id: string, @CurrentUser() admin: SessionUser) {
    const data = await this.sellersService.getSellerById(id, admin);
    return { data };
  }

  @Post(":id/verify")
  @Roles("ADMIN")
  async verify(@Param("id") id: string) {
    const data = await this.sellersService.verifyseller(id);
    return { data };
  }

  @Patch(":id/notes")
  @Roles("ADMIN")
  async addNote(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(AdminNoteSchema)) body: { note: string }
  ) {
    const data = await this.sellersService.addAdminNote(id, body.note);
    return { data };
  }
}
