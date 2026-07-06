"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Clock, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface Payout {
  id: string;
  amountKobo: number;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  processedAt: string | null;
  settlementDueAt: string | null;
  transferReference: string | null;
  item: { title: string; slug: string; photos: string[] } | null;
}

interface PayoutsResponse {
  payouts: Payout[];
  summary: { totalPaidKobo: number; paidCount: number; pendingKobo: number; pendingCount: number };
}

const STATUS: Record<Payout["status"], { label: string; style: string }> = {
  QUEUED: { label: "Queued", style: "text-amber-700 bg-amber-50 border-amber-200" },
  PROCESSING: { label: "Processing", style: "text-blue-700 bg-blue-50 border-blue-200" },
  COMPLETED: { label: "Paid", style: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  FAILED: { label: "Failed", style: "text-red-700 bg-red-50 border-red-200" },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

export default function PayoutsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-payouts"],
    queryFn: () => api.get<PayoutsResponse>("/sellers/me/payouts"),
  });

  const summary = data?.summary;
  const payouts = data?.payouts ?? [];

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
        <p className="text-gray-500 text-sm mt-1">Track what you&apos;ve been paid and what&apos;s on the way</p>
      </div>

      {isError && <QueryError onRetry={() => void refetch()} />}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? <Skeleton className="h-7 w-24" /> : formatPrice(summary?.totalPaidKobo ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Total paid · {summary?.paidCount ?? 0} item{summary?.paidCount === 1 ? "" : "s"}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {isLoading ? <Skeleton className="h-7 w-24" /> : formatPrice(summary?.pendingKobo ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Pending · {summary?.pendingCount ?? 0} item{summary?.pendingCount === 1 ? "" : "s"}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="font-semibold text-gray-900 text-sm">Payout history</p>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-12 w-9 rounded-lg" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-40" /><Skeleton className="h-2.5 w-24" /></div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-16 text-center">
            <Wallet className="h-8 w-8 text-gray-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No payouts yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              Once one of your items sells and settles, your payout will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {payouts.map((p) => {
              const photo = p.item?.photos?.[0];
              const st = STATUS[p.status];
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="relative h-12 w-9 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {photo && <Image src={getCloudinaryUrl(photo, { width: 72, height: 96 })} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{p.item?.title ?? "Item"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.status === "COMPLETED"
                        ? `Paid ${fmtDate(p.processedAt)}`
                        : p.settlementDueAt
                          ? `Expected by ${fmtDate(p.settlementDueAt)}`
                          : `Queued ${fmtDate(p.createdAt)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(p.amountKobo)}</p>
                    <span className={`inline-block mt-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${st.style}`}>
                      {st.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        Payouts are sent to the bank details on your{" "}
        <a href="/profile" className="underline hover:text-gray-700">profile</a>. Make sure they&apos;re up to date.
      </p>
    </div>
  );
}
