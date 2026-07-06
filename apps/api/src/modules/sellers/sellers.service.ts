import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from "@nestjs/common";
import { DatabaseService } from "../../common/database/database.service";
import { encryptField, decryptField } from "../../common/crypto/field-crypto";
import { buildTimeBuckets } from "../../common/analytics/time-buckets";
import type { UpdateSellerProfile, SessionUser } from "@thread/types";

@Injectable()
export class SellersService {
  constructor(private db: DatabaseService) {}

  async getProfile(user: SessionUser) {
    const profile = await this.db.sellerProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { email: true, emailVerified: true } },
        _count: { select: { submissions: true } },
      },
    });
    if (!profile) throw new NotFoundException("Seller profile not found");

    // Aggregate submission stats
    const [liveCount, soldCount, totalEarned, pendingCount] = await Promise.all([
      this.db.submission.count({ where: { sellerId: profile.id, status: "LIVE" } }),
      this.db.submission.count({ where: { sellerId: profile.id, status: { in: ["SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"] } } }),
      this.db.payout.aggregate({
        where: { sellerId: profile.id, status: "COMPLETED" },
        _sum: { amountKobo: true },
      }),
      this.db.submission.count({ where: { sellerId: profile.id, status: "PENDING_REVIEW" } }),
    ]);

    return {
      ...profile,
      // Decrypt PII for the seller's own profile view.
      bankAccountName: decryptField(profile.bankAccountName),
      bankAccountNumber: decryptField(profile.bankAccountNumber),
      stats: {
        total: profile._count.submissions,
        live: liveCount,
        sold: soldCount,
        pending: pendingCount,
        totalEarned: totalEarned._sum.amountKobo ?? 0,
      },
    };
  }

  /** Seller-scoped payout ledger: every payout for the seller plus paid/pending totals. */
  async getMyPayouts(user: SessionUser) {
    const profile = await this.db.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile) throw new NotFoundException("Seller profile not found");
    const sellerId = profile.id;

    const [payouts, completed, pending] = await Promise.all([
      this.db.payout.findMany({
        where: { sellerId },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          amountKobo: true,
          status: true,
          createdAt: true,
          processedAt: true,
          settlementDueAt: true,
          transferReference: true,
          item: { select: { title: true, slug: true, photos: true } },
        },
      }),
      this.db.payout.aggregate({ where: { sellerId, status: "COMPLETED" }, _sum: { amountKobo: true }, _count: true }),
      this.db.payout.aggregate({ where: { sellerId, status: { in: ["QUEUED", "PROCESSING"] } }, _sum: { amountKobo: true }, _count: true }),
    ]);

    return {
      payouts,
      summary: {
        totalPaidKobo: completed._sum.amountKobo ?? 0,
        paidCount: completed._count,
        pendingKobo: pending._sum.amountKobo ?? 0,
        pendingCount: pending._count,
      },
    };
  }

  /**
   * Seller-scoped analytics for the seller portal. Flow metrics respect [from, to];
   * current inventory / pending payout are live snapshots. Money in integer cents.
   */
  async getAnalytics(user: SessionUser, from: Date, to: Date) {
    const profile = await this.db.sellerProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
    if (!profile) throw new NotFoundException("Seller profile not found");
    const sellerId = profile.id;
    const inRange = { gte: from, lte: to };

    const [
      earnedRange,
      earnedLifetime,
      pendingPayout,
      soldInRange,
      liveItems,
      submissionGroups,
      pendingSubmissions,
      earningPayouts,
    ] = await Promise.all([
      this.db.payout.aggregate({ where: { sellerId, status: "COMPLETED", processedAt: inRange }, _sum: { amountKobo: true }, _count: true }),
      this.db.payout.aggregate({ where: { sellerId, status: "COMPLETED" }, _sum: { amountKobo: true } }), // snapshot
      this.db.payout.aggregate({ where: { sellerId, status: "QUEUED" }, _sum: { amountKobo: true }, _count: true }), // snapshot
      // The seller's items sold in range (item -> submission.sellerId).
      this.db.item.findMany({
        where: { submission: { sellerId }, soldAt: inRange },
        select: { title: true, agreedPayoutPrice: true, soldAt: true },
      }),
      this.db.item.count({ where: { submission: { sellerId }, isLive: true, soldAt: null } }), // snapshot
      this.db.submission.groupBy({ by: ["status"], where: { sellerId, createdAt: inRange }, _count: { _all: true } }),
      this.db.submission.count({ where: { sellerId, status: "PENDING_REVIEW" } }), // snapshot
      this.db.payout.findMany({ where: { sellerId, status: "COMPLETED", processedAt: inRange }, select: { processedAt: true, amountKobo: true } }),
    ]);

    const itemsSold = soldInRange.length;
    const soldPayoutKobo = soldInRange.reduce((s, i) => s + i.agreedPayoutPrice, 0);
    const avgSalePayoutKobo = itemsSold > 0 ? Math.round(soldPayoutKobo / itemsSold) : 0;
    const sellThrough = itemsSold + liveItems > 0 ? Math.round((itemsSold / (itemsSold + liveItems)) * 1000) / 10 : 0;

    const submissionByStatus = Object.fromEntries(submissionGroups.map((g) => [g.status, g._count._all]));
    const accepted = ["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE", "LIVE", "SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"]
      .reduce((s, k) => s + (submissionByStatus[k] ?? 0), 0);
    const rejected = submissionByStatus["REJECTED"] ?? 0;
    const acceptanceRate = accepted + rejected > 0 ? Math.round((accepted / (accepted + rejected)) * 1000) / 10 : 0;

    // Earnings trend (completed payouts bucketed by processedAt).
    const { buckets, granularity } = buildTimeBuckets(from, to);
    for (const p of earningPayouts) {
      if (!p.processedAt) continue;
      const t = p.processedAt.getTime();
      const b = buckets.find((x) => t >= x.start && t < x.end);
      if (b) { b.revenueKobo += p.amountKobo; b.orders += 1; }
    }

    // Top items by the seller's earnings (payout per sold item).
    const topItems = [...soldInRange]
      .sort((a, b) => b.agreedPayoutPrice - a.agreedPayoutPrice)
      .slice(0, 5)
      .map((i) => ({ title: i.title, earnedKobo: i.agreedPayoutPrice }));

    return {
      range: { from: from.toISOString(), to: to.toISOString(), granularity },
      kpis: {
        earnedKobo: earnedRange._sum.amountKobo ?? 0,
        payoutsCount: earnedRange._count,
        lifetimeEarnedKobo: earnedLifetime._sum.amountKobo ?? 0,
        pendingPayoutKobo: pendingPayout._sum.amountKobo ?? 0,
        pendingPayoutCount: pendingPayout._count,
        itemsSold,
        liveItems,
        sellThrough,
        avgSalePayoutKobo,
        acceptanceRate,
        submissionsPending: pendingSubmissions,
      },
      earningsSeries: buckets.map((b) => ({ date: b.label, earnedKobo: b.revenueKobo, payouts: b.orders })),
      submissionStatus: submissionGroups.map((g) => ({ status: g.status, count: g._count._all })),
      topItems,
    };
  }

  async updateProfile(dto: UpdateSellerProfile, user: SessionUser) {
    const profile = await this.db.sellerProfile.findUnique({ where: { userId: user.id } });
    if (!profile) throw new NotFoundException();

    return this.db.sellerProfile.update({
      where: { userId: user.id },
      data: {
        ...(dto.firstName ? { firstName: dto.firstName } : {}),
        ...(dto.lastName ? { lastName: dto.lastName } : {}),
        ...(dto.phone ? { phone: dto.phone } : {}),
        ...(dto.city ? { city: dto.city } : {}),
        ...(dto.bankAccountName ? { bankAccountName: encryptField(dto.bankAccountName) } : {}),
        ...(dto.bankAccountNumber ? { bankAccountNumber: encryptField(dto.bankAccountNumber) } : {}),
        ...(dto.bankName ? { bankName: dto.bankName } : {}),
      },
    });
  }

  async findAll(page: number, limit: number) {
    const [items, total] = await Promise.all([
      this.db.sellerProfile.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { email: true, emailVerified: true } },
          _count: { select: { submissions: true } },
        },
      }),
      this.db.sellerProfile.count({ where: { deletedAt: null } }),
    ]);

    if (items.length === 0) return { items: [], total };

    const sellerIds = items.map((s) => s.id);

    // Aggregate accepted count, rejected count, and total earned per seller
    const [acceptedCounts, rejectedCounts, earnedAgg] = await Promise.all([
      this.db.submission.groupBy({
        by: ["sellerId"],
        where: {
          sellerId: { in: sellerIds },
          status: { in: ["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE", "LIVE", "SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"] },
        },
        _count: { _all: true },
      }),
      this.db.submission.groupBy({
        by: ["sellerId"],
        where: { sellerId: { in: sellerIds }, status: "REJECTED" },
        _count: { _all: true },
      }),
      this.db.payout.groupBy({
        by: ["sellerId"],
        where: { sellerId: { in: sellerIds }, status: "COMPLETED" },
        _sum: { amountKobo: true },
      }),
    ]);

    const acceptedMap = Object.fromEntries(acceptedCounts.map((r) => [r.sellerId, r._count._all]));
    const rejectedMap = Object.fromEntries(rejectedCounts.map((r) => [r.sellerId, r._count._all]));
    const earnedMap = Object.fromEntries(earnedAgg.map((r) => [r.sellerId, r._sum.amountKobo ?? 0]));

    const enriched = items.map((s) => {
      // The list view only needs bankName; never expose encrypted account PII in a bulk list.
      const { bankAccountName: _n, bankAccountNumber: _acc, ...rest } = s;
      return {
        ...rest,
        stats: {
          submitted: s._count.submissions,
          accepted: acceptedMap[s.id] ?? 0,
          rejected: rejectedMap[s.id] ?? 0,
        },
        totalEarnedKobo: earnedMap[s.id] ?? 0,
      };
    });

    return { items: enriched, total };
  }

  async getSellerById(id: string, admin: SessionUser) {
    const adminProfile = await this.db.adminProfile.findUnique({ where: { userId: admin.id } });
    if (!adminProfile) throw new ForbiddenException();

    const seller = await this.db.sellerProfile.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, emailVerified: true } },
        submissions: { orderBy: { createdAt: "desc" }, take: 10 },
        payouts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
    if (!seller) throw new NotFoundException();
    // Decrypt PII for the admin detail view (needed to process payouts).
    return {
      ...seller,
      bankAccountName: decryptField(seller.bankAccountName),
      bankAccountNumber: decryptField(seller.bankAccountNumber),
    };
  }

  async addAdminNote(id: string, note: string) {
    try {
      return await this.db.sellerProfile.update({ where: { id }, data: { adminNotes: note } });
    } catch (e: any) {
      if (e?.code === "P2025") throw new NotFoundException("Seller not found");
      throw e;
    }
  }

  async verifyseller(id: string) {
    try {
      return await this.db.sellerProfile.update({ where: { id }, data: { isVerified: true } });
    } catch (e: any) {
      if (e?.code === "P2025") throw new NotFoundException("Seller not found");
      throw e;
    }
  }
}
