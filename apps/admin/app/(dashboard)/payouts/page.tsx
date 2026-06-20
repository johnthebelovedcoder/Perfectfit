"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LayoutList, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";

interface Payout {
  id: string;
  amountKobo: number;
  status: string;
  createdAt: string;
  processedAt: string | null;
  seller: { firstName: string; lastName: string; bankName: string; user: { email: string } };
  item: { title: string; id: string };
}

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short" }); }

const TABS = ["All", "Pending", "Processed"] as const;

export default function PayoutsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const [mutationError, setMutationError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "grid">("list");

  const { data } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: () => api.get<Payout[]>("/payouts"),
  });

  const payouts = data ?? [];

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => api.post<unknown>(`/payouts/${id}/process`, {}),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["admin-payouts"] });
    },
    onError: (err: unknown) =>
      setMutationError(err instanceof Error ? err.message : "Failed to mark payout as paid"),
  });

  const filtered = payouts.filter((p) => {
    const matchTab = tab === "All" || (tab === "Pending" && p.status === "QUEUED") || (tab === "Processed" && p.status === "COMPLETED");
    const q = search.toLowerCase();
    const matchSearch = !q || `${p.seller.firstName} ${p.seller.lastName}`.toLowerCase().includes(q) || p.item.title.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const pendingTotal = payouts.filter(p => p.status === "QUEUED").reduce((sum, p) => sum + p.amountKobo, 0);

  return (
    <div className="p-8 space-y-6">
      {mutationError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {mutationError}
        </div>
      )}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage seller payouts for sold items</p>
        </div>
        {pendingTotal > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-right">
            <p className="text-xs text-amber-600 font-medium">Pending Total</p>
            <p className="text-lg font-bold text-amber-700">{formatPrice(pendingTotal)}</p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by seller, item, payout ID..."
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
        <div className="bg-white rounded-xl border border-gray-100 py-16 text-center text-gray-400 text-sm">No payouts found</div>
      ) : view === "list" ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Payout</th>
                <th className="text-left px-4 py-3 font-medium">Seller</th>
                <th className="text-left px-4 py-3 font-medium">Item</th>
                <th className="text-left px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="px-5 py-3.5">
                    <p className="font-mono text-xs font-medium text-gray-900">PAY-{p.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{formatDate(p.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3.5 font-medium text-gray-800">{p.seller.firstName} {p.seller.lastName}</td>
                  <td className="px-4 py-3.5 text-blue-600">{p.item.title}</td>
                  <td className="px-4 py-3.5 font-bold text-gray-900">{formatPrice(p.amountKobo)}</td>
                  <td className="px-4 py-3.5">
                    {p.status === "QUEUED" ? (
                      <div className="flex items-center gap-1.5 text-amber-600"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="text-xs font-medium">Pending</span></div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-green-600"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs font-medium">Processed</span></div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {p.status === "QUEUED" ? (
                      <button onClick={() => markPaidMutation.mutate(p.id)} disabled={markPaidMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">$ Mark as Paid</button>
                    ) : (
                      <span className="text-xs text-gray-400">Paid {p.processedAt ? formatDate(p.processedAt) : ""}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs font-medium text-gray-900">PAY-{p.id.slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(p.createdAt)}</p>
                </div>
                {p.status === "QUEUED" ? (
                  <div className="flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /><span className="text-xs font-medium">Pending</span></div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-xs font-medium">Processed</span></div>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-gray-900">{p.seller.firstName} {p.seller.lastName}</p>
                <p className="text-xs text-gray-400">{p.seller.bankName} · {p.seller.user.email}</p>
                <p className="text-xs text-blue-600 truncate">{p.item.title}</p>
              </div>
              <div className="flex items-center justify-between border-t border-gray-50 pt-3 mt-auto">
                <span className="text-lg font-bold text-gray-900">{formatPrice(p.amountKobo)}</span>
                {p.status === "QUEUED" ? (
                  <button onClick={() => markPaidMutation.mutate(p.id)} disabled={markPaidMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">$ Mark as Paid</button>
                ) : (
                  <span className="text-xs text-gray-400">Paid {p.processedAt ? formatDate(p.processedAt) : ""}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
