import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { buildTimeBuckets } from "../../common/analytics/time-buckets";

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  async getStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      liveItems,
      pendingSubmissions,
      ordersToday,
      gmvMonth,
      pendingPayouts,
      activeSellers,
    ] = await Promise.all([
      // Items currently live on the store
      this.db.item.count({ where: { isLive: true, deletedAt: null } }),

      // Submissions awaiting any kind of admin action
      this.db.submission.count({
        where: {
          status: { in: ["PENDING_REVIEW", "AWAITING_MORE_INFO", "UNDER_NEGOTIATION"] },
        },
      }),

      // Orders placed today
      this.db.order.count({
        where: { createdAt: { gte: startOfDay } },
      }),

      // Total GMV this month (sum of paid orders)
      this.db.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { in: ["PROCESSING", "DISPATCHED", "DELIVERED"] },
        },
        _sum: { totalAmountKobo: true },
      }),

      // Submissions with PAYOUT_QUEUED status
      this.db.submission.count({ where: { status: "PAYOUT_QUEUED" } }),

      // Verified sellers with at least one live or sold item
      this.db.sellerProfile.count({ where: { isVerified: true, deletedAt: null } }),
    ]);

    return {
      liveItems,
      pendingSubmissions,
      ordersToday,
      totalGmvKobo: gmvMonth._sum.totalAmountKobo ?? 0,
      pendingPayouts,
      activeSellers,
    };
  }

  /**
   * Full business analytics for the admin Analytics page, scoped to a date range.
   * "Flow" metrics (revenue, orders, margin, payouts, submissions) respect [from, to];
   * "stock" metrics (current live/draft inventory, queued payout liability, seller
   * counts) are live snapshots regardless of range. All money values are integer cents.
   */
  async getAnalytics(from: Date, to: Date) {
    const PAID = { paymentStatus: "PAID" as const };
    const inRange = { gte: from, lte: to };

    const [
      gmvAgg,
      paidOrderCount,
      refundsAgg,
      soldItems,
      liveItems,
      draftItems,
      payoutsCompleted,
      payoutsQueued,
      sellersTotal,
      sellersVerified,
      submissionGroups,
      orderStatusGroups,
      rangeOrders,
      locationGroups,
      topSellerPayouts,
      topItemSales,
    ] = await Promise.all([
      this.db.order.aggregate({ where: { ...PAID, paidAt: inRange }, _sum: { totalAmountKobo: true } }),
      this.db.order.count({ where: { ...PAID, paidAt: inRange } }),
      this.db.order.aggregate({ where: { status: "REFUNDED", returnResolvedAt: inRange }, _sum: { refundAmountKobo: true }, _count: true }),
      // Platform margin (retail - payout) on items sold within the range.
      this.db.item.findMany({ where: { soldAt: inRange }, select: { retailPrice: true, agreedPayoutPrice: true } }),
      this.db.item.count({ where: { isLive: true, soldAt: null, deletedAt: null } }), // snapshot
      this.db.item.count({ where: { isLive: false, soldAt: null, deletedAt: null } }), // snapshot
      this.db.payout.aggregate({ where: { status: "COMPLETED", processedAt: inRange }, _sum: { amountKobo: true }, _count: true }),
      this.db.payout.aggregate({ where: { status: "QUEUED" }, _sum: { amountKobo: true }, _count: true }), // snapshot
      this.db.sellerProfile.count({ where: { deletedAt: null } }), // snapshot
      this.db.sellerProfile.count({ where: { isVerified: true, deletedAt: null } }), // snapshot
      this.db.submission.groupBy({ by: ["status"], where: { createdAt: inRange }, _count: { _all: true } }),
      this.db.order.groupBy({ by: ["status"], where: { createdAt: inRange }, _count: { _all: true } }),
      this.db.order.findMany({
        where: { ...PAID, paidAt: inRange },
        select: { paidAt: true, totalAmountKobo: true },
      }),
      // Top buyer locations. State is used (not city) because checkout collects state
      // from a fixed dropdown — clean, controlled values — whereas city is free text.
      this.db.order.groupBy({
        by: ["state"],
        where: { ...PAID, paidAt: inRange },
        _sum: { totalAmountKobo: true },
        _count: { _all: true },
        orderBy: { _sum: { totalAmountKobo: "desc" } },
        take: 8,
      }),
      this.db.payout.groupBy({
        by: ["sellerId"],
        where: { status: "COMPLETED", processedAt: inRange },
        _sum: { amountKobo: true },
        _count: { _all: true },
        orderBy: { _sum: { amountKobo: "desc" } },
        take: 5,
      }),
      this.db.orderItem.groupBy({
        by: ["itemId"],
        where: { order: { ...PAID, paidAt: inRange } },
        _sum: { priceKobo: true },
        _count: { _all: true },
        orderBy: { _sum: { priceKobo: "desc" } },
        take: 5,
      }),
    ]);

    const grossMarginKobo = soldItems.reduce((s, i) => s + (i.retailPrice - i.agreedPayoutPrice), 0);
    const gmv = gmvAgg._sum.totalAmountKobo ?? 0;
    const refundedKobo = refundsAgg._sum.refundAmountKobo ?? 0;
    const aov = paidOrderCount > 0 ? Math.round(gmv / paidOrderCount) : 0;
    const refundRate = paidOrderCount > 0 ? Math.round((refundsAgg._count / paidOrderCount) * 1000) / 10 : 0;
    const sellThrough = soldItems.length + liveItems > 0
      ? Math.round((soldItems.length / (soldItems.length + liveItems)) * 1000) / 10
      : 0;

    const submissionByStatus = Object.fromEntries(submissionGroups.map((g) => [g.status, g._count._all]));
    const accepted = ["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE", "LIVE", "SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"]
      .reduce((s, k) => s + (submissionByStatus[k] ?? 0), 0);
    const rejected = submissionByStatus["REJECTED"] ?? 0;
    const acceptanceRate = accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 1000) / 10 : 0;

    // Adaptive time buckets: daily for short ranges, weekly then monthly for longer ones.
    const { buckets, granularity } = buildTimeBuckets(from, to);
    for (const o of rangeOrders) {
      if (!o.paidAt) continue;
      const t = o.paidAt.getTime();
      const b = buckets.find((x) => t >= x.start && t < x.end);
      if (b) { b.revenueKobo += o.totalAmountKobo; b.orders += 1; }
    }

    const sellerIds = topSellerPayouts.map((s) => s.sellerId);
    const sellers = sellerIds.length
      ? await this.db.sellerProfile.findMany({ where: { id: { in: sellerIds } }, select: { id: true, firstName: true, lastName: true } })
      : [];
    const sellerName = new Map(sellers.map((s) => [s.id, `${s.firstName} ${s.lastName}`]));
    const topSellers = topSellerPayouts.map((s) => ({
      name: sellerName.get(s.sellerId) ?? "Unknown",
      earnedKobo: s._sum.amountKobo ?? 0,
      payouts: s._count._all,
    }));

    const itemIds = topItemSales.map((i) => i.itemId);
    const items = itemIds.length
      ? await this.db.item.findMany({ where: { id: { in: itemIds } }, select: { id: true, title: true } })
      : [];
    const itemTitle = new Map(items.map((i) => [i.id, i.title]));
    const topItems = topItemSales.map((i) => ({
      title: itemTitle.get(i.itemId) ?? "Unknown",
      revenueKobo: i._sum.priceKobo ?? 0,
      unitsSold: i._count._all,
    }));

    return {
      range: { from: from.toISOString(), to: to.toISOString(), granularity },
      kpis: {
        gmvKobo: gmv,
        grossMarginKobo,
        aovKobo: aov,
        paidOrders: paidOrderCount,
        refundedKobo,
        refundRate,
        paidOutKobo: payoutsCompleted._sum.amountKobo ?? 0,
        pendingPayoutKobo: payoutsQueued._sum.amountKobo ?? 0,
        pendingPayoutCount: payoutsQueued._count,
        liveItems,
        draftItems,
        soldItems: soldItems.length,
        sellThrough,
        sellersTotal,
        sellersVerified,
        acceptanceRate,
      },
      revenueSeries: buckets.map((b) => ({ date: b.label, revenueKobo: b.revenueKobo, orders: b.orders })),
      orderStatus: orderStatusGroups.map((g) => ({ status: g.status, count: g._count._all })),
      submissionStatus: submissionGroups.map((g) => ({ status: g.status, count: g._count._all })),
      topSellers,
      topItems,
      topLocations: locationGroups.map((g) => ({
        state: g.state,
        orders: g._count._all,
        revenueKobo: g._sum.totalAmountKobo ?? 0,
      })),
    };
  }
}
