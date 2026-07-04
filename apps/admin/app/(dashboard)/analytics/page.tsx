"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp, DollarSign, ShoppingBag, Wallet, Package,
  Users, RotateCcw, Percent, ArrowUpRight, MapPin,
} from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface Analytics {
  range: { from: string; to: string; granularity: "day" | "week" | "month" };
  kpis: {
    gmvKobo: number; grossMarginKobo: number; aovKobo: number;
    paidOrders: number; refundedKobo: number; refundRate: number;
    paidOutKobo: number; pendingPayoutKobo: number; pendingPayoutCount: number;
    liveItems: number; draftItems: number; soldItems: number; sellThrough: number;
    sellersTotal: number; sellersVerified: number; acceptanceRate: number;
  };
  revenueSeries: { date: string; revenueKobo: number; orders: number }[];
  orderStatus: { status: string; count: number }[];
  submissionStatus: { status: string; count: number }[];
  topSellers: { name: string; earnedKobo: number; payouts: number }[];
  topItems: { title: string; revenueKobo: number; unitsSold: number }[];
  topLocations: { state: string; orders: number; revenueKobo: number }[];
}

const STATUS_COLOR: Record<string, string> = {
  PLACED: "bg-blue-400", PROCESSING: "bg-amber-400", DISPATCHED: "bg-purple-400",
  OUT_FOR_DELIVERY: "bg-purple-400", DELIVERED: "bg-emerald-400",
  RETURN_REQUESTED: "bg-orange-400", REFUNDED: "bg-gray-400", CANCELLED: "bg-red-400",
};

const PRESETS = ["Today", "7D", "30D", "90D", "This month", "This year", "All time"] as const;
type Preset = typeof PRESETS[number];

function label(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve a preset (or custom inputs) to an ISO from/to window. */
function resolveRange(preset: Preset, customFrom: string, customTo: string): { from: string; to: string } {
  const now = new Date();
  const to = now;
  let from: Date;
  switch (preset) {
    case "Today": from = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
    case "7D": from = new Date(now.getTime() - 7 * 86400000); break;
    case "30D": from = new Date(now.getTime() - 30 * 86400000); break;
    case "90D": from = new Date(now.getTime() - 90 * 86400000); break;
    case "This month": from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "This year": from = new Date(now.getFullYear(), 0, 1); break;
    case "All time": from = new Date("2020-01-01"); break;
  }
  // Custom inputs override the preset when both are set.
  if (customFrom && customTo) {
    return {
      from: new Date(customFrom + "T00:00:00").toISOString(),
      to: new Date(customTo + "T23:59:59").toISOString(),
    };
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

function Kpi({ icon: Icon, label, value, sub, accent = "text-gray-900", snapshot = false }: {
  icon: React.ElementType; label: string; value: string; sub?: string; accent?: string; snapshot?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <Icon className="h-4 w-4 text-gray-300" />
      </div>
      <p className={`text-2xl font-bold mt-2 ${accent}`}>{value}</p>
      <div className="flex items-center gap-1.5 mt-1">
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
        {snapshot && <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">now</span>}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<Preset>("30D");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const range = useMemo(() => resolveRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-analytics", range.from, range.to],
    queryFn: () => api.get<Analytics>(`/admin/analytics?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`),
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  const usingCustom = !!(customFrom && customTo);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Business performance · {isFetching ? "updating…" : "updates every minute"}
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setPreset(p); setCustomFrom(""); setCustomTo(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !usingCustom && preset === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">Custom</span>
          <input type="date" value={customFrom} max={customTo || undefined}
            onChange={(e) => setCustomFrom(e.target.value)}
            className={`border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${usingCustom ? "border-gray-900" : "border-gray-200"}`} />
          <span className="text-gray-300 text-sm">→</span>
          <input type="date" value={customTo} min={customFrom || undefined}
            onChange={(e) => setCustomTo(e.target.value)}
            className={`border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${usingCustom ? "border-gray-900" : "border-gray-200"}`} />
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <AnalyticsBody data={data} />
      )}
    </div>
  );
}

function AnalyticsBody({ data }: { data: Analytics }) {
  const k = data.kpis;
  const maxRevenue = Math.max(1, ...data.revenueSeries.map((d) => d.revenueKobo));
  const totalOrders = data.orderStatus.reduce((s, o) => s + o.count, 0);
  const seriesLabel = data.range.granularity === "month" ? "monthly" : data.range.granularity === "week" ? "weekly" : "daily";

  return (
    <>
      {/* Range-scoped KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} label="GMV" value={formatPrice(k.gmvKobo)} sub={`${k.paidOrders} paid orders`} />
        <Kpi icon={TrendingUp} label="Gross Margin" value={formatPrice(k.grossMarginKobo)} sub="Retail − seller payout" accent="text-emerald-600" />
        <Kpi icon={ShoppingBag} label="Avg Order Value" value={formatPrice(k.aovKobo)} sub="Per paid order" />
        <Kpi icon={Wallet} label="Paid Out" value={formatPrice(k.paidOutKobo)} sub="Seller payouts in range" />
      </div>

      {/* Mixed: snapshot + range */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Wallet} label="Pending Payouts" value={formatPrice(k.pendingPayoutKobo)} sub={`${k.pendingPayoutCount} queued`} accent="text-amber-600" snapshot />
        <Kpi icon={Package} label="Live Inventory" value={String(k.liveItems)} sub={`${k.draftItems} draft`} snapshot />
        <Kpi icon={Percent} label="Sell-through" value={`${k.sellThrough}%`} sub={`${k.soldItems} sold in range`} />
        <Kpi icon={RotateCcw} label="Refund Rate" value={`${k.refundRate}%`} sub={`${formatPrice(k.refundedKobo)} refunded`} accent={k.refundRate > 5 ? "text-red-600" : "text-gray-900"} />
      </div>

      {/* Revenue trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">Revenue trend</h2>
            <p className="text-xs text-gray-400 mt-0.5">{seriesLabel} paid-order revenue over the selected range</p>
          </div>
          <span className="text-xs text-gray-400">Peak {formatPrice(maxRevenue)}</span>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.revenueSeries.map((d) => (
            <div key={d.date} className="flex-1 group relative flex flex-col justify-end">
              <div
                className="w-full bg-gray-900 rounded-t hover:bg-emerald-500 transition-colors"
                style={{ height: `${Math.max(2, (d.revenueKobo / maxRevenue) * 100)}%` }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-10">
                {d.date} · {formatPrice(d.revenueKobo)} · {d.orders} ord
              </div>
            </div>
          ))}
        </div>
        {maxRevenue <= 1 && (
          <p className="text-center text-xs text-gray-400 mt-4">No paid orders in this range yet.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order status distribution */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
          {totalOrders === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No orders in this range.</p>
          ) : (
            <div className="space-y-3">
              {data.orderStatus.map((o) => (
                <div key={o.status}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{label(o.status)}</span>
                    <span className="font-medium text-gray-900">{o.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${STATUS_COLOR[o.status] ?? "bg-gray-400"}`} style={{ width: `${(o.count / totalOrders) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submission pipeline */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Submission Pipeline</h2>
            <span className="text-xs text-emerald-600 font-medium">{k.acceptanceRate}% accepted</span>
          </div>
          {data.submissionStatus.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No submissions in this range.</p>
          ) : (
            <div className="space-y-2">
              {[...data.submissionStatus].sort((a, b) => b.count - a.count).map((s) => (
                <div key={s.status} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{label(s.status)}</span>
                  <span className="font-semibold text-gray-900">{s.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top sellers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Top Sellers by Earnings</h2>
          {data.topSellers.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No completed payouts in this range.</p>
          ) : (
            <div className="space-y-3">
              {data.topSellers.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{s.name}</span>
                  <span className="text-xs text-gray-400">{s.payouts} payouts</span>
                  <span className="text-sm font-semibold text-gray-900">{formatPrice(s.earnedKobo)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Top Items by Revenue</h2>
          {data.topItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No sales in this range.</p>
          ) : (
            <div className="space-y-3">
              {data.topItems.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{it.title}</span>
                  <span className="text-xs text-gray-400">×{it.unitsSold}</span>
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-0.5">
                    {formatPrice(it.revenueKobo)} <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top buyer locations (by state) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-gray-400" />
          <h2 className="font-semibold text-gray-900">Top Buyer Locations</h2>
          <span className="text-xs text-gray-400">by revenue, in range</span>
        </div>
        {data.topLocations.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">No orders in this range.</p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const maxRev = Math.max(1, ...data.topLocations.map((l) => l.revenueKobo));
              return data.topLocations.map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                  <span className="w-40 text-sm text-gray-700 truncate">{l.state}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gray-900" style={{ width: `${(l.revenueKobo / maxRev) * 100}%` }} />
                  </div>
                  <span className="text-xs text-gray-400 w-16 text-right">{l.orders} ord</span>
                  <span className="text-sm font-semibold text-gray-900 w-20 text-right">{formatPrice(l.revenueKobo)}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </>
  );
}
