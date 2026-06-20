export const NOTIFICATION_QUEUE = "notification";
export const PAYOUT_QUEUE = "payout";
export const SEARCH_SYNC_QUEUE = "search-sync";
export const IMAGE_MIGRATE_QUEUE = "image-migrate";

export const JOB_OPTS = {
  attempts: 3,
  backoff: { type: "exponential" as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 50,
} as const;
