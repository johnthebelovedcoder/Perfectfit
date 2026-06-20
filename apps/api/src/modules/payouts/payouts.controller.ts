import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { PayoutsService } from "./payouts.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { SessionUser } from "@thread/types";

@Controller("payouts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class PayoutsController {
  constructor(private payoutsService: PayoutsService) {}

  @Get()
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string
  ) {
    const result = await this.payoutsService.findAll(page, limit, status);
    return { data: result.items, meta: { total: result.total, hasMore: (page - 1) * limit + result.items.length < result.total, limit } };
  }

  @Post(":id/process")
  @HttpCode(200)
  async markAsPaid(@Param("id") id: string, @CurrentUser() admin: SessionUser) {
    const data = await this.payoutsService.markAsPaid(id, admin);
    return { data };
  }
}
