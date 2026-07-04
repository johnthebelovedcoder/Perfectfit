"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import {
  PlusCircle, Package, CheckCircle, DollarSign, Clock,
  AlertTriangle, ChevronRight, MessageSquare, Truck,
  TrendingUp, ArrowRight, Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import type { SubmissionSummary } from "@thread/types";
import { QueryError } from "@/components/shared/QueryError";

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "text-amber-600 bg-amber-50 border-amber-200",
  AWAITING_MORE_INFO: "text-orange-600 bg-orange-50 border-orange-200",
  UNDER_NEGOTIATION: "text-blue-600 bg-blue-50 border-blue-200",
  ACCEPTED: "text-green-600 bg-green-50 border-green-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
  AWAITING_SHIPMENT: "text-purple-600 bg-purple-50 border-purple-200",
  RECEIVED_AT_WAREHOUSE: "text-purple-600 bg-purple-50 border-purple-200",
  LIVE: "text-emerald-600 bg-emerald-50 border-emerald-200",
  SOLD: "text-gray-600 bg-gray-50 border-gray-200",
  PAYOUT_QUEUED: "text-orange-600 bg-orange-50 border-orange-200",
  PAYOUT_PROCESSED: "text-emerald-600 bg-emerald-50 border-emerald-200",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  AWAITING_MORE_INFO: "More Info Needed",
  UNDER_NEGOTIATION: "Negotiation",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  AWAITING_SHIPMENT: "Ship Now",
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  LIVE: "Live",
  SOLD: "Sold",
  PAYOUT_QUEUED: "Payout Queued",
  PAYOUT_PROCESSED: "Paid Out",
};

interface ProfileData {
  firstName: string;
  isVerified: boolean;
  stats: { total: number; live: number; sold: number; pending: number; totalEarned: number };
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-lg ${className}`} />;
}

export default function DashboardPage() {
  const { data: rawProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => api.get<ProfileData>("/sellers/me"),
    staleTime: 5 * 60 * 1000,
  });

  const { data: rawSubs, isLoading: subsLoading, isError: subsError, refetch: refetchSubs } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => api.get<SubmissionSummary[]>("/submissions/mine"),
  });

  const profile = rawProfile as unknown as ProfileData | undefined;
  const submissions = rawSubs ?? [];
  const isVerified = profileLoading ? true : (profile?.isVerified ?? false);

  // Action items — things that need seller attention right now
  const negotiations = submissions.filter(s => s.status === "UNDER_NEGOTIATION");
  const awaitingShipment = submissions.filter(s => s.status === "AWAITING_SHIPMENT");
  const needsInfo = submissions.filter(s => s.status === "AWAITING_MORE_INFO");
  const hasActions = negotiations.length + awaitingShipment.length + needsInfo.length > 0;

  // Stats from profile (server-computed) or fall back to client-side counts
  const stats = profile?.stats ?? {
    total: submissions.length,
    live: submissions.filter(s => s.status === "LIVE").length,
    sold: submissions.filter(s => ["SOLD", "PAYOUT_QUEUED", "PAYOUT_PROCESSED"].includes(s.status)).length,
    pending: submissions.filter(s => s.status === "PENDING_REVIEW").length,
    totalEarned: submissions.filter(s => s.status === "PAYOUT_PROCESSED").reduce((sum, s) => sum + (s.agreedPayoutPrice ?? 0), 0),
  };

  const recentSubs = submissions.slice(0, 5);
  const greeting = profile?.firstName ? `Hey, ${profile.firstName} 👋` : "Dashboard";

  return (
    <div className="p-4 sm:p-8 space-y-7">
      {subsError && <QueryError onRetry={() => void refetchSubs()} />}
      {/* Verification warning */}
      {!isVerified && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Account pending verification</p>
            <p className="text-xs text-amber-700 mt-0.5">Our team will verify your account shortly. You can explore the portal, but won&apos;t be able to submit items until verified.</p>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          {profileLoading ? <Skeleton className="h-7 w-36 mb-1" /> : <h1 className="text-2xl font-bold text-gray-900">{greeting}</h1>}
          <p className="text-gray-400 text-sm mt-0.5">Here&apos;s how your listings are doing</p>
        </div>
        <Link href="/submissions/new"
          className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <PlusCircle className="h-4 w-4" />
          Submit Item
        </Link>
      </div>

      {/* Stats grid */}
      {profileLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "Items Live", value: stats.live, icon: Sparkles, color: "text-emerald-500", bg: "bg-emerald-50" },
            { label: "Items Sold", value: stats.sold, icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50" },
            { label: "Total Earned", value: formatPrice(stats.totalEarned), icon: DollarSign, color: "text-orange-500", bg: "bg-orange-50" },
            { label: "Pending Review", value: stats.pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two column: actions + earnings */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Action items — left, 3/4 */}
        <div className="lg:col-span-3 space-y-4">

          {/* Needs attention */}
          {hasActions && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Needs Your Attention</p>
                  <p className="text-xs text-gray-400 mt-0.5">Items waiting on your action</p>
                </div>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {negotiations.length + awaitingShipment.length + needsInfo.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {negotiations.map(s => (
                  <ActionRow key={s.id} sub={s}
                    icon={<MessageSquare className="h-4 w-4 text-blue-500" />}
                    label="Respond to offer"
                    desc={`Admin sent a counter-offer for your ${s.itemType}`}
                    badge={{ text: "Negotiation", style: "text-blue-600 bg-blue-50 border-blue-200" }}
                  />
                ))}
                {awaitingShipment.map(s => (
                  <ActionRow key={s.id} sub={s}
                    icon={<Truck className="h-4 w-4 text-purple-500" />}
                    label="Ship this item"
                    desc={`${s.itemType} accepted — ship it to our warehouse`}
                    badge={{ text: "Ship Now", style: "text-purple-600 bg-purple-50 border-purple-200" }}
                  />
                ))}
                {needsInfo.map(s => (
                  <ActionRow key={s.id} sub={s}
                    icon={<AlertTriangle className="h-4 w-4 text-orange-500" />}
                    label="More info required"
                    desc={`We need more details about your ${s.itemType}`}
                    badge={{ text: "More Info", style: "text-orange-600 bg-orange-50 border-orange-200" }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent submissions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">Recent Submissions</p>
                <p className="text-xs text-gray-400 mt-0.5">Your latest {recentSubs.length} items</p>
              </div>
              <Link href="/submissions" className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {subsLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5"><Skeleton className="h-3 w-32" /><Skeleton className="h-2.5 w-20" /></div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentSubs.length === 0 ? (
              <div className="py-14 text-center">
                <Package className="h-7 w-7 text-gray-200 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-400">No submissions yet</p>
                <Link href="/submissions/new" className="mt-3 inline-block text-xs font-medium text-gray-800 underline">Submit your first item</Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentSubs.map((s) => {
                  const photo = s.photos?.[0];
                  const ref = `THR-${s.id.slice(-8).toUpperCase()}`;
                  return (
                    <Link key={s.id} href={`/submissions/${s.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                      <div className="relative h-12 w-9 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        {photo && <Image src={getCloudinaryUrl(photo, { width: 72, height: 96 })} alt="" fill className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {s.brand ? `${s.brand} ` : ""}{s.itemType}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{ref} · {formatPrice(s.desiredPayoutPrice)}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[s.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
                        {STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column — earnings + tips */}
        <div className="space-y-4">
          {/* Earnings summary */}
          <div className="bg-gray-900 rounded-xl p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lifetime Earnings</p>
            </div>
            <p className="text-3xl font-bold mb-1">{formatPrice(stats.totalEarned)}</p>
            <p className="text-xs text-gray-500">From {stats.sold} item{stats.sold !== 1 ? "s" : ""} sold</p>

            {stats.totalEarned === 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-gray-400">List your first item to start earning.</p>
                <Link href="/submissions/new"
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-white border border-white/20 hover:bg-white/10 px-3 py-2 rounded-lg transition-colors w-fit">
                  <PlusCircle className="h-3.5 w-3.5" /> Submit Item
                </Link>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-1">
              {[
                { href: "/submissions/new", label: "Submit a new item", icon: PlusCircle },
                { href: "/submissions", label: "View all submissions", icon: Package },
                { href: "/profile", label: "Update payout details", icon: DollarSign },
              ].map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 font-medium transition-colors group">
                  <Icon className="h-4 w-4 text-gray-300 group-hover:text-gray-600" />
                  {label}
                  <ChevronRight className="h-3.5 w-3.5 text-gray-200 ml-auto group-hover:text-gray-400" />
                </Link>
              ))}
            </div>
          </div>

          {/* Submission pipeline */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Submission Pipeline</p>
            <div className="space-y-3">
              {[
                { label: "Pending review", count: stats.pending, dot: "bg-amber-400" },
                { label: "Live on store", count: stats.live, dot: "bg-emerald-400" },
                { label: "Sold", count: stats.sold, dot: "bg-blue-400" },
              ].map(({ label, count, dot }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-sm text-gray-600">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionRow({
  sub, icon, label, desc, badge,
}: {
  sub: SubmissionSummary;
  icon: React.ReactNode;
  label: string;
  desc: string;
  badge: { text: string; style: string };
}) {
  return (
    <Link href={`/submissions/${sub.id}`}
      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <span className={`shrink-0 text-xs font-medium px-2.5 py-0.5 rounded-full border ${badge.style}`}>
        {badge.text}
      </span>
      <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
    </Link>
  );
}
