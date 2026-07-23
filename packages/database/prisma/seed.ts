import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Seeds are development/test fixtures only. Never create known-credential
  // accounts in production — use create-admin.ts (reads a strong password from env).
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "Refusing to run seed.ts in production. Use `ts-node prisma/create-admin.ts` to create the first admin."
    );
  }

  console.log("Seeding database (development fixtures)...");

  // Passwords come from env so they aren't hardcoded; dev defaults are used locally only.
  const adminPassword = process.env["SEED_ADMIN_PASSWORD"] ?? "Admin@Thread1";
  const sellerPassword = process.env["SEED_SELLER_PASSWORD"] ?? "Seller@Thread1";

  const adminHash = await bcrypt.hash(adminPassword, 12);
  const admin = await db.user.upsert({
    where: { email: "admin@thread.com" },
    update: {},
    create: {
      email: "admin@thread.com",
      passwordHash: adminHash,
      role: "ADMIN",
      emailVerified: true,
      adminProfile: { create: { firstName: "Thread", lastName: "Admin" } },
    },
  });
  console.log("✅ Admin:", admin.email);

  const sellerHash = await bcrypt.hash(sellerPassword, 12);
  // Bank fields stay plaintext here; the API decrypts on read and passes legacy
  // plaintext through unchanged (lazy migration). Real sellers register encrypted.
  const seller = await db.user.upsert({
    where: { email: "seller@thread.com" },
    update: {},
    create: {
      email: "seller@thread.com",
      passwordHash: sellerHash,
      role: "SELLER",
      emailVerified: true,
      sellerProfile: {
        create: {
          firstName: "Test",
          lastName: "Seller",
          phone: "+12125550001",
          city: "New York",
          bankAccountName: "Test Seller",
          bankAccountNumber: "0000000000",
          bankName: "Test Bank",
          // Pre-approved so the dev seller can be paid out without a manual KYC
          // round-trip. ID number is plaintext here, like the bank fields above.
          kycStatus: "APPROVED",
          dateOfBirth: new Date("1990-01-01T00:00:00Z"),
          addressLine1: "123 Test Street",
          region: "NY",
          postalCode: "10001",
          country: "US",
          idDocumentType: "PASSPORT",
          idDocumentNumber: "TEST123456",
          idIssuingCountry: "US",
          kycSubmittedAt: new Date(),
          kycReviewedAt: new Date(),
        },
      },
    },
  });
  console.log("✅ Seller:", seller.email);
  console.log("\nDev credentials (override via SEED_ADMIN_PASSWORD / SEED_SELLER_PASSWORD):");
  console.log("  Admin  → admin@thread.com");
  console.log("  Seller → seller@thread.com");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
