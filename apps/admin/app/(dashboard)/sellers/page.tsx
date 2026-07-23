"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, LayoutList, LayoutGrid, ShieldCheck, X } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@thread/utils";
import { idDocumentLabel, kycStatusLabel } from "@thread/types";
import type { KycStatus } from "@thread/types";
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
  createdAt: string;
  totalEarnedKobo: number;
  stats: SellerStats;
  user: { email: string };
  kycStatus: KycStatus;
}

/** Full record from GET /sellers/:id — includes decrypted identity PII. */
interface SellerDetail extends Seller {
  phone: string;
  dateOfBirth: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  region: string | null;
  postalCode: string | null;
  country: string | null;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  idIssuingCountry: string | null;
  kycSubmittedAt: string | null;
  kycRejectionReason: string | null;
}

function formatDate(d: string) { return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }); }

const KYC_PILL: Record<KycStatus, string> = {
  NOT_STARTED: "text-gray-500 bg-gray-50 border-gray-200",
  SUBMITTED: "text-amber-700 bg-amber-50 border-amber-200",
  APPROVED: "text-emerald-600 bg-emerald-50 border-emerald-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
};

function KycPill({ status }: { status: KycStatus }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${KYC_PILL[status ?? "NOT_STARTED"]}`}>
      KYC: {kycStatusLabel(status ?? "NOT_STARTED")}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm text-gray-900">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  );
}

/** Admin review of a seller's submitted KYC. Approving here unblocks their payouts. */
function KycReviewModal({ sellerId, onClose }: { sellerId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: seller, isLoading } = useQuery({
    queryKey: ["admin-seller", sellerId],
    queryFn: () => api.get<SellerDetail>(`/sellers/${sellerId}`),
  });

  const reviewMutation = useMutation({
    mutationFn: (body: Record<string, string>) => api.post(`/sellers/${sellerId}/kyc/review`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin-sellers"] });
      void qc.invalidateQueries({ queryKey: ["admin-seller", sellerId] });
      onClose();
    },
    onError: (err: unknown) => setError(err instanceof Error ? err.message : "Review failed"),
  });

  function reject() {
    setError(null);
    if (reason.trim().length < 10) { setError("Give the seller a reason of at least 10 characters"); return; }
    reviewMutation.mutate({ decision: "REJECT", rejectionReason: reason.trim() });
  }

  const address = seller
    ? [seller.addressLine1, seller.addressLine2, seller.city, seller.region, seller.postalCode, seller.country]
        .filter(Boolean).join(", ")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Review Identity Verification</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <div className="overflow-y-auto p-6 space-y-5">
          {isLoading || !seller ? (
            <p className="text-sm text-gray-400 py-8 text-center">Loading seller details…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DetailRow label="Name" value={`${seller.firstName} ${seller.lastName}`} />
                <DetailRow label="Email" value={seller.user.email} />
                <DetailRow label="Phone" value={seller.phone} />
                <DetailRow label="Date of Birth" value={seller.dateOfBirth ? new Date(seller.dateOfBirth).toLocaleDateString() : null} />
                <DetailRow label="ID Document" value={seller.idDocumentType ? idDocumentLabel(seller.idDocumentType) : null} />
                <DetailRow label="ID Number" value={seller.idDocumentNumber} />
                <DetailRow label="Issuing Country" value={seller.idIssuingCountry} />
                <DetailRow label="Submitted" value={seller.kycSubmittedAt ? formatDate(seller.kycSubmittedAt) : null} />
                <div className="col-span-2">
                  <DetailRow label="Residential Address" value={address} />
                </div>
              </div>

              {rejecting && (
                <div>
                  <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1 block">
                    Reason for rejection (shown to the seller)
                  </label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                    placeholder="e.g. The ID number doesn't match the name on the account."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          {rejecting ? (
            <>
              <button onClick={() => { setRejecting(false); setError(null); }}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Back
              </button>
              <button onClick={reject} disabled={reviewMutation.isPending}
                className="px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl disabled:opacity-50 transition-colors">
                {reviewMutation.isPending ? "Rejecting…" : "Confirm Rejection"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setRejecting(true)} disabled={reviewMutation.isPending || isLoading}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors">
                Reject
              </button>
              <button onClick={() => reviewMutation.mutate({ decision: "APPROVE" })} disabled={reviewMutation.isPending || isLoading}
                className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl disabled:opacity-50 transition-colors">
                {reviewMutation.isPending ? "Approving…" : "Approve"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SellersPage() {
  const [search, setSearch] = useState("");

  const { data, isError, refetch } = useQuery({
    queryKey: ["admin-sellers"],
    queryFn: () => api.get<Seller[]>("/sellers"),
  });

  const sellers = data ?? [];

  const [view, setView] = useState<"grid" | "list">("grid");
  const [kycSellerId, setKycSellerId] = useState<string | null>(null);

  const filtered = sellers.filter((s) => {
    const q = search.toLowerCase();
    return !q || `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.user.email.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-8 space-y-6">
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

                <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-50">
                  <KycPill status={s.kycStatus} />
                  {s.kycStatus === "SUBMITTED" && (
                    <button onClick={() => setKycSellerId(s.id)}
                      className="flex items-center gap-1 text-xs font-medium text-gray-700 border border-gray-200 px-2.5 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                      <ShieldCheck className="h-3 w-3" /> Review KYC
                    </button>
                  )}
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
                <th className="text-right px-5 py-3 font-medium">KYC</th>
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
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <KycPill status={s.kycStatus} />
                        {s.kycStatus === "SUBMITTED" && (
                          <button onClick={() => setKycSellerId(s.id)}
                            className="text-xs font-medium text-gray-600 underline hover:text-gray-900">
                            Review
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {kycSellerId && <KycReviewModal sellerId={kycSellerId} onClose={() => setKycSellerId(null)} />}
    </div>
  );
}
