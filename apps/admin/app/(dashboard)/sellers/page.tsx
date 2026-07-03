"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, CheckCircle, AlertTriangle, LayoutList, LayoutGrid } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface SellerStats {
  submitted: number;
  accepted: number;
  rejected: number;
}

interface Seller {
  id: string;
  firstName: string;
  lastName: string;
  city: string;
  bankName: string;
  isVerified: boolean;
  createdAt: string;
  totalEarnedKobo: number;
  stats: SellerStats;
  user: { email: string };
}

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }

export default function SellersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  const { data, isError, refetch } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: () => api.get<Seller[]>("/sellers"),
  });

  const sellers = data ?? [];

  const [view, setView] = useState<"grid" | "list">("grid");
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());

  const verifyMutation = useMutation({
    mutationFn: (id: string) => {
      setVerifyingIds((prev) => new Set(prev).add(id));
      return api.post<unknown>(`/sellers/${id}/verify`, {});
    },
    onSuccess: (_data, id) => {
      setVerifyingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
      void qc.invalidateQueries({ queryKey: ["admin-sellers"] });
    },
    onError: (_err, id) => {
      setVerifyingIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
    },
  });

  const filtered = sellers.filter((s) => {
    const q = search.toLowerCase();
    return !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  return (
    <div className="p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage registered sellers</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search sellers by name, email, city..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
        </div>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-gray-900 text-white" : "text-gray-400 hover:bg-gray-50"}`}><LayoutList className="h-4 w-4" /></button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No sellers found</div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((s) => {
            const initials = `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">{initials}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{s.firstName} {s.lastName}</p>
                      <p className="text-xs text-gray-400">{s.city} · {s.bankName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.isVerified ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                    ) : (
                      <button onClick={() => verifyMutation.mutate(s.id)} disabled={verifyingIds.has(s.id)} className="flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50">
                        <AlertTriangle className="h-3 w-3" />{verifyingIds.has(s.id) ? "Verifying…" : "Verify Seller"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[{ label: "Submitted", value: s.stats?.submitted ?? 0, color: "text-gray-900" }, { label: "Accepted", value: s.stats?.accepted ?? 0, color: "text-emerald-600" }, { label: "Rejected", value: s.stats?.rejected ?? 0, color: "text-red-500" }].map(({ label, value, color }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-2.5 text-center">
                      <p className={`text-xl font-bold ${color}`}>{value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-xs text-gray-400">Total Earned</p>
                    <p className="font-semibold text-gray-900">{formatPrice(s.totalEarnedKobo ?? 0)}</p>
                  </div>
                  <p className="text-xs text-gray-400">Joined {formatDate(s.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 uppercase tracking-wide border-b border-gray-50">
                <th className="text-left px-5 py-3 font-medium">Seller</th>
                <th className="text-left px-4 py-3 font-medium">Email</th>
                <th className="text-left px-4 py-3 font-medium">City</th>
                <th className="text-left px-4 py-3 font-medium">Submissions</th>
                <th className="text-left px-4 py-3 font-medium">Earned</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                <th className="text-right px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((s) => {
                const initials = `${s.firstName[0]}${s.lastName[0]}`.toUpperCase();
                return (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">{initials}</div>
                        <div>
                          <p className="font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-gray-400">{s.bankName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{s.user.email}</td>
                    <td className="px-4 py-3.5 text-gray-600">{s.city}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-gray-900 font-medium">{s.stats?.submitted ?? 0}</span>
                      <span className="text-gray-400 text-xs"> ({s.stats?.accepted ?? 0} acc)</span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-gray-900">{formatPrice(s.totalEarnedKobo ?? 0)}</td>
                    <td className="px-4 py-3.5 text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {s.isVerified ? (
                        <span className="flex items-center justify-end gap-1 text-xs text-emerald-600 font-medium"><CheckCircle className="h-3.5 w-3.5" /> Verified</span>
                      ) : (
                        <button onClick={() => verifyMutation.mutate(s.id)} disabled={verifyingIds.has(s.id)} className="flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full transition-colors disabled:opacity-50 ml-auto">
                          <AlertTriangle className="h-3 w-3" />{verifyingIds.has(s.id) ? "Verifying…" : "Verify"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
