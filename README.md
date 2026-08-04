# Perfect Fit

An African-wear fashion marketplace — buyers shop curated & pre-loved African fashion, sellers submit items for approval, and admins manage the catalogue, orders, and payouts.

Turborepo monorepo: three Next.js 14 apps + a NestJS API + shared packages.

## Apps & packages

| Path | What it is | Port |
|---|---|---|
| `apps/storefront` | Customer storefront (offline-first PWA) | 3000 |
| `apps/api` | NestJS REST API | 3001 |
| `apps/seller` | Seller portal | 3002 |
| `apps/admin` | Admin/ops dashboard | 3003 |
| `packages/database` | Prisma schema + client (`@thread/database`) | — |
| `packages/types` | Shared Zod schemas & types (`@thread/types`) | — |
| `packages/utils` | Shared helpers (`@thread/utils`) | — |
| `packages/ui` | Shared UI (`@thread/ui`) | — |
| `packages/emails` | React Email templates (`@thread/emails`) | — |

## Tech
Next.js 14 (App Router) · NestJS 10 · Prisma 6 / PostgreSQL · Bull + Redis (queues) · Stripe Checkout · Cloudinary (images) · ZeptoMail (email) · Algolia (optional search) · React Query · Zustand · Tailwind · Vitest.

## Prerequisites
- Node ≥ 20, pnpm ≥ 9
- PostgreSQL (local or hosted, e.g. Neon)
- Redis (local or hosted, e.g. Upstash) — required for background queues

## Setup

```bash
# 1. Install
pnpm install

# 2. Configure env — copy the examples and fill in values
cp apps/api/.env.example apps/api/.env
cp packages/database/.env.example packages/database/.env
#   (frontends default to localhost; override NEXT_PUBLIC_* if needed — see below)

# 3. Create the schema + Prisma client
pnpm --filter @thread/database db:push
pnpm --filter @thread/database db:generate

# 4. Seed (dev only): admin + seller accounts, African-wear catalogue, reviews
cd packages/database
npx tsx prisma/seed.ts          # admin@thread.com / seller@thread.com
npx tsx prisma/seed-african.ts  # 45 catalogue items across all categories
npx tsx prisma/seed-reviews.ts  # sample reviews
cd ../..

# 5. Run everything
pnpm dev
```

Then open the storefront at http://localhost:3000.

**Dev seed credentials** (override with `SEED_ADMIN_PASSWORD` / `SEED_SELLER_PASSWORD`):
- Admin → `admin@thread.com` / `Admin@Thread1` (admin app, :3003)
- Seller → `seller@thread.com` / `Seller@Thread1` (seller app, :3002)

## Environment variables
Backend vars are documented in [`apps/api/.env.example`](apps/api/.env.example) (DB, Redis, JWT, encryption key, Stripe, Cloudinary, Algolia, email, etc.). Prisma reads [`packages/database/.env.example`](packages/database/.env.example).

Frontend (Next.js) public vars — set per app if not using defaults:
- `NEXT_PUBLIC_API_URL` (default `http://localhost:3001`)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (for Cloudinary-hosted images)
- `NEXT_PUBLIC_STOREFRONT_URL` / `NEXT_PUBLIC_SELLER_URL` / `NEXT_PUBLIC_ADMIN_URL`

> Generate secrets: `openssl rand -base64 48` (JWT), `openssl rand -hex 32` (FIELD_ENCRYPTION_KEY).
> **Back up `FIELD_ENCRYPTION_KEY`** — it encrypts seller bank details; losing it makes that data unrecoverable.

## Common commands

```bash
pnpm dev                                   # run all apps (turbo)
pnpm --filter @thread/api dev              # run only the API
pnpm --filter @thread/api test             # run API tests (vitest)
pnpm --filter @thread/database db:push     # sync schema to the DB
pnpm --filter @thread/database db:studio   # Prisma Studio
pnpm build                                 # build all
```

## Payments (Stripe)
Checkout creates a Stripe Checkout session; payment is confirmed **only** via the signed webhook (`POST /v1/webhooks/stripe`). For local testing:

```bash
stripe listen --forward-to localhost:3001/v1/webhooks/stripe
# put the printed whsec_... into STRIPE_WEBHOOK_SECRET
```

## Seller KYC
Sellers go live the moment they register — there is no admin approval step for listing. Identity is checked separately via KYC (date of birth, residential address, government ID type + number), which gates **payout release only**: payouts still queue normally, but `markAsPaid` refuses until an admin approves the seller's KYC. ID numbers are encrypted at rest with `FIELD_ENCRYPTION_KEY`.

Sellers submit from the seller portal Profile page; admins approve or reject on the admin Sellers page.

> **One-off, on the deploy that first adds the KYC columns:** run [`backfill-kyc.sql`](packages/database/prisma/backfill-kyc.sql) once so pre-existing sellers are grandfathered to `APPROVED`. Skip it and every current seller's payouts freeze until they complete KYC. The script is idempotent — safe to re-run.
> ```bash
> # sh -c so $DATABASE_URL expands INSIDE the container (where it's set), not on the host
> docker compose exec api sh -c 'pnpm --filter @thread/database exec prisma db execute --url "$DATABASE_URL" --file /app/packages/database/prisma/backfill-kyc.sql'
> ```

## Production notes
- Set real `NEXT_PUBLIC_*_URL` origins — the API refuses to boot with localhost origins when `NODE_ENV=production` (CORS hardening).
- Create the first admin with `npx tsx packages/database/prisma/create-admin.ts` (reads `ADMIN_EMAIL` / `ADMIN_PASSWORD`) — never run the dev seed in production.
- Use managed Postgres + Redis (free tiers throttle/expire); the API needs an always-on host for webhooks + background jobs.
- Storefront PWA/service worker only activates in a production build (`next build && next start`).
