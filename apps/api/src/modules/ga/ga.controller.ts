import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { GaService } from "./ga.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";

@Controller("ga")
@UseGuards(JwtAuthGuard, RolesGuard)
export class GaController {
  constructor(private ga: GaService) {}

  @Get("overview")
  @Roles("ADMIN")
  async overview(@Query("days") days?: string) {
    const n = days ? Math.min(90, Math.max(1, parseInt(days, 10) || 28)) : 28;
    const data = await this.ga.getOverview(n);
    return { data };
  }
}
