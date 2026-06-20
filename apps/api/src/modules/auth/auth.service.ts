import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { DatabaseService } from "../../common/database/database.service";
import { encryptField } from "../../common/crypto/field-crypto";
import type { RegisterSeller, RegisterBuyer, Login, SessionUser } from "@thread/types";

const MFA_ISSUER = "Perfect Fit Admin";

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
    private config: ConfigService
  ) {}

  async registerBuyer(dto: RegisterBuyer) {
    const existing = await this.db.withRetry(() => this.db.user.findUnique({ where: { email: dto.email } }));
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.db.withRetry(() => this.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: "BUYER",
        buyerProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
          },
        },
      },
    }));

    return this.issueTokens(user);
  }

  async registerSeller(dto: RegisterSeller) {
    const existing = await this.db.withRetry(() => this.db.user.findUnique({ where: { email: dto.email } }));
    if (existing) throw new ConflictException("Email already registered");

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.db.withRetry(() => this.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: "SELLER",
        sellerProfile: {
          create: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            city: dto.city,
            // PII encrypted at rest with AES-256-GCM; decrypted on read in SellersService.
            bankAccountName: encryptField(dto.bankAccountName),
            bankAccountNumber: encryptField(dto.bankAccountNumber),
            bankName: dto.bankName, // not sensitive (e.g. "Chase") — stored plaintext for display/search
          },
        },
      },
      include: { sellerProfile: true },
    }));

    return this.issueTokens(user);
  }

  async login(dto: Login) {
    const user = await this.db.withRetry(() => this.db.user.findUnique({ where: { email: dto.email } }));
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException("Invalid credentials");

    if (user.mfaEnabled) {
      if (!user.mfaSecret) {
        // mfaEnabled but no secret should never happen; fail closed.
        throw new UnauthorizedException("MFA misconfigured — contact support");
      }
      if (!dto.totpCode) {
        // Signal the client to collect a 6-digit code, then re-submit login.
        throw new UnauthorizedException({ code: "MFA_REQUIRED", message: "Enter your authenticator code" });
      }
      const valid = authenticator.check(dto.totpCode, user.mfaSecret);
      if (!valid) {
        throw new UnauthorizedException({ code: "MFA_INVALID", message: "Invalid authenticator code" });
      }
    }

    return this.issueTokens(user);
  }

  /**
   * Begin MFA enrolment: generate a secret (stored, but not yet enabled) and
   * return an otpauth URL + QR data-URL for the authenticator app.
   */
  async setupMfa(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.mfaEnabled) throw new BadRequestException("MFA is already enabled");

    const secret = authenticator.generateSecret();
    await this.db.user.update({ where: { id: userId }, data: { mfaSecret: secret } });

    const otpauth = authenticator.keyuri(user.email, MFA_ISSUER, secret);
    const qrDataUrl = await QRCode.toDataURL(otpauth);
    return { secret, otpauth, qrDataUrl };
  }

  /** Verify the first code and turn MFA on. */
  async enableMfa(userId: string, code: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) throw new BadRequestException("Start MFA setup first");
    if (!authenticator.check(code, user.mfaSecret)) {
      throw new BadRequestException("Invalid authenticator code");
    }
    await this.db.user.update({ where: { id: userId }, data: { mfaEnabled: true } });
    return { enabled: true };
  }

  /** Verify a current code, then disable MFA and clear the secret. */
  async disableMfa(userId: string, code: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user?.mfaEnabled || !user.mfaSecret) throw new BadRequestException("MFA is not enabled");
    if (!authenticator.check(code, user.mfaSecret)) {
      throw new BadRequestException("Invalid authenticator code");
    }
    await this.db.user.update({ where: { id: userId }, data: { mfaEnabled: false, mfaSecret: null } });
    return { enabled: false };
  }

  async refreshToken(token: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      }) as typeof payload;
    } catch {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.db.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException();

    return this.issueTokens(user);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException("Current password is incorrect");

    if (newPassword.length < 8) {
      throw new BadRequestException("New password must be at least 8 characters");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.db.user.update({ where: { id: userId }, data: { passwordHash } });
    return { changed: true };
  }

  private issueTokens(user: { id: string; email: string; role: string; emailVerified: boolean; mfaEnabled: boolean }) {
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      role: user.role as SessionUser["role"],
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
    };

    const accessToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: "15m" }
    );

    const refreshToken = this.jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: "7d",
      }
    );

    return { accessToken, refreshToken, user: sessionUser };
  }
}
