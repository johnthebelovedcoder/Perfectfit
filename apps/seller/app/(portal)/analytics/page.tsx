"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, TrendingUp, Wallet, Package, Percent, CheckCircle, Clock, Tag } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface SellerAnalytics {
  range: { from: string; to: string; granularity: "day" | "week" | "month" };
  kpis: {
    earnedKobo: number; payoutsCount: number; lifetimeEarnedKobo: number;
    pendingPayoutKobo: number; pendingPayoutCount: number;
    itemsSold: number; liveItems: number; sellThrough: number;
    avgSalePayoutKobo: number; acceptanceRate: number; submissionsPending: number;
  };
  earningsSeries: { date: string; earnedKobo: number; payouts: number }[];
  submissionStatus: { status: string; count: number }[];
  topItems: { title: string; earnedKobo: number }[];
}

const PRESETS = ["7D", "30D", "90D", "This month", "This year", "All time"] as const;
type Preset = typeof PRESETS[number];

function label(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function resolveRange(preset: Preset, cFrom: string, cTo: string): { from: string; to: string } {
  const now = new Date();
  let from: Date;
  switch (preset) {
    case "7D": from = new Date(now.getTime() - 7 * 86400000); break;
    case "30D": from = new Date(now.getTime() - 30 * 86400000); break;
    case "90D": from = new Date(now.getTime() - 90 * 86400000); break;
    case "This month": from = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case "This year": from = new Date(now.getFullYear(), 0, 1); break;
    case "All time": from = new Date("2020-01-01"); break;
  }
  if (cFrom && cTo) {
    return { from: new Date(cFrom + "T00:00:00").toISOString(), to: new Date(cTo + "T23:59:59").toISOString() };
  }
  return { from: from.toISOString(), to: now.toISOString() };
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

export default function SellerAnalyticsPage() {
  const [preset, setPreset] = useState<Preset>("30D");
  const [cFrom, setCFrom] = useState("");
  const [cTo, setCTo] = useState("");
  const range = useMemo(() => resolveRange(preset, cFrom, cTo), [preset, cFrom, cTo]);
  const usingCustom = !!(cFrom && cTo);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["seller-analytics", range.from, range.to],
    queryFn: () => api.get<SellerAnalytics>(`/sellers/me/analytics?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`),
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  return (
    <div className="p-4 sm:p-8 space-y-7">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-400 text-sm mt-0.5">Your sales and earnings · {isFetching ? "updating…" : "updates every minute"}</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-100 shadow-sm p-3">
        <div className="flex gap-1 flex-wrap">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => { setPreset(p); setCFrom(""); setCTo(""); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                !usingCustom && preset === p ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-gray-400">Custom</span>
          <input type="date" value={cFrom} max={cTo || undefined} onChange={(e) => setCFrom(e.target.value)}
            className={`border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${usingCustom ? "border-gray-900" : "border-gray-200"}`} />
          <span className="text-gray-300 text-sm">→</span>
          <input type="date" value={cTo} min={cFrom || undefined} onChange={(e) => setCTo(e.target.value)}
            className={`border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 ${usingCustom ? "border-gray-900" : "border-gray-200"}`} />
        </div>
      </div>

      {isLoading || !data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <Body data={data} />
      )}
    </div>
  );
}

function Body({ data }: { data: SellerAnalytics }) {
  const k = data.kpis;
  const maxEarn = Math.max(1, ...data.earningsSeries.map((d) => d.earnedKobo));
  const seriesLabel = data.range.granularity === "month" ? "monthly" : data.range.granularity === "week" ? "weekly" : "daily";

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={DollarSign} label="Earned" value={formatPrice(k.earnedKobo)} sub={`${k.payoutsCount} payouts in range`} accent="text-emerald-600" />
        <Kpi icon={TrendingUp} label="Lifetime Earned" value={formatPrice(k.lifetimeEarnedKobo)} snapshot />
        <Kpi icon={Wallet} label="Pending Payout" value={formatPrice(k.pendingPayoutKobo)} sub={`${k.pendingPayoutCount} queued`} accent="text-amber-600" snapshot />
        <Kpi icon={Package} label="Items Sold" value={String(k.itemsSold)} sub={`${formatPrice(k.avgSalePayoutKobo)} avg payout`} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi icon={Tag} label="Live Items" value={String(k.liveItems)} sub="On the store now" snapshot />
        <Kpi icon={Percent} label="Sell-through" value={`${k.sellThrough}%`} sub="Sold ÷ (sold + live)" />
        <Kpi icon={CheckCircle} label="Acceptance Rate" value={`${k.acceptanceRate}%`} sub="Of reviewed submissions" />
        <Kpi icon={Clock} label="Pending Review" value={String(k.submissionsPending)} sub="Awaiting admin" snapshot />
      </div>

      {/* Earnings trend */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-gray-900">Earnings trend</h2>
            <p className="text-xs text-gray-400 mt-0.5">{seriesLabel} payouts over the selected range</p>
          </div>
          <span className="text-xs text-gray-400">Peak {formatPrice(maxEarn)}</span>
        </div>
        <div className="flex items-end gap-1 h-40">
          {data.earningsSeries.map((d) => (
            <div key={d.date} className="flex-1 group relative flex flex-col justify-end">
              <div className="w-full bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors"
                style={{ height: `${Math.max(2, (d.earnedKobo / maxEarn) * 100)}%` }} />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-10">
                {d.date} · {formatPrice(d.earnedKobo)} · {d.payouts} payout{d.payouts !== 1 ? "s" : ""}
              </div>
            </div>
          ))}
        </div>
        {maxEarn <= 1 && <p className="text-center text-xs text-gray-400 mt-4">No payouts in this range yet.</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top items */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Your Top Items by Payout</h2>
          {data.topItems.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No items sold in this range.</p>
          ) : (
            <div className="space-y-3">
              {data.topItems.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-gray-300">{i + 1}</span>
                  <span className="flex-1 text-sm text-gray-700 truncate">{it.title}</span>
                  <span className="text-sm font-semibold text-emerald-600">{formatPrice(it.earnedKobo)}</span>
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
    </>
  );
}
