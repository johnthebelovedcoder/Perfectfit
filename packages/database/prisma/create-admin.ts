import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

/**
 * Production-safe first-admin bootstrap. Reads credentials from env so no
 * password is ever hardcoded or printed:
 *
 *   ADMIN_EMAIL=ops@yourco.com ADMIN_PASSWORD='<strong-password>' \
 *     ts-node prisma/create-admin.ts
 *
 * Idempotent: updates the password if the admin already exists.
 */

const db = new PrismaClient();

async function main() {
  const email = process.env["ADMIN_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  const firstName = process.env["ADMIN_FIRST_NAME"] ?? "Admin";
  const lastName = process.env["ADMIN_LAST_NAME"] ?? "User";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD env vars are required.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN", emailVerified: true },
    create: {
      email,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      adminProfile: { create: { firstName, lastName } },
    },
  });

  // Never log the password.
  console.log(`✅ Admin ready: ${user.email}`);
}

main()
  .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); })
  .finally(() => db.$disconnect());
