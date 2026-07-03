"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface Submission {
  id: string;
  itemType: string;
  brand: string | null;
  category: string;
  size: string;
  condition: string;
  photos: string[];
  status: string;
  desiredPayoutPrice: number;
  createdAt: string;
  seller: { firstName: string; lastName: string };
}

const TABS = ["All", "Pending", "Negotiating", "Accepted", "Rejected"] as const;

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: "Pending Review",
  AWAITING_MORE_INFO: "More Info",
  UNDER_NEGOTIATION: "Under Negotiation",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  AWAITING_SHIPMENT: "Awaiting Shipment",
  RECEIVED_AT_WAREHOUSE: "At Warehouse",
  LIVE: "Live",
  SOLD: "Sold",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING_REVIEW: "text-amber-600 bg-amber-50 border-amber-200",
  AWAITING_MORE_INFO: "text-amber-600 bg-amber-50 border-amber-200",
  UNDER_NEGOTIATION: "text-blue-600 bg-blue-50 border-blue-200",
  ACCEPTED: "text-green-600 bg-green-50 border-green-200",
  REJECTED: "text-red-600 bg-red-50 border-red-200",
  LIVE: "text-green-600 bg-green-50 border-green-200",
};

const TAB_STATUS: Record<string, string[]> = {
  Pending: ["PENDING_REVIEW", "AWAITING_MORE_INFO"],
  Negotiating: ["UNDER_NEGOTIATION"],
  Accepted: ["ACCEPTED", "AWAITING_SHIPMENT", "RECEIVED_AT_WAREHOUSE", "LIVE"],
  Rejected: ["REJECTED"],
};


export default function SubmissionsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("All");
  const [search, setSearch] = useState("");

  const { data, isError, refetch } = useQuery({
    queryKey: ["admin-all-submissions"],
    queryFn: () => api.get<Submission[]>("/submissions/queue?status=ALL&limit=100"),
    refetchInterval: 30_000,
  });

  const all = data ?? [];

  const filtered = all.filter((s) => {
    const matchTab = tab === "All" || (TAB_STATUS[tab] ?? []).includes(s.status);
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.itemType.toLowerCase().includes(q) ||
      (s.brand ?? "").toLowerCase().includes(q) ||
      `${s.seller.firstName} ${s.seller.lastName}`.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <div className="p-8 space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        <p className="text-gray-500 text-sm mt-1">Review and manage seller submissions</p>
      </div>

      {/* Search + filter tabs */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by reference, item, brand, seller..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 text-sm">No submissions found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((s) => {
              const photo = s.photos[0];
              const ref = `THR-${s.id.slice(-8).toUpperCase()}`;
              return (
                <Link key={s.id} href={`/submissions/${s.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="relative h-14 w-11 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {photo && (
                      <Image src={getCloudinaryUrl(photo, { width: 88, height: 112 })} alt="" fill sizes="44px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{s.brand ? `${s.brand} ` : ""}{s.itemType}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{ref} · {s.category} · Size {s.size}</p>
                    <p className="text-xs text-gray-400">Seller: {s.seller.firstName} {s.seller.lastName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${STATUS_STYLE[s.status] ?? "text-gray-500 bg-gray-50 border-gray-200"}`}>
                      {STATUS_LABEL[s.status] ?? s.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{formatPrice(s.desiredPayoutPrice)}</p>
                    <p className="text-xs text-gray-300">seller ask</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
