import { Controller, Get, Post, Delete, Param, Body, UseGuards } from "@nestjs/common";
import { SavedService } from "./saved.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { z } from "zod";
import type { SessionUser } from "@thread/types";

const MergeSchema = z.object({ itemIds: z.array(z.string()).max(200) });

@Controller("me")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("BUYER")
export class SavedController {
  constructor(private saved: SavedService) {}

  // ── Cart ──────────────────────────────────────────────────────────────
  @Get("cart")
  async getCart(@CurrentUser() user: SessionUser) {
    return { data: await this.saved.getCart(user.id) };
  }

  @Post("cart/merge")
  async mergeCart(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(MergeSchema)) body: { itemIds: string[] }
  ) {
    return { data: await this.saved.merge(user.id, "cart", body.itemIds) };
  }

  @Post("cart/:itemId")
  async addCart(@CurrentUser() user: SessionUser, @Param("itemId") itemId: string) {
    return { data: await this.saved.add(user.id, "cart", itemId) };
  }

  @Delete("cart/:itemId")
  async removeCart(@CurrentUser() user: SessionUser, @Param("itemId") itemId: string) {
    return { data: await this.saved.remove(user.id, "cart", itemId) };
  }

  @Delete("cart")
  async clearCart(@CurrentUser() user: SessionUser) {
    return { data: await this.saved.clear(user.id, "cart") };
  }

  // ── Wishlist ──────────────────────────────────────────────────────────
  @Get("wishlist")
  async getWishlist(@CurrentUser() user: SessionUser) {
    return { data: await this.saved.getWishlist(user.id) };
  }

  @Post("wishlist/merge")
  async mergeWishlist(
    @CurrentUser() user: SessionUser,
    @Body(new ZodValidationPipe(MergeSchema)) body: { itemIds: string[] }
  ) {
    return { data: await this.saved.merge(user.id, "wishlist", body.itemIds) };
  }

  @Post("wishlist/:itemId")
  async addWishlist(@CurrentUser() user: SessionUser, @Param("itemId") itemId: string) {
    return { data: await this.saved.add(user.id, "wishlist", itemId) };
  }

  @Delete("wishlist/:itemId")
  async removeWishlist(@CurrentUser() user: SessionUser, @Param("itemId") itemId: string) {
    return { data: await this.saved.remove(user.id, "wishlist", itemId) };
  }
}
