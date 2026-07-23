-- One-off backfill: grandfather sellers who existed before KYC shipped.
--
-- KYC gates payout release. Without this, every pre-existing seller would land on
-- NOT_STARTED at deploy time and their payouts would be frozen until each one
-- submitted details and an admin approved them. This approves them in place so
-- payouts keep flowing; only sellers who register after the cutoff must do KYC.
--
-- Run ONCE, immediately after the deploy that adds the KYC columns:
--
--   docker compose exec api pnpm --filter @thread/database exec \
--     prisma db execute --url "$DATABASE_URL" \
--     --file /app/packages/database/prisma/backfill-kyc.sql
--
-- Idempotent: the createdAt cutoff means re-running it can never approve a seller
-- who registered after the deploy, and the kycStatus filter skips anyone already
-- reviewed. Safe to run twice.
--
-- CUTOFF ASSUMES A DEPLOY ON 2026-07-22 — it grandfathers everyone registered up
-- to the end of that day, and nobody after. If you deploy on a different date,
-- change the date below to the day you deploy, or every seller who signs up
-- between then and now gets approved without ever being checked.

UPDATE "SellerProfile"
SET "kycStatus"      = 'APPROVED',
    "kycReviewedAt"  = NOW()
WHERE "kycStatus" = 'NOT_STARTED'
  AND "createdAt" < '2026-07-23T00:00:00Z'
  AND "deletedAt" IS NULL;
