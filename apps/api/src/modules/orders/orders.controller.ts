import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";
import { GuestCheckoutSchema, UpdateOrderStatusSchema } from "@thread/types";
import type { GuestCheckout, UpdateOrderStatus, SessionUser } from "@thread/types";

const ResolveReturnSchema = z.object({
  approved: z.boolean(),
  refundAmountKobo: z.number().int().nonnegative().optional(),
});

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Public()
  @Post()
  async create(@Body(new ZodValidationPipe(GuestCheckoutSchema)) dto: GuestCheckout) {
    const data = await this.ordersService.createGuestOrder(dto);
    return { data };
  }

  @Public()
  @Get(":token/track")
  async track(@Param("token") token: string) {
    const data = await this.ordersService.trackByToken(token);
    return { data };
  }

  // A logged-in buyer's order history — matched by their account email, so it
  // includes orders placed as a guest with the same email.
  @Get("mine")
  @Roles("BUYER")
  async findMine(@CurrentUser() user: SessionUser) {
    const data = await this.ordersService.findMine(user.email);
    return { data };
  }

  @Get()
  @Roles("ADMIN")
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query("status") status?: string
  ) {
    const result = await this.ordersService.findAll(page, limit, status);
    return { data: result.items, meta: { total: result.total, hasMore: (page - 1) * limit + result.items.length < result.total, limit } };
  }

  @Patch(":id/status")
  @Roles("ADMIN")
  async updateStatus(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateOrderStatusSchema)) dto: UpdateOrderStatus
  ) {
    const data = await this.ordersService.updateStatus(id, dto);
    return { data };
  }

  // NOTE: payment confirmation is intentionally NOT exposed as an HTTP endpoint.
  // Orders are confirmed exclusively by the signature-verified Stripe webhook
  // (PaymentsController -> PaymentsService.handleStripeWebhook -> confirmPayment),
  // so a client cannot mark an order paid without a real, verified payment.

  @Public()
  @Post(":token/return")
  @HttpCode(200)
  async requestReturn(
    @Param("token") token: string,
    @Body("reason") reason: string
  ) {
    const data = await this.ordersService.requestReturn(token, reason);
    return { data };
  }

  @Post(":id/return/resolve")
  @Roles("ADMIN")
  @HttpCode(200)
  async resolveReturn(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(ResolveReturnSchema)) resolution: { approved: boolean; refundAmountKobo?: number }
  ) {
    const data = await this.ordersService.processReturn(id, resolution);
    return { data };
  }
}
