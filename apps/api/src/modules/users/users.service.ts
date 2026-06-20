import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import type { SessionUser } from "@thread/types";

@Injectable()
export class UsersService {
  constructor(private db: DatabaseService) {}

  async getMe(user: SessionUser) {
    return this.db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        createdAt: true,
        sellerProfile: { select: { firstName: true, lastName: true, isVerified: true } },
        adminProfile: { select: { firstName: true, lastName: true, permissions: true } },
      },
    });
  }
}
