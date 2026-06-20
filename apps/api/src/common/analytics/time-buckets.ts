const DAY_MS = 24 * 60 * 60 * 1000;

export interface TimeBucket {
  start: number;
  end: number;
  label: string;
  revenueKobo: number;
  orders: number;
}

export type Granularity = "day" | "week" | "month";

/**
 * Build contiguous time buckets across [from, to], choosing day/week/month
 * granularity by span so charts stay readable at any range.
 */
export function buildTimeBuckets(from: Date, to: Date): { buckets: TimeBucket[]; granularity: Granularity } {
  const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / DAY_MS));
  const granularity: Granularity = spanDays <= 31 ? "day" : spanDays <= 180 ? "week" : "month";
  const buckets: TimeBucket[] = [];

  if (granularity === "month") {
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    while (cur <= to) {
      const next = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
      buckets.push({ start: cur.getTime(), end: next.getTime(), label: cur.toISOString().slice(0, 7), revenueKobo: 0, orders: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const step = granularity === "week" ? 7 * DAY_MS : DAY_MS;
    let start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
    const end = to.getTime();
    while (start <= end) {
      buckets.push({ start, end: start + step, label: new Date(start).toISOString().slice(0, 10), revenueKobo: 0, orders: 0 });
      start += step;
    }
  }
  return { buckets, granularity };
}
