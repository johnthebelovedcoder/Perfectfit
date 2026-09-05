"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Globe, Users, UserPlus, MousePointerClick, Eye, Clock, TrendingDown } from "lucide-react";
import { api } from "@/lib/api";
import { QueryError } from "@/components/shared/QueryError";

interface GaOverview {
  configured: boolean;
  error?: string;
  rangeDays?: number;
  kpis?: { activeUsers: number; newUsers: number; sessions: number; pageViews: number; avgSessionDurationSec: number; bounceRate: number };
  series?: { date: string; users: number; sessions: number }[];
  topPages?: { path: string; views: number }[];
  topCountries?: { country: string; users: number }[];
  devices?: { device: string; users: number }[];
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 28, label: "28 days" },
  { days: 90, label: "90 days" },
];

function fmt(n: number) { return n.toLocaleString(); }
function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
function fmtGaDate(d: string) {
  // GA returns YYYYMMDD
  if (d.length === 8) return `${d.slice(4, 6)}/${d.slice(6, 8)}`;
  return d;
}

export default function TrafficPage() {
  const [days, setDays] = useState(28);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["ga-overview", days],
    queryFn: () => api.get<GaOverview>(`/ga/overview?days=${days}`),
    refetchInterval: 5 * 60_000,
  });

  const ga = data;
  const maxUsers = Math.max(1, ...(ga?.series?.map((s) => s.users) ?? [0]));

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web Traffic</h1>
          <p className="text-gray-500 text-sm mt-1">Live visitor data from Google Analytics</p>
        </div>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          {RANGES.map((r) => (
            <button key={r.days} onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 text-xs font-medium ${days === r.days ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : !ga?.configured ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white mb-4"><Globe className="h-5 w-5" /></div>
          <h2 className="text-lg font-bold text-gray-900">Connect Google Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">The tag is live on the storefront. To show data here, connect the GA4 Data API:</p>
          <ol className="mt-4 space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>In Google Cloud, create a <strong>service account</strong> and download its JSON key.</li>
            <li>In GA4 → Admin → Property Access, add the service-account email with <strong>Viewer</strong> access.</li>
            <li>Set two env vars on the API and redeploy:
              <div className="mt-2 rounded-lg bg-gray-50 border border-gray-100 p-3 font-mono text-xs text-gray-700 space-y-1">
                <div>GA_PROPERTY_ID=<span className="text-gray-400">123456789</span> <span className="text-gray-400"># the numeric property id</span></div>
                <div>GA_CREDENTIALS_JSON=<span className="text-gray-400">{'{"type":"service_account",…}'}</span></div>
              </div>
            </li>
          </ol>
          <p className="text-xs text-gray-400 mt-4">The property id is the number in GA4 → Admin → Property Settings — not the <span className="font-mono">G-…</span> measurement id.</p>
        </div>
      ) : ga.error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">{ga.error}</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Active Users", value: fmt(ga.kpis!.activeUsers), icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
              { label: "New Users", value: fmt(ga.kpis!.newUsers), icon: UserPlus, color: "text-emerald-500", bg: "bg-emerald-50" },
              { label: "Sessions", value: fmt(ga.kpis!.sessions), icon: MousePointerClick, color: "text-purple-500", bg: "bg-purple-50" },
              { label: "Page Views", value: fmt(ga.kpis!.pageViews), icon: Eye, color: "text-orange-500", bg: "bg-orange-50" },
              { label: "Avg. Session", value: fmtDuration(ga.kpis!.avgSessionDurationSec), icon: Clock, color: "text-cyan-500", bg: "bg-cyan-50" },
              { label: "Bounce Rate", value: `${ga.kpis!.bounceRate}%`, icon: TrendingDown, color: "text-pink-500", bg: "bg-pink-50" },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${bg} mb-2`}><Icon className={`h-4 w-4 ${color}`} /></div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Users trend */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Visitors over time</h2>
            <div className="flex items-end gap-1 h-40">
              {(ga.series ?? []).map((s) => (
                <div key={s.date} className="flex-1 flex flex-col items-center justify-end group relative">
                  <div className="w-full bg-gray-900/80 hover:bg-gray-900 rounded-t transition-all" style={{ height: `${(s.users / maxUsers) * 100}%` }} />
                  <span className="absolute -top-6 hidden group-hover:block text-[10px] bg-gray-900 text-white rounded px-1.5 py-0.5 whitespace-nowrap">{fmt(s.users)} users</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-2">
              <span>{ga.series?.[0] && fmtGaDate(ga.series[0].date)}</span>
              <span>{ga.series?.length ? fmtGaDate(ga.series[ga.series.length - 1].date) : ""}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Top pages */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
              <h2 className="font-semibold text-gray-900 mb-4">Top Pages</h2>
              <div className="space-y-2">
                {(ga.topPages ?? []).map((p) => (
                  <div key={p.path} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate mr-3 font-mono text-xs">{p.path}</span>
                    <span className="font-semibold text-gray-900 shrink-0">{fmt(p.views)}</span>
                  </div>
                ))}
                {!ga.topPages?.length && <p className="text-sm text-gray-400">No page data yet.</p>}
              </div>
            </div>

            {/* Devices + countries */}
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Devices</h2>
                <div className="space-y-2">
                  {(ga.devices ?? []).map((d) => (
                    <div key={d.device} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{d.device}</span>
                      <span className="font-semibold text-gray-900">{fmt(d.users)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Top Countries</h2>
                <div className="space-y-2">
                  {(ga.topCountries ?? []).map((c) => (
                    <div key={c.country} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{c.country}</span>
                      <span className="font-semibold text-gray-900">{fmt(c.users)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
