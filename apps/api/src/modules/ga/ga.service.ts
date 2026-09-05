import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Reads traffic data from the Google Analytics 4 Data API for the admin dashboard.
 *
 * Requires two env vars (a no-op that reports `configured:false` if either is missing):
 *   GA_PROPERTY_ID       — the numeric GA4 property id (NOT the "G-..." measurement id)
 *   GA_CREDENTIALS_JSON  — a Google service-account key (the whole JSON, one line),
 *                          for an account granted Viewer on the GA4 property.
 */
@Injectable()
export class GaService {
  private readonly logger = new Logger(GaService.name);
  private client: BetaAnalyticsDataClient | null = null;
  private readonly propertyId?: string;

  constructor(private config: ConfigService) {
    this.propertyId = this.config.get<string>("GA_PROPERTY_ID");
    const rawCreds = this.config.get<string>("GA_CREDENTIALS_JSON");
    if (this.propertyId && rawCreds) {
      try {
        this.client = new BetaAnalyticsDataClient({ credentials: JSON.parse(rawCreds) });
      } catch (e) {
        this.logger.error(`GA_CREDENTIALS_JSON is not valid JSON: ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  async getOverview(days = 28) {
    if (!this.client || !this.propertyId) return { configured: false as const };

    const property = `properties/${this.propertyId}`;
    const dateRanges = [{ startDate: `${days}daysAgo`, endDate: "today" }];
    const num = (v?: string | null) => Number(v ?? 0);

    try {
      const [totals, trend, pages, countries, devices] = await Promise.all([
        this.client.runReport({
          property, dateRanges,
          metrics: [{ name: "activeUsers" }, { name: "newUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "averageSessionDuration" }, { name: "bounceRate" }],
        }),
        this.client.runReport({
          property, dateRanges,
          dimensions: [{ name: "date" }],
          metrics: [{ name: "activeUsers" }, { name: "sessions" }],
          orderBys: [{ dimension: { dimensionName: "date" } }],
        }),
        this.client.runReport({
          property, dateRanges,
          dimensions: [{ name: "pagePath" }],
          metrics: [{ name: "screenPageViews" }],
          orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
          limit: 8,
        }),
        this.client.runReport({
          property, dateRanges,
          dimensions: [{ name: "country" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
          limit: 6,
        }),
        this.client.runReport({
          property, dateRanges,
          dimensions: [{ name: "deviceCategory" }],
          metrics: [{ name: "activeUsers" }],
          orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        }),
      ]);

      const t = totals[0].rows?.[0]?.metricValues ?? [];
      return {
        configured: true as const,
        rangeDays: days,
        kpis: {
          activeUsers: num(t[0]?.value),
          newUsers: num(t[1]?.value),
          sessions: num(t[2]?.value),
          pageViews: num(t[3]?.value),
          avgSessionDurationSec: Math.round(num(t[4]?.value)),
          bounceRate: Math.round(num(t[5]?.value) * 1000) / 10, // %
        },
        series: (trend[0].rows ?? []).map((r) => ({
          date: r.dimensionValues?.[0]?.value ?? "",
          users: num(r.metricValues?.[0]?.value),
          sessions: num(r.metricValues?.[1]?.value),
        })),
        topPages: (pages[0].rows ?? []).map((r) => ({ path: r.dimensionValues?.[0]?.value ?? "", views: num(r.metricValues?.[0]?.value) })),
        topCountries: (countries[0].rows ?? []).map((r) => ({ country: r.dimensionValues?.[0]?.value ?? "", users: num(r.metricValues?.[0]?.value) })),
        devices: (devices[0].rows ?? []).map((r) => ({ device: r.dimensionValues?.[0]?.value ?? "", users: num(r.metricValues?.[0]?.value) })),
      };
    } catch (e) {
      this.logger.error(`GA report failed: ${e instanceof Error ? e.message : e}`);
      return { configured: true as const, error: "Could not load Google Analytics data — check the property id and that the service account has Viewer access." };
    }
  }
}
