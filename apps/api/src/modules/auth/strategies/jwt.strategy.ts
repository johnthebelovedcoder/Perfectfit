import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { DatabaseService } from "../../../common/database/database.service";
import type { SessionUser } from "@thread/types";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private db: DatabaseService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>("JWT_SECRET") ?? "",
    });
  }

  async validate(payload: JwtPayload): Promise<SessionUser> {
    const user = await this.db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, emailVerified: true, mfaEnabled: true, deletedAt: true },
    });

    if (!user || user.deletedAt) throw new UnauthorizedException();

    return {
      id: user.id,
      email: user.email,
      role: user.role as SessionUser["role"],
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
    };
  }
}
