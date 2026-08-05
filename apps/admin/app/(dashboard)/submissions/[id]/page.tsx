"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowLeft, Check, X, DollarSign, MessageCircle, Globe } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import { categoryLabel } from "@thread/types";

interface SubmissionDetail {
  id: string;
  itemType: string;
  brand: string | null;
  category: string;
  size: string;
  genderTarget: string;
  condition: string;
  conditionNote: string | null;
  photos: string[];
  sellerDescription: string;
  desiredPayoutPrice: number;
  agreedPayoutPrice: number | null;
  retailPrice: number | null;
  status: string;
  adminNote: string | null;
  moreInfoRequest: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  seller: { firstName: string; lastName: string; user: { email: string } };
  item: { id: string; slug: string; isLive: boolean } | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "text-amber-600 bg-amber-50 border-amber-200",
  UNDER_NEGOTIATION: "text-blue-600 bg-blue-50 border-blue-200",
  AWAITING_MORE_INFO: "text-orange-600 bg-orange-50 border-orange-200",
  ACCEPTED: "text-green-600 bg-green-50 border-green-200",
  AWAITING_SHIPMENT: "text-purple-600 bg-purple-50 border-purple-200",
  RECEIVED_AT_WAREHOUSE: "text-indigo-600 bg-indigo-50 border-indigo-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
  LIVE: "text-emerald-600 bg-emerald-50 border-emerald-200",
  SOLD: "text-teal-600 bg-teal-50 border-teal-200",
  PAYOUT_QUEUED: "text-cyan-600 bg-cyan-50 border-cyan-200",
  PAYOUT_PROCESSED: "text-gray-600 bg-gray-50 border-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  UNDER_NEGOTIATION: "Under Negotiation",
  AWAITING_MORE_INFO: "More Info Needed",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  AWAITING_SHIPMENT: "Awaiting Shipment",
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  LIVE: "Live on Store",
  SOLD: "Sold",
  PAYOUT_QUEUED: "Payout Queued",
  PAYOUT_PROCESSED: "Paid Out",
};

type Panel = "none" | "accept" | "reject" | "negotiate" | "moreInfo";


const REJECTION_REASONS = [
  { value: "ITEM_CONDITION_BELOW_STANDARD", label: "Item condition below standard" },
  { value: "CATEGORY_NOT_ACCEPTED", label: "Category not currently accepted" },
  { value: "PHOTOS_INSUFFICIENT", label: "Photos insufficient" },
  { value: "ITEM_NOT_SELLABLE", label: "Item not sellable" },
  { value: "OTHER", label: "Other" },
];

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [panel, setPanel] = useState<Panel>("none");

  // Accept form
  const [retailPrice, setRetailPrice] = useState("");
  const [sellerPayout, setSellerPayout] = useState("");
  const [adminNote, setAdminNote] = useState("");

  // Reject form
  const [rejectionReason, setRejectionReason] = useState("ITEM_CONDITION_BELOW_STANDARD");
  const [rejectionNote, setRejectionNote] = useState("");

  // Negotiate form
  const [counterOffer, setCounterOffer] = useState("");
  const [negotiateMsg, setNegotiateMsg] = useState("");

  // More info
  const [moreInfoRequest, setMoreInfoRequest] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`),
  });

  const sub = data as unknown as SubmissionDetail;

  const onError = (err: unknown) =>
    setActionError(err instanceof Error ? err.message : "Something went wrong. Please try again.");

  const reviewMutation = useMutation({
    mutationFn: (body: unknown) => api.patch<unknown>(`/submissions/${id}/review`, body),
    onSuccess: () => {
      setActionError(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["admin-all-submissions"] });
      setPanel("none");
    },
    onError,
  });

  const createListingMutation = useMutation({
    mutationFn: () => api.post<{ id: string; slug: string }>(`/items/from-submission/${id}`, {}),
    onSuccess: () => {
      setActionError(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["admin-items-all"] });
    },
    onError,
  });

  if (!sub) {
    return (
      <div className="p-4 sm:p-8">
        <div className="h-96 flex items-center justify-center text-gray-400">Loading...</div>
      </div>
    );
  }

  const photos = sub.photos ?? [];
  const canReview = ["PENDING_REVIEW", "AWAITING_MORE_INFO", "UNDER_NEGOTIATION"].includes(sub.status);

  const ActionError = actionError ? (
    <div className="mx-4 mt-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
      {actionError}
    </div>
  ) : null;

  return (
    <div className="flex min-h-[calc(100vh-0px)]">
      {/* Left: photo viewer */}
      <div className="flex-1 bg-gray-100 flex flex-col">
        <div className="p-4">
          <Link href="/submissions" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Submissions
          </Link>
        </div>

        <div className="flex-1 relative min-h-[400px]">
          {photos[photoIndex] && (
            <Image
              src={getCloudinaryUrl(photos[photoIndex]!, { width: 800, height: 1000 })}
              alt="Submission photo"
              fill
              sizes="(max-width: 1024px) 100vw, calc(100vw - 384px)"
              className="object-contain"
            />
          )}
          {photos.length > 1 && (
            <>
              <button onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center hover:bg-gray-50">
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {photos.map((p, i) => (
              <button key={i} onClick={() => setPhotoIndex(i)}
                className={`relative h-16 w-12 shrink-0 rounded-lg overflow-hidden ${i === photoIndex ? "ring-2 ring-gray-900" : "opacity-60"}`}>
                <Image src={getCloudinaryUrl(p, { width: 96, height: 128 })} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: details + actions */}
      <div className="w-96 bg-white border-l border-gray-100 flex flex-col overflow-y-auto">
        {ActionError}
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-400 font-mono">THR-{id.slice(-8).toUpperCase()}</p>
              <h1 className="text-xl font-bold text-gray-900 mt-0.5">
                {sub.brand ? `${sub.brand} ` : ""}{sub.itemType}
              </h1>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[sub.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
              {STATUS_LABEL[sub.status] ?? sub.status}
            </span>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-y-3 text-sm border-t border-gray-50 pt-4">
            {[
              ["Seller", `${sub.seller.firstName} ${sub.seller.lastName}`],
              ["Category", categoryLabel(sub.category)],
              ["Size", sub.size],
              ["Condition", <span key="c" className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.condition === "EXCELLENT" ? "bg-green-50 text-green-700" : sub.condition === "GOOD" ? "bg-yellow-50 text-yellow-700" : "bg-orange-50 text-orange-700"}`}>{sub.condition.charAt(0) + sub.condition.slice(1).toLowerCase()}</span>],
              ["Seller Ask", formatPrice(sub.desiredPayoutPrice)],
            ].map(([label, val]) => (
              <div key={label as string}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="font-medium text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {sub.conditionNote && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400 mb-1">Condition Notes</p>
              <p className="text-sm text-gray-700">{sub.conditionNote}</p>
            </div>
          )}

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400 mb-1">Description</p>
            <p className="text-sm text-gray-700">{sub.sellerDescription}</p>
          </div>

          {/* Review Actions */}
          {canReview && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <p className="text-sm font-semibold text-gray-900">Review Actions</p>

              {panel === "none" && (
                <div className="space-y-2">
                  <button onClick={() => setPanel("accept")}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium transition-colors">
                    <Check className="h-4 w-4" /> Accept Submission
                  </button>
                  <button onClick={() => setPanel("reject")}
                    className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-sm font-medium transition-colors">
                    <X className="h-4 w-4" /> Reject Submission
                  </button>
                  <button onClick={() => setPanel("negotiate")}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3 text-sm font-medium transition-colors">
                    <DollarSign className="h-4 w-4" /> Negotiate Payout
                  </button>
                  <button onClick={() => setPanel("moreInfo")}
                    className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-3 text-sm font-medium transition-colors">
                    <MessageCircle className="h-4 w-4" /> Request More Info
                  </button>
                </div>
              )}

              {/* Accept panel */}
              {panel === "accept" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-emerald-800">Accept & Set Price</p>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Retail Price (USD — what buyers pay)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={retailPrice} onChange={e => setRetailPrice(e.target.value)}
                        placeholder="e.g. 35.00"
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Seller Payout (USD — what seller receives)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={sellerPayout} onChange={e => setSellerPayout(e.target.value)}
                        placeholder="e.g. 15.00"
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Admin Note (optional)</label>
                    <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)}
                      placeholder="Note for the seller..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPanel("none")} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button
                      disabled={!retailPrice || !sellerPayout || reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ decision: "ACCEPT", retailPrice: Math.round(parseFloat(retailPrice) * 100), agreedPayoutPrice: Math.round(parseFloat(sellerPayout) * 100), adminNote: adminNote || undefined })}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                      {reviewMutation.isPending ? "Saving..." : "Accept & List Live"}
                    </button>
                  </div>
                </div>
              )}

              {/* Reject panel */}
              {panel === "reject" && (
                <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-red-800">Reject Submission</p>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Rejection Reason *</label>
                    <select value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200">
                      {REJECTION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Admin Note</label>
                    <textarea value={rejectionNote} onChange={e => setRejectionNote(e.target.value)}
                      placeholder="Additional context for the seller..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPanel("none")} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button
                      disabled={reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ decision: "REJECT", rejectionReason, rejectionNote: rejectionNote || undefined })}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                      {reviewMutation.isPending ? "Saving..." : "Reject & Notify Seller"}
                    </button>
                  </div>
                </div>
              )}

              {/* Negotiate panel — uses ACCEPT with different payout; server auto-sets UNDER_NEGOTIATION */}
              {panel === "negotiate" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                  <p className="text-sm font-semibold text-blue-800">Negotiate Payout</p>
                  <p className="text-xs text-gray-500">Seller is asking {formatPrice(sub.desiredPayoutPrice)}. Set your counter-offer below — the seller will be notified to accept or decline.</p>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Retail Price (USD — what buyers pay)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={retailPrice} onChange={e => setRetailPrice(e.target.value)}
                        placeholder="e.g. 35.00"
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Counter-Offer Payout (USD — what seller receives)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <input type="number" step="0.01" min="0" value={counterOffer} onChange={e => setCounterOffer(e.target.value)}
                        placeholder="Your counter-offer..."
                        className="w-full border border-gray-200 rounded-lg pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Note to Seller (optional)</label>
                    <textarea value={negotiateMsg} onChange={e => setNegotiateMsg(e.target.value)}
                      placeholder="Explain your counter-offer..."
                      rows={2}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none" />
                  </div>
                  {(() => {
                    const offerCents = counterOffer ? Math.round(parseFloat(counterOffer) * 100) : 0;
                    const willAutoAccept = offerCents > 0 && offerCents >= sub.desiredPayoutPrice;
                    return willAutoAccept ? (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        ⚠️ This matches or exceeds the seller&apos;s ask ({formatPrice(sub.desiredPayoutPrice)}) — submission will be <strong>immediately accepted</strong> instead of entering negotiation.
                      </p>
                    ) : null;
                  })()}
                  <div className="flex gap-2">
                    <button onClick={() => setPanel("none")} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button
                      disabled={!counterOffer || !retailPrice || reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({
                        decision: "ACCEPT",
                        retailPrice: Math.round(parseFloat(retailPrice) * 100),
                        agreedPayoutPrice: Math.round(parseFloat(counterOffer) * 100),
                        adminNote: negotiateMsg || undefined,
                      })}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                      {reviewMutation.isPending ? "Saving..." : "Send Counter-Offer"}
                    </button>
                  </div>
                </div>
              )}

              {/* More Info panel */}
              {panel === "moreInfo" && (
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-800">Request More Information</p>
                  <div className="space-y-1">
                    <label className="text-xs text-amber-600 font-medium">Question / Instruction</label>
                    <textarea value={moreInfoRequest} onChange={e => setMoreInfoRequest(e.target.value)}
                      placeholder="What do you need from the seller?"
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPanel("none")} className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button
                      disabled={!moreInfoRequest || moreInfoRequest.trim().length < 10 || reviewMutation.isPending}
                      onClick={() => reviewMutation.mutate({ decision: "REQUEST_MORE_INFO", moreInfoRequest })}
                      className="flex-1 bg-gray-900 hover:bg-black disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                      {reviewMutation.isPending ? "Saving..." : "Send Request"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Go live — approved items list on the storefront in one step. Also
              rescues any item still sitting as accepted-but-not-live. */}
          {["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE"].includes(sub.status) && !(sub.item && sub.item.isLive) && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-900">List on Storefront</p>
              <p className="text-xs text-gray-400">This item is approved. Publish it live to the storefront now.</p>
              <button
                onClick={() => createListingMutation.mutate()}
                disabled={createListingMutation.isPending}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                {createListingMutation.isPending ? "Publishing…" : "List on Storefront (Go Live)"}
              </button>
              {createListingMutation.isError && (
                <p className="text-xs text-red-500">{(createListingMutation.error as Error).message}</p>
              )}
            </div>
          )}

          {sub.status === "LIVE" && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Globe className="h-4 w-4" />
                <p className="text-sm font-semibold">Live on Storefront</p>
              </div>
              <p className="text-xs text-emerald-600 mt-1">This item is visible to buyers.</p>
            </div>
          )}

          {/* Already reviewed */}
          {!canReview && sub.adminNote && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">Note from Perfect Fit</p>
              <p className="text-sm text-blue-800">{sub.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
