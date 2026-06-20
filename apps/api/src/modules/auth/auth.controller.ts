import { Controller, Post, Patch, Body, HttpCode, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { z } from "zod";
import { AuthService } from "./auth.service";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { SessionUser } from "@thread/types";

const MfaCodeSchema = z.object({ code: z.string().min(6).max(10) });
import { RegisterSellerSchema, RegisterBuyerSchema, LoginSchema } from "@thread/types";
import type { RegisterSeller, RegisterBuyer, Login } from "@thread/types";

const RefreshTokenSchema = z.object({ refreshToken: z.string().min(1) });
const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register/buyer")
  async registerBuyer(
    @Body(new ZodValidationPipe(RegisterBuyerSchema)) dto: RegisterBuyer
  ) {
    const result = await this.authService.registerBuyer(dto);
    return { data: result };
  }

  @Public()
  @Post("register/seller")
  async registerSeller(
    @Body(new ZodValidationPipe(RegisterSellerSchema)) dto: RegisterSeller
  ) {
    const result = await this.authService.registerSeller(dto);
    return { data: result };
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } }) // 5 login attempts/min/IP — anti brute-force
  @Post("login")
  @HttpCode(200)
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: Login) {
    const result = await this.authService.login(dto);
    return { data: result };
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Body(new ZodValidationPipe(RefreshTokenSchema)) body: { refreshToken: string }
  ) {
    const result = await this.authService.refreshToken(body.refreshToken);
    return { data: result };
  }

  @Patch("change-password")
  @HttpCode(200)
  async changePassword(
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: { currentPassword: string; newPassword: string },
    @Req() req: Request
  ) {
    const user = (req as any).user as { id: string };
    const result = await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    return { data: result };
  }

  // ── MFA (TOTP) — authenticated admin enrolment ──
  @UseGuards(JwtAuthGuard)
  @Post("mfa/setup")
  @HttpCode(200)
  async mfaSetup(@CurrentUser() user: SessionUser) {
    const data = await this.authService.setupMfa(user.id);
    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Post("mfa/enable")
  @HttpCode(200)
  async mfaEnable(
    @Body(new ZodValidationPipe(MfaCodeSchema)) body: { code: string },
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.authService.enableMfa(user.id, body.code);
    return { data };
  }

  @UseGuards(JwtAuthGuard)
  @Post("mfa/disable")
  @HttpCode(200)
  async mfaDisable(
    @Body(new ZodValidationPipe(MfaCodeSchema)) body: { code: string },
    @CurrentUser() user: SessionUser
  ) {
    const data = await this.authService.disableMfa(user.id, body.code);
    return { data };
  }
}
