import { Controller, Get, HttpCode, ServiceUnavailableException } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { SkipThrottle } from "@nestjs/throttler";
import { DatabaseService } from "../../common/database/database.service";

@Controller("health")
@Public()
@SkipThrottle() // load balancers poll this frequently; never rate-limit it
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  /** Liveness — the process is up and serving. Cheap, no dependencies touched. */
  @Get()
  @HttpCode(200)
  live() {
    return { status: "ok", uptime: process.uptime() };
  }

  /** Readiness — safe to receive traffic (DB reachable). Returns 503 if not. */
  @Get("ready")
  async ready() {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: "ok", db: "up" };
    } catch {
      // 503 so the load balancer pulls this instance out of rotation.
      throw new ServiceUnavailableException({ code: "DB_UNAVAILABLE", message: "Database unreachable" });
    }
  }
}
