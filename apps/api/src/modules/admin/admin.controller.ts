import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("stats")
  async getStats() {
    const data = await this.adminService.getStats();
    return { data };
  }

  @Get("analytics")
  async getAnalytics(@Query("from") fromStr?: string, @Query("to") toStr?: string) {
    const now = new Date();
    // Default window: last 30 days. Invalid/missing params fall back safely.
    const parsedFrom = fromStr ? new Date(fromStr) : null;
    const parsedTo = toStr ? new Date(toStr) : null;
    const from = parsedFrom && !isNaN(parsedFrom.getTime())
      ? parsedFrom
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const to = parsedTo && !isNaN(parsedTo.getTime()) ? parsedTo : now;

    const data = await this.adminService.getAnalytics(from, to);
    return { data };
  }
}
