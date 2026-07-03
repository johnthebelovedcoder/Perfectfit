"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface OrderRow {
  id: string;
  orderNumber: string;
  status: string;
  guestToken: string | null;
  totalAmountKobo: number;
  createdAt: string;
  orderItems: { item: { title: string; photos: string[]; slug: string } | null }[];
}

const STATUS_STYLE: Record<string, string> = {
  PLACED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-amber-100 text-amber-700",
  DISPATCHED: "bg-purple-100 text-purple-700",
  OUT_FOR_DELIVERY: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  RETURN_REQUESTED: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
};

function label(s: string) {
  return s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AccountOrdersPage() {
  const auth = useAuth();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  // Redirect to login if not signed in (after the client knows auth state).
  useEffect(() => {
    if (auth === null && checked) router.replace("/auth/login");
  }, [auth, checked, router]);
  useEffect(() => { const t = setTimeout(() => setChecked(true), 50); return () => clearTimeout(t); }, []);

  const { data: orders, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => api.get<OrderRow[]>("/orders/mine"),
    enabled: !!auth,
  });

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-[70vh]">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Orders</h1>
          <p className="text-sm text-gray-400 mb-6">{auth?.user.email}</p>

          {isLoading || !auth ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100 animate-pulse" />)}
            </div>
          ) : isError ? (
            <QueryError onRetry={() => void refetch()} />
          ) : !orders || orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">No orders yet</p>
              <Link href="/catalogue" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 hover:underline">
                <ShoppingBag className="h-4 w-4" /> Start shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const firstPhoto = o.orderItems[0]?.item?.photos?.[0];
                return (
                  <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-gray-900">#{o.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {label(o.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {firstPhoto && <Image src={getCloudinaryUrl(firstPhoto, { width: 48, height: 56 })} alt="" fill sizes="48px" className="object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">
                          {o.orderItems.map((oi) => oi.item?.title).filter(Boolean).join(", ") || "Items"}
                        </p>
                        <p className="text-xs text-gray-400">{o.orderItems.length} item{o.orderItems.length !== 1 ? "s" : ""} · {formatPrice(o.totalAmountKobo)}</p>
                      </div>
                      {o.guestToken && (
                        <Link href={`/order/${o.guestToken}/track`} className="flex items-center gap-1 text-sm font-medium text-gray-900 hover:underline shrink-0">
                          Track <ChevronRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
