"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LayoutList, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  firstName: string;
  lastName: string;
  email: string;
  addressLine1: string;
  city: string;
  state: string;
  totalAmountKobo: number;
  createdAt: string;
  trackingNumber: string | null;
  courierName: string | null;
  orderItems: Array<{ item: { title: string; retailPrice: number } }>;
}

const TABS = ["All", "Placed", "Processing", "Dispatched", "Out for Delivery", "Delivered", "Returns"] as const;

const STATUS_STYLE: Record<string, string> = {
  PLACED: "text-blue-600 bg-blue-50 border-blue-200",
  PROCESSING: "text-amber-600 bg-amber-50 border-amber-200",
  DISPATCHED: "text-purple-600 bg-purple-50 border-purple-200",
  OUT_FOR_DELIVERY: "text-purple-600 bg-purple-50 border-purple-200",
  DELIVERED: "text-green-600 bg-green-50 border-green-200",
  RETURN_REQUESTED: "text-orange-600 bg-orange-50 border-orange-200",
  REFUNDED: "text-gray-600 bg-gray-50 border-gray-200",
  CANCELLED: "text-red-600 bg-red-50 border-red-200",
};

const STATUS_LABEL: Record<string, string> = {
  PLACED: "Order Placed",
  PROCESSING: "Processing",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  RETURN_REQUESTED: "Return Requested",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

const NEXT_ACTION: Record<string, { label: string; nextStatus: string }> = {
  PLACED: { label: "Start Processing", nextStatus: "PROCESSING" },
  PROCESSING: { label: "Mark Dispatched", nextStatus: "DISPATCHED" },
  DISPATCHED: { label: "Out for Delivery", nextStatus: "OUT_FOR_DELIVERY" },
  OUT_FOR_DELIVERY: { label: "Mark Delivered", nextStatus: "DELIVERED" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function OrdersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { tracking: string; courier: string }>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");

  const { data, isError, refetch } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => api.get<Order[]>("/orders?limit=500"),
    refetchInterval: 30_000,
  });

  const orders = data ?? [];

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: unknown }) => api.patch<unknown>(`/orders/${id}/status`, body),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: unknown) =>
      setMutationError(err instanceof Error ? err.message : "Failed to update order status"),
  });

  const resolveReturnMutation = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      api.post<unknown>(`/orders/${id}/return/resolve`, { approved }),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (err: unknown) =>
      setMutationError(err instanceof Error ? err.message : "Failed to resolve return"),
  });

  const filtered = orders.filter((o) => {
    const matchTab =
      tab === "All" ||
      (tab === "Returns" && (o.status === "RETURN_REQUESTED" || o.status === "REFUNDED")) ||
      (tab === "Out for Delivery" && o.status === "OUT_FOR_DELIVERY") ||
      (tab === "Dispatched" && o.status === "DISPATCHED") ||
      (tab !== "Returns" && tab !== "Out for Delivery" && tab !== "Dispatched" && o.status === tab.toUpperCase());
    const q = search.toLowerCase();
    const matchSearch = !q || o.orderNumber.toLowerCase().includes(q) || `${o.firstName} ${o.lastName}`.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500 text-sm mt-1">Manage and track all orders</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by order ID, buyer, tracking..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden shrink-0">
          <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}><LayoutList className="h-4 w-4" /></button>
          <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}><LayoutGrid className="h-4 w-4" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No orders found</div>
      ) : view === "list" ? (
        <div className="space-y-4">
          {filtered.map((order) => {
            const action = NEXT_ACTION[order.status];
            const ti = trackingInputs[order.id] ?? { tracking: "", courier: "" };
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-start justify-between px-5 py-4 border-b border-gray-50">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">{order.orderNumber}</span>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[order.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
                        {STATUS_LABEL[order.status] ?? order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{order.firstName} {order.lastName} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmountKobo)}</span>
                    {action && (
                      <button
                        onClick={() => updateMutation.mutate({
                          id: order.id,
                          body: { status: action.nextStatus, trackingNumber: ti.tracking || undefined, courierName: ti.courier || undefined }
                        })}
                        disabled={updateMutation.isPending}
                        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-60"
                      >
                        {action.label}
                      </button>
                    )}
                    {order.status === "RETURN_REQUESTED" && (
                      <div className="flex gap-2">
                        <button onClick={() => resolveReturnMutation.mutate({ id: order.id, approved: false })} disabled={resolveReturnMutation.isPending} className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60">Deny</button>
                        <button onClick={() => resolveReturnMutation.mutate({ id: order.id, approved: true })} disabled={resolveReturnMutation.isPending} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-60">Approve Refund</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 px-5 py-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Items</p>
                    {order.orderItems.map((oi, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-gray-700">{oi.item.title} x1</span>
                        <span className="text-gray-500">{formatPrice(oi.item.retailPrice)}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Delivery</p>
                    <p className="text-gray-700">{order.addressLine1}, {order.city}, {order.state}</p>
                    <p className="text-gray-500 text-xs mt-1">{order.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Tracking</p>
                    {order.trackingNumber ? (
                      <p className="text-gray-700 font-mono text-xs">{order.courierName} · {order.trackingNumber}</p>
                    ) : (
                      <div className="space-y-1.5">
                        <input placeholder="Courier (e.g. GIG)" value={ti.courier} onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...ti, courier: e.target.value } }))} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                        <input placeholder="Tracking number" value={ti.tracking} onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...ti, tracking: e.target.value } }))} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order) => {
            const action = NEXT_ACTION[order.status];
            const ti = trackingInputs[order.id] ?? { tracking: "", courier: "" };
            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{order.firstName} {order.lastName}</p>
                    <p className="text-xs text-gray-300">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_STYLE[order.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {order.orderItems.map((oi, i) => (
                    <div key={i} className="flex justify-between text-gray-600">
                      <span className="truncate">{oi.item.title}</span>
                      <span className="shrink-0 ml-2 text-gray-400">{formatPrice(oi.item.retailPrice)}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-400 border-t border-gray-50 pt-2">
                  <p className="truncate">{order.addressLine1}, {order.city}</p>
                  {order.trackingNumber && <p className="font-mono mt-0.5 text-gray-500">{order.courierName} · {order.trackingNumber}</p>}
                  {!order.trackingNumber && (
                    <div className="space-y-1 mt-1">
                      <input placeholder="Courier" value={ti.courier} onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...ti, courier: e.target.value } }))} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                      <input placeholder="Tracking number" value={ti.tracking} onChange={e => setTrackingInputs(prev => ({ ...prev, [order.id]: { ...ti, tracking: e.target.value } }))} className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-50 mt-auto">
                  <span className="font-bold text-gray-900">{formatPrice(order.totalAmountKobo)}</span>
                  {action && (
                    <button onClick={() => updateMutation.mutate({ id: order.id, body: { status: action.nextStatus, trackingNumber: ti.tracking || undefined, courierName: ti.courier || undefined } })} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">{action.label}</button>
                  )}
                  {order.status === "RETURN_REQUESTED" && (
                    <div className="flex gap-1.5">
                      <button onClick={() => resolveReturnMutation.mutate({ id: order.id, approved: false })} disabled={resolveReturnMutation.isPending} className="border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-1.5 rounded-lg">Deny</button>
                      <button onClick={() => resolveReturnMutation.mutate({ id: order.id, approved: true })} disabled={resolveReturnMutation.isPending} className="bg-orange-500 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg">Approve</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
