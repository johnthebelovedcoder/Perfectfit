"use client";

import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Package, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { getCloudinaryUrl, formatPrice } from "@thread/utils";
import { QueryError } from "@/components/shared/QueryError";

interface FulfilOrderItem {
  id: string;
  item: { title: string; photos: string[]; slug: string; agreedPayoutPrice: number; size: string } | null;
}

interface FulfilOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  paidAt: string | null;
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  phone: string;
  orderItems: FulfilOrderItem[];
}

export default function SellerOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["seller-orders"],
    queryFn: () => api.get<FulfilOrder[]>("/orders/seller/queue"),
    refetchInterval: 30_000,
  });

  const dispatchMutation = useMutation({
    mutationFn: (orderId: string) => api.patch<unknown>(`/orders/${orderId}/dispatch`, {}),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["seller-orders"] }),
  });

  const orders = data ?? [];

  return (
    <div className="p-4 sm:p-8 max-w-3xl space-y-6">
      {isError && <QueryError onRetry={() => void refetch()} />}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders to Ship</h1>
        <p className="text-gray-500 text-sm mt-1">Items you&apos;ve sold — post them to the buyer, then mark as dispatched.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 h-32 animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
          <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">No orders to ship right now</p>
          <p className="text-sm text-gray-400 mt-1">When one of your items sells, it&apos;ll appear here with the buyer&apos;s address.</p>
        </div>
      ) : (
        orders.map((o) => {
          const payout = o.orderItems.reduce((s, oi) => s + (oi.item?.agreedPayoutPrice ?? 0), 0);
          return (
            <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400 font-mono">#{o.orderNumber.slice(-8).toUpperCase()}</p>
                <p className="text-xs text-gray-400">Sold {new Date(o.paidAt ?? o.createdAt).toLocaleDateString()}</p>
              </div>

              {/* Items */}
              <div className="space-y-3">
                {o.orderItems.map((oi) => (
                  <div key={oi.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-11 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {oi.item?.photos?.[0] && (
                        <Image src={getCloudinaryUrl(oi.item.photos[0], { width: 88, height: 112 })} alt="" fill sizes="44px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{oi.item?.title ?? "Item"}</p>
                      <p className="text-xs text-gray-400">Size {oi.item?.size}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">{formatPrice(oi.item?.agreedPayoutPrice ?? 0)}</p>
                  </div>
                ))}
              </div>

              {/* Ship-to address */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ship to</p>
                </div>
                <p className="text-sm font-medium text-gray-900">{o.firstName} {o.lastName}</p>
                <p className="text-sm text-gray-600">{o.addressLine1}{o.addressLine2 ? `, ${o.addressLine2}` : ""}</p>
                <p className="text-sm text-gray-600">{o.city}, {o.state} {o.postalCode ?? ""}</p>
                <p className="text-sm text-gray-500 mt-1">{o.phone}</p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">Your payout: <span className="font-semibold text-gray-900">{formatPrice(payout)}</span> <span className="text-xs text-gray-400">+ shipping, after the buyer confirms receipt</span></p>
                <button
                  onClick={() => dispatchMutation.mutate(o.id)}
                  disabled={dispatchMutation.isPending}
                  className="shrink-0 flex items-center gap-2 bg-gray-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors"
                >
                  <Truck className="h-4 w-4" />
                  {dispatchMutation.isPending ? "Saving…" : "Mark as Dispatched"}
                </button>
              </div>
              {dispatchMutation.isError && <p className="text-xs text-red-500">{(dispatchMutation.error as Error).message}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}
