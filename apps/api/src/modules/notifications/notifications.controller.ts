import { Controller, Get, Patch, Param, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { SessionUser } from "@thread/types";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getAll(@CurrentUser() user: SessionUser) {
    const data = await this.notificationsService.getAll(user.id);
    return { data };
  }

  @Get("unread")
  async getUnread(@CurrentUser() user: SessionUser) {
    const data = await this.notificationsService.getUnread(user.id);
    return { data };
  }

  @Patch("read-all")
  async markAllRead(@CurrentUser() user: SessionUser) {
    await this.notificationsService.markAllRead(user.id);
    return { data: { ok: true } };
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string, @CurrentUser() user: SessionUser) {
    const data = await this.notificationsService.markRead(id, user.id);
    return { data };
  }
}
