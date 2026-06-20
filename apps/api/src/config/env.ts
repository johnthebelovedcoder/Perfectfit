import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production"]).default("development"),
  PORT: z.string().default("3001"),

  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),

  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // 32-byte key (64 hex chars) for AES-256-GCM encryption of PII at rest (seller bank details).
  // Generate with: openssl rand -hex 32
  FIELD_ENCRYPTION_KEY: z.string().regex(/^[0-9a-fA-F]{64}$/, "FIELD_ENCRYPTION_KEY must be 64 hex characters"),

  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  // Stripe CLI / dashboard webhook signing secret (whsec_...). Required to verify webhook authenticity.
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_PRESET: z.string().min(1),

  // Optional — when unset, search falls back to DB and indexing no-ops.
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_ADMIN_KEY: z.string().optional(),
  ALGOLIA_INDEX_NAME: z.string().default("thread_items"),

  ZEPTO_API_URL: z.string().url(),
  ZEPTO_API_TOKEN: z.string().min(1),

  THREAD_WAREHOUSE_ADDRESS: z.string().min(1),
  THREAD_WAREHOUSE_CONTACT_NUMBER: z.string().min(1),

  NEXT_PUBLIC_STOREFRONT_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SELLER_URL: z.string().url().default("http://localhost:3002"),
  NEXT_PUBLIC_ADMIN_URL: z.string().url().default("http://localhost:3003"),

  SENTRY_DSN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
