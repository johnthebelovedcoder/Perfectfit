import { Controller, Get, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { SessionUser } from "@thread/types";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser() user: SessionUser) {
    const data = await this.usersService.getMe(user);
    return { data };
  }
}
