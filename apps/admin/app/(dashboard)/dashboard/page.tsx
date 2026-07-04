"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Package, Inbox, ShoppingBag, TrendingUp, DollarSign, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface Stats {
  liveItems: number;
  pendingSubmissions: number;
  ordersToday: number;
  totalGmvKobo: number;
  pendingPayouts: number;
  activeSellers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  firstName: string;
  lastName: string;
  totalAmountKobo: number;
  status: string;
  createdAt: string;
  orderItems: Array<{ item: { title: string } }>;
}

interface PendingSub {
  id: string;
  itemType: string;
  brand: string | null;
  status: string;
  createdAt: string;
  seller: { firstName: string; lastName: string };
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  PLACED: "text-amber-600 bg-amber-50",
  PROCESSING: "text-blue-600 bg-blue-50",
  DISPATCHED: "text-purple-600 bg-purple-50",
  DELIVERED: "text-green-600 bg-green-50",
  CANCELLED: "text-red-600 bg-red-50",
};

const SUB_STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "text-amber-600 bg-amber-50",
  UNDER_NEGOTIATION: "text-blue-600 bg-blue-50",
  ACCEPTED: "text-green-600 bg-green-50",
  REJECTED: "text-red-600 bg-red-50",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminDashboard() {
  const { data: stats, isError, refetch } = useQuery({ queryKey: ["admin-stats"], queryFn: () => api.get<Stats>("/admin/stats") });
  const { data: ordersData } = useQuery({ queryKey: ["admin-recent-orders"], queryFn: () => api.get<RecentOrder[]>("/orders?limit=4") });
  const { data: subsData } = useQuery({ queryKey: ["admin-pending-subs"], queryFn: () => api.get<PendingSub[]>("/submissions/queue?status=PENDING_REVIEW") });

  const orders = ordersData ?? [];
  const subs = (subsData ?? []).slice(0, 5);

  const statCards = [
    { label: "Total Items Live", value: stats?.liveItems ?? "—", sub: "+3 today", icon: Package, color: "text-emerald-500" },
    { label: "Pending Submissions", value: stats?.pendingSubmissions ?? subs.length, sub: `${subs.filter(s => s.status === "PENDING_REVIEW").length} urgent`, icon: Inbox, color: "text-amber-500" },
    { label: "Orders Today", value: stats?.ordersToday ?? "—", sub: "+2 since noon", icon: ShoppingBag, color: "text-blue-500" },
    { label: "Total GMV (June)", value: stats?.totalGmvKobo ? formatPrice(stats.totalGmvKobo) : "$0", sub: "+12% vs May", icon: TrendingUp, color: "text-purple-500" },
    { label: "Pending Payouts", value: stats?.pendingPayouts ?? "—", sub: "$180K total", icon: DollarSign, color: "text-orange-500" },
    { label: "Active Sellers", value: stats?.activeSellers ?? "—", sub: "+4 this week", icon: Users, color: "text-pink-500" },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-8">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome back. Here&apos;s what&apos;s <span className="text-emerald-600">happening today</span>.</p>
      </div>

      {/* 6 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className={`${color} mb-3`}><Icon className="h-5 w-5" /></div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">No recent orders</p>
            ) : orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-gray-900">{o.firstName} {o.lastName.charAt(0)}.</p>
                  <p className="text-xs text-gray-400">{o.orderNumber} · {o.orderItems.length} item{o.orderItems.length !== 1 ? "s" : ""} · {timeAgo(o.createdAt)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatPrice(o.totalAmountKobo)}</p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${ORDER_STATUS_STYLE[o.status] ?? "text-gray-500 bg-gray-50"}`}>
                    {o.status.charAt(0) + o.status.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Submissions */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Pending Submissions</h2>
            <Link href="/submissions" className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">
              View All →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {subs.length === 0 ? (
              <p className="p-5 text-sm text-gray-400">No pending submissions</p>
            ) : subs.map((s) => (
              <Link key={s.id} href={`/submissions/${s.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.brand ? `${s.brand} ` : ""}{s.itemType}</p>
                  <p className="text-xs text-gray-400">by {s.seller.firstName} {s.seller.lastName} · {timeAgo(s.createdAt)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SUB_STATUS_STYLE[s.status] ?? "text-gray-500 bg-gray-50"}`}>
                  {s.status === "PENDING_REVIEW" ? "Pending Review" : s.status === "UNDER_NEGOTIATION" ? "Negotiating" : s.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
