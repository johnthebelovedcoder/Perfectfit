"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Check, X, Package, ExternalLink, Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import { categoryLabel, CATEGORY_VALUES } from "@thread/types";
import { PhotoUpload } from "@/components/submissions/PhotoUpload";

const EDIT_GENDERS = ["WOMEN", "MEN", "UNISEX"];
const EDIT_CONDITIONS = [
  { value: "BRAND_NEW", label: "Brand New" },
  { value: "EXCELLENT", label: "Excellent" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
];

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
  rejectionNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
  item: { slug: string; publishedAt: string | null } | null;
}

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW:        "text-amber-600 bg-amber-50 border-amber-200",
  AWAITING_MORE_INFO:    "text-amber-600 bg-amber-50 border-amber-200",
  UNDER_NEGOTIATION:     "text-blue-600 bg-blue-50 border-blue-200",
  ACCEPTED:              "text-green-600 bg-green-50 border-green-200",
  REJECTED:              "text-red-600 bg-red-50 border-red-200",
  AWAITING_SHIPMENT:     "text-purple-600 bg-purple-50 border-purple-200",
  RECEIVED_AT_WAREHOUSE: "text-indigo-600 bg-indigo-50 border-indigo-200",
  LIVE:                  "text-emerald-600 bg-emerald-50 border-emerald-200",
  SOLD:                  "text-gray-600 bg-gray-50 border-gray-200",
  PAYOUT_QUEUED:         "text-teal-600 bg-teal-50 border-teal-200",
  PAYOUT_PROCESSED:      "text-emerald-700 bg-emerald-50 border-emerald-300",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW:        "Pending Review",
  AWAITING_MORE_INFO:    "More Info Needed",
  UNDER_NEGOTIATION:     "Under Negotiation",
  ACCEPTED:              "Accepted",
  REJECTED:              "Rejected",
  AWAITING_SHIPMENT:     "Awaiting Shipment",
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  LIVE:                  "Live on Store",
  SOLD:                  "Sold",
  PAYOUT_QUEUED:         "Payout Queued",
  PAYOUT_PROCESSED:      "Payout Sent",
};

const REJECTION_LABEL: Record<string, string> = {
  ITEM_CONDITION_BELOW_STANDARD: "Item condition below standard",
  CATEGORY_NOT_ACCEPTED:         "Category not currently accepted",
  PHOTOS_INSUFFICIENT:           "Photos insufficient",
  ITEM_NOT_SELLABLE:             "Item not sellable on our platform",
  OTHER:                         "Other — see note below",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

// Warehouse shipping address shown to accepted sellers. Override via env in deploy.
const WAREHOUSE_NAME = process.env.NEXT_PUBLIC_WAREHOUSE_NAME ?? "Perfect Fit Warehouse";
const WAREHOUSE_ADDRESS =
  process.env.NEXT_PUBLIC_WAREHOUSE_ADDRESS ?? "1 Warehouse Way, Tulsa, Oklahoma 74103";
const WAREHOUSE_CONTACT = process.env.NEXT_PUBLIC_WAREHOUSE_CONTACT ?? "+1 (973) 282-6945";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [infoResponse, setInfoResponse] = useState("");
  // Captured from the negotiation email's accept/decline link (?action=...).
  // We surface it as a confirm prompt rather than auto-acting on page load.
  const [pendingAction, setPendingAction] = useState<"accept" | "decline" | null>(null);
  useEffect(() => {
    const a = searchParams.get("action");
    if (a === "accept" || a === "decline") setPendingAction(a);
  }, [searchParams]);

  const { data } = useQuery({
    queryKey: ["submission", id],
    queryFn: () => api.get<SubmissionDetail>(`/submissions/${id}`),
  });

  const sub = data as unknown as SubmissionDetail;
  const [mutationError, setMutationError] = useState<string | null>(null);
  const onMutationError = (err: unknown) =>
    setMutationError(err instanceof Error ? err.message : "Something went wrong. Please try again.");

  const negotiateMutation = useMutation({
    mutationFn: (accept: boolean) => api.patch<unknown>(`/submissions/${id}/negotiate`, { accept }),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["my-submissions"] });
    },
    onError: onMutationError,
  });

  const shipMutation = useMutation({
    mutationFn: () => api.patch<unknown>(`/submissions/${id}/ship`, {}),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["my-submissions"] });
    },
    onError: onMutationError,
  });

  const infoResponseMutation = useMutation({
    mutationFn: () => api.patch<unknown>(`/submissions/${id}/info-response`, { additionalInfo: infoResponse }),
    onSuccess: () => {
      setMutationError(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["my-submissions"] });
      setInfoResponse("");
    },
    onError: onMutationError,
  });

  // ── Seller editing (only while under review) ───────────────────────────────
  type EditForm = {
    category: string; itemType: string; brand: string; size: string;
    genderTarget: string; condition: string; conditionNote: string;
    sellerDescription: string; desiredPayoutDollars: string; photos: string[];
  };
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  const editMutation = useMutation({
    mutationFn: (dto: Record<string, unknown>) => api.patch<unknown>(`/submissions/${id}`, dto),
    onSuccess: () => {
      setEditError(null);
      setEditForm(null);
      void qc.invalidateQueries({ queryKey: ["submission", id] });
      void qc.invalidateQueries({ queryKey: ["my-submissions"] });
    },
    onError: (err: unknown) => setEditError(err instanceof Error ? err.message : "Could not save changes"),
  });

  function openEdit(s: SubmissionDetail) {
    setEditForm({
      category: s.category, itemType: s.itemType, brand: s.brand ?? "", size: s.size,
      genderTarget: s.genderTarget, condition: s.condition, conditionNote: s.conditionNote ?? "",
      sellerDescription: s.sellerDescription, desiredPayoutDollars: (s.desiredPayoutPrice / 100).toString(),
      photos: s.photos,
    });
    setEditError(null);
  }

  function saveEdit() {
    if (!editForm) return;
    setEditError(null);
    if (editForm.photos.length < 3) { setEditError("At least 3 photos are required"); return; }
    if (editForm.sellerDescription.trim().length < 10) { setEditError("Description must be at least 10 characters"); return; }
    const dollars = parseFloat(editForm.desiredPayoutDollars);
    if (!Number.isFinite(dollars) || dollars <= 0) { setEditError("Enter a valid payout amount"); return; }
    editMutation.mutate({
      category: editForm.category,
      itemType: editForm.itemType,
      brand: editForm.brand.trim() || null,
      size: editForm.size,
      genderTarget: editForm.genderTarget,
      condition: editForm.condition,
      conditionNote: editForm.conditionNote.trim() || null,
      sellerDescription: editForm.sellerDescription,
      desiredPayoutPrice: Math.round(dollars * 100),
      photos: editForm.photos,
    });
  }

  if (!sub) return (
    <div className="p-4 sm:p-8 flex items-center justify-center h-64 text-gray-400">Loading...</div>
  );

  const photos = sub.photos ?? [];
  const MutationErrorBanner = mutationError ? (
    <div className="mb-4 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
      {mutationError}
    </div>
  ) : null;
  const ref = `PF-${id.slice(-8).toUpperCase()}`;

  const timeline: Array<{ label: string; date: string | null; active: boolean }> = [
    { label: "Submitted",  date: sub.createdAt, active: true },
    { label: "Accepted",   date: sub.reviewedAt ?? null, active: ["ACCEPTED","AWAITING_SHIPMENT","RECEIVED_AT_WAREHOUSE","LIVE","SOLD","PAYOUT_QUEUED","PAYOUT_PROCESSED"].includes(sub.status) },
    { label: "Published",  date: sub.item?.publishedAt ?? null, active: ["LIVE","SOLD","PAYOUT_QUEUED","PAYOUT_PROCESSED"].includes(sub.status) },
    { label: "Sold",       date: null, active: ["SOLD","PAYOUT_QUEUED","PAYOUT_PROCESSED"].includes(sub.status) },
    { label: "Payout Sent",date: null, active: sub.status === "PAYOUT_PROCESSED" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      {MutationErrorBanner}
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-6 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-gray-400 font-mono">{ref}</p>
          <h1 className="text-xl font-bold text-gray-900 mt-0.5">{sub.brand ? `${sub.brand} ` : ""}{sub.itemType}</h1>
        </div>
        <div className="flex items-center gap-2">
          {["PENDING_REVIEW", "AWAITING_MORE_INFO"].includes(sub.status) && !editForm && (
            <button onClick={() => openEdit(sub)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
          <span className={`text-xs font-medium px-3 py-1.5 rounded-full border ${STATUS_STYLE[sub.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
            {STATUS_LABEL[sub.status] ?? sub.status}
          </span>
        </div>
      </div>

      {/* ── REJECTED ────────────────────────────────────────────────────── */}
      {sub.status === "REJECTED" && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50/60 p-5 space-y-3">
          <p className="text-sm font-semibold text-red-900">Your submission was not accepted</p>
          {sub.rejectionReason && (
            <p className="text-sm text-red-700">
              Reason: {REJECTION_LABEL[sub.rejectionReason] ?? sub.rejectionReason}
            </p>
          )}
          {sub.rejectionNote && (
            <div className="rounded-lg bg-white border border-red-100 p-3">
              <p className="text-xs text-red-500 font-medium mb-1">Note from Perfect Fit</p>
              <p className="text-sm text-gray-700">{sub.rejectionNote}</p>
            </div>
          )}
          {sub.adminNote && !sub.rejectionNote && (
            <div className="rounded-lg bg-white border border-red-100 p-3">
              <p className="text-xs text-red-500 font-medium mb-1">Note from Perfect Fit</p>
              <p className="text-sm text-gray-700">{sub.adminNote}</p>
            </div>
          )}
          <p className="text-xs text-gray-500">You can fix the issue and submit a new item when you&apos;re ready.</p>
          <Link href="/submissions/new"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            Submit a new item →
          </Link>
        </div>
      )}

      {/* ── NEGOTIATION ─────────────────────────────────────────────────── */}
      {sub.status === "UNDER_NEGOTIATION" && sub.agreedPayoutPrice != null && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/60 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-blue-900">Perfect Fit sent you a counter-offer</p>
            <p className="text-xs text-blue-600 mt-0.5">Review the proposed payout and accept or decline.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-3 border border-blue-100 text-center">
              <p className="text-xs text-gray-400 mb-1">Your ask</p>
              <p className="text-lg font-bold text-gray-700">{formatPrice(sub.desiredPayoutPrice)}</p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-blue-200 text-center">
              <p className="text-xs text-blue-500 mb-1">Their offer</p>
              <p className="text-lg font-bold text-blue-700">{formatPrice(sub.agreedPayoutPrice)}</p>
            </div>
          </div>
          {sub.adminNote && (
            <div className="rounded-lg bg-white border border-blue-100 p-3">
              <p className="text-xs text-blue-500 font-medium mb-1">Note from Perfect Fit</p>
              <p className="text-sm text-gray-700">{sub.adminNote}</p>
            </div>
          )}
          {pendingAction && (
            <div className="rounded-xl bg-blue-600 text-white p-4 flex items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {pendingAction === "accept"
                  ? `Confirm: accept the offer of ${formatPrice(sub.agreedPayoutPrice)}?`
                  : "Confirm: decline this offer?"}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => { negotiateMutation.mutate(pendingAction === "accept"); setPendingAction(null); }}
                  disabled={negotiateMutation.isPending}
                  className="bg-white text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 disabled:opacity-60"
                >
                  Confirm
                </button>
                <button onClick={() => setPendingAction(null)} className="text-white/80 text-sm px-2 hover:text-white">Cancel</button>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => negotiateMutation.mutate(false)}
              disabled={negotiateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              {negotiateMutation.isPending ? "Saving…" : "Decline offer"}
            </button>
            <button
              onClick={() => negotiateMutation.mutate(true)}
              disabled={negotiateMutation.isPending}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              {negotiateMutation.isPending ? "Saving…" : `Accept ${formatPrice(sub.agreedPayoutPrice)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── MORE INFO REQUEST ───────────────────────────────────────────── */}
      {sub.status === "AWAITING_MORE_INFO" && sub.moreInfoRequest && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-amber-900">Perfect Fit needs more information</p>
            <p className="text-xs text-amber-600 mt-0.5">Respond below — your submission will re-enter the review queue.</p>
          </div>
          <div className="rounded-lg bg-white border border-amber-200 p-3">
            <p className="text-xs text-amber-600 font-medium mb-1">Their question</p>
            <p className="text-sm text-gray-800">{sub.moreInfoRequest}</p>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-500 font-medium">Your response</label>
            <textarea
              value={infoResponse}
              onChange={(e) => setInfoResponse(e.target.value)}
              placeholder="Provide any additional details, measurements, or clarifications…"
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
            />
          </div>
          <button
            onClick={() => infoResponseMutation.mutate()}
            disabled={!infoResponse.trim() || infoResponseMutation.isPending}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl py-3 text-sm font-semibold transition-colors"
          >
            {infoResponseMutation.isPending ? "Sending…" : "Send Response"}
          </button>
        </div>
      )}

      {/* ── ACCEPTED — ship instructions ───────────────────────────────── */}
      {sub.status === "ACCEPTED" && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50/60 p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-purple-900">Your item has been accepted 🎉</p>
            <p className="text-xs text-purple-700 mt-0.5">Please ship it to our warehouse at the address below. Once shipped, click the button so we know to expect it.</p>
          </div>
          <div className="rounded-lg bg-white border border-purple-100 p-4 space-y-1 text-sm">
            <p className="font-semibold text-gray-800">{WAREHOUSE_NAME}</p>
            <p className="text-gray-600">{WAREHOUSE_ADDRESS}</p>
            <p className="text-gray-600">{WAREHOUSE_CONTACT}</p>
            <p className="text-xs text-gray-400 mt-2">Include your submission reference: <span className="font-mono">{ref}</span></p>
          </div>
          {sub.agreedPayoutPrice != null && (
            <div className="flex items-center justify-between rounded-lg bg-white border border-purple-100 px-4 py-3">
              <span className="text-sm text-gray-500">Agreed payout once sold</span>
              <span className="font-bold text-emerald-600 text-lg">{formatPrice(sub.agreedPayoutPrice)}</span>
            </div>
          )}
          <button
            onClick={() => shipMutation.mutate()}
            disabled={shipMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-3 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Package className="h-4 w-4" />
            {shipMutation.isPending ? "Saving…" : "Mark as Shipped"}
          </button>
        </div>
      )}

      {/* ── AWAITING_SHIPMENT ──────────────────────────────────────────── */}
      {sub.status === "AWAITING_SHIPMENT" && (
        <div className="mb-6 rounded-2xl border border-purple-200 bg-purple-50/40 p-5">
          <p className="text-sm font-semibold text-purple-900">Shipment confirmed</p>
          <p className="text-xs text-purple-600 mt-1">We&apos;ve been notified and are expecting your package. We&apos;ll update you once it arrives at the warehouse.</p>
          {sub.agreedPayoutPrice != null && (
            <div className="flex items-center justify-between rounded-lg bg-white border border-purple-100 px-4 py-3 mt-3">
              <span className="text-sm text-gray-500">Agreed payout once sold</span>
              <span className="font-bold text-emerald-600 text-lg">{formatPrice(sub.agreedPayoutPrice)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── RECEIVED_AT_WAREHOUSE ─────────────────────────────────────── */}
      {sub.status === "RECEIVED_AT_WAREHOUSE" && (
        <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/40 p-5">
          <p className="text-sm font-semibold text-indigo-900">Item received at warehouse</p>
          <p className="text-xs text-indigo-600 mt-1">Our team has your item and is preparing it for listing. We&apos;ll let you know once it goes live.</p>
        </div>
      )}

      {/* ── LIVE ──────────────────────────────────────────────────────── */}
      {sub.status === "LIVE" && sub.item?.slug && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-900">Your item is live on the store! 🛍️</p>
          <p className="text-xs text-emerald-700">Share the link — every sale earns you {sub.agreedPayoutPrice != null ? formatPrice(sub.agreedPayoutPrice) : "your agreed payout"}.</p>
          <a
            href={`${STOREFRONT_URL}/item/${sub.item.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <ExternalLink className="h-4 w-4" /> View your listing →
          </a>
        </div>
      )}

      {/* ── SOLD / PAYOUT ─────────────────────────────────────────────── */}
      {["SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"].includes(sub.status) && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-900">Your item sold 🎉</p>
          {sub.agreedPayoutPrice != null && (
            <div className="flex items-center justify-between rounded-lg bg-white border border-gray-100 px-4 py-3">
              <span className="text-sm text-gray-500">Your payout</span>
              <span className={`font-bold text-lg ${sub.status === "PAYOUT_PROCESSED" ? "text-emerald-600" : "text-gray-800"}`}>
                {formatPrice(sub.agreedPayoutPrice)}
              </span>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {sub.status === "PAYOUT_PROCESSED"
              ? "✅ Paid — funds have been sent to your bank account."
              : sub.status === "PAYOUT_QUEUED"
              ? "⏳ Payout is queued and will be processed within 7 days of delivery."
              : "⏳ Payout will be queued once the return window has passed (7 days after delivery)."}
          </p>
        </div>
      )}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-[4/3]">
            <Image
              src={getCloudinaryUrl(photos[photoIndex]!, { width: 800, height: 600 })}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
            {photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 shadow flex items-center justify-center">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {photos.map((p, i) => (
                <button key={i} onClick={() => setPhotoIndex(i)}
                  className={`relative h-14 w-11 shrink-0 rounded-lg overflow-hidden ${i === photoIndex ? "ring-2 ring-gray-900" : "opacity-50"}`}>
                  <Image src={getCloudinaryUrl(p, { width: 88, height: 112 })} alt="" fill sizes="44px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          {[
            ["Category", categoryLabel(sub.category)],
            ["Size", sub.size],
            ["Condition", sub.condition.charAt(0) + sub.condition.slice(1).toLowerCase()],
            ["For", sub.genderTarget.charAt(0) + sub.genderTarget.slice(1).toLowerCase()],
          ].map(([label, val]) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-semibold text-gray-800 mt-0.5">{val}</p>
            </div>
          ))}
        </div>

        {sub.conditionNote && (
          <div className="mt-4 pt-4 border-t border-gray-50">
            <p className="text-xs text-gray-400 mb-1">Condition Notes</p>
            <p className="text-sm text-gray-700">{sub.conditionNote}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-50">
          <p className="text-xs text-gray-400 mb-1">Description</p>
          <p className="text-sm text-gray-700">{sub.sellerDescription}</p>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400">Your Desired Payout</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{formatPrice(sub.desiredPayoutPrice)}</p>
          </div>
          {sub.agreedPayoutPrice != null && !["UNDER_NEGOTIATION", "PENDING_REVIEW", "AWAITING_MORE_INFO"].includes(sub.status) && (
            <div>
              <p className="text-xs text-gray-400">Agreed Payout</p>
              <p className="text-xl font-bold text-emerald-600 mt-0.5">{formatPrice(sub.agreedPayoutPrice)}</p>
            </div>
          )}
        </div>

        {sub.adminNote && !["UNDER_NEGOTIATION"].includes(sub.status) && (
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-3">
            <p className="text-xs text-blue-600 font-semibold mb-1">Note from Perfect Fit</p>
            <p className="text-sm text-blue-800">{sub.adminNote}</p>
          </div>
        )}
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-4">Status Timeline</p>
        <div className="space-y-3">
          {timeline.map(({ label, date, active }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-200"}`} />
                <span className={`text-sm ${active ? "text-gray-800 font-medium" : "text-gray-400"}`}>{label}</span>
              </div>
              {date && <span className="text-xs text-gray-400">{formatDate(date)}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* ── EDIT MODAL ────────────────────────────────────────────────────── */}
      {editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Edit Submission</h2>
              <button onClick={() => setEditForm(null)} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Photos</label>
                <PhotoUpload value={editForm.photos} onChange={(urls) => setEditForm((f) => f && ({ ...f, photos: urls }))} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Item Type</label>
                  <input value={editForm.itemType} onChange={(e) => setEditForm((f) => f && ({ ...f, itemType: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Brand (optional)</label>
                  <input value={editForm.brand} onChange={(e) => setEditForm((f) => f && ({ ...f, brand: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                  <input value={editForm.size} onChange={(e) => setEditForm((f) => f && ({ ...f, size: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select value={editForm.category} onChange={(e) => setEditForm((f) => f && ({ ...f, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {CATEGORY_VALUES.map((c) => <option key={c} value={c}>{categoryLabel(c)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">For</label>
                  <select value={editForm.genderTarget} onChange={(e) => setEditForm((f) => f && ({ ...f, genderTarget: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {EDIT_GENDERS.map((g) => <option key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
                  <select value={editForm.condition} onChange={(e) => setEditForm((f) => f && ({ ...f, condition: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200">
                    {EDIT_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Condition Note (optional)</label>
                  <input value={editForm.conditionNote} onChange={(e) => setEditForm((f) => f && ({ ...f, conditionNote: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea value={editForm.sellerDescription} onChange={(e) => setEditForm((f) => f && ({ ...f, sellerDescription: e.target.value }))} rows={3}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Your Desired Payout ($)</label>
                  <input type="number" step="0.01" min="0" value={editForm.desiredPayoutDollars}
                    onChange={(e) => setEditForm((f) => f && ({ ...f, desiredPayoutDollars: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200" />
                </div>
              </div>

              {editError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{editError}</p>}
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setEditForm(null)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editMutation.isPending}
                className="px-5 py-2 text-sm font-medium bg-gray-900 hover:bg-black text-white rounded-xl disabled:opacity-50 transition-colors">
                {editMutation.isPending ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
