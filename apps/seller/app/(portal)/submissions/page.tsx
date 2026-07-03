"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Package } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import type { SubmissionSummary } from "@thread/types";
import { QueryError } from "@/components/shared/QueryError";

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW:         "text-amber-700 bg-amber-50 border-amber-200",
  AWAITING_MORE_INFO:     "text-amber-700 bg-amber-50 border-amber-200",
  UNDER_NEGOTIATION:      "text-blue-700 bg-blue-50 border-blue-200",
  ACCEPTED:               "text-green-700 bg-green-50 border-green-200",
  REJECTED:               "text-red-700 bg-red-50 border-red-200",
  AWAITING_SHIPMENT:      "text-purple-700 bg-purple-50 border-purple-200",
  RECEIVED_AT_WAREHOUSE:  "text-purple-700 bg-purple-50 border-purple-200",
  LIVE:                   "text-emerald-700 bg-emerald-50 border-emerald-200",
  SOLD:                   "text-gray-600 bg-gray-50 border-gray-200",
  PAYOUT_QUEUED:          "text-orange-700 bg-orange-50 border-orange-200",
  PAYOUT_PROCESSED:       "text-emerald-700 bg-emerald-50 border-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW:         "Pending Review",
  AWAITING_MORE_INFO:     "More Info Needed",
  UNDER_NEGOTIATION:      "Under Negotiation",
  ACCEPTED:               "Accepted",
  REJECTED:               "Rejected",
  AWAITING_SHIPMENT:      "Awaiting Shipment",
  RECEIVED_AT_WAREHOUSE:  "At Warehouse",
  LIVE:                   "Live on Store",
  SOLD:                   "Sold",
  PAYOUT_QUEUED:          "Payout Queued",
  PAYOUT_PROCESSED:       "Paid Out",
};

export default function SubmissionsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => api.get<SubmissionSummary[]>("/submissions/mine"),
  });

  const submissions = data ?? [];

  return (
    <div className="p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
          <p className="text-gray-500 text-sm mt-1">All items you&apos;ve submitted to Perfect Fit</p>
        </div>
        <Link
          href="/submissions/new"
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <PlusCircle className="h-4 w-4" />
          Submit Item
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 h-20 animate-pulse" />
          ))}
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 py-16 text-center">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No submissions yet</p>
          <p className="text-sm text-gray-400 mt-1">Submit your first item to start selling.</p>
          <Link href="/submissions/new" className="inline-block mt-4 text-sm font-semibold text-gray-900 hover:underline">
            Submit an item →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {submissions.map((s) => {
            const photo = s.photos?.[0];
            const brand = s.brand;
            const agreedPayout = s.agreedPayoutPrice;
            const ref = `PF-${s.id.slice(-8).toUpperCase()}`;
            return (
              <Link
                key={s.id}
                href={`/submissions/${s.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
              >
                {/* Photo */}
                <div className="relative h-14 w-10 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {photo && (
                    <Image
                      src={getCloudinaryUrl(photo, { width: 80, height: 112 })}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-900">
                    {brand ? `${brand} ` : ""}{s.itemType}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{ref} · Size {s.size} · {s.category}</p>
                  <p className="text-xs text-gray-400">
                    Ask: <span className="font-medium text-gray-700">{formatPrice(s.desiredPayoutPrice)}</span>
                    {agreedPayout != null && (
                      <span className="ml-2 text-emerald-600">
                        Agreed: {formatPrice(agreedPayout)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Date + status */}
                <div className="text-right shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[s.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
