"use client";

import Link from "next/link";
import Image from "next/image";
import { X, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function CartPage() {
  const { items, removeItem, totalKobo } = useCartStore();
  const subtotal = totalKobo();

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-24 text-center">
          <div className="inline-flex w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-5">
            <ShoppingBag className="h-7 w-7 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
          <p className="text-gray-400 mb-8">Add some items to get started</p>
          <Link href="/catalogue"
            className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-700 transition-colors">
            Continue Shopping
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr,360px] items-start">
          {/* Items list */}
          <div className="space-y-4">
            {items.map(({ item }) => {
              const photo = item.photos[0];
              const conditionLabel = item.condition.charAt(0) + item.condition.slice(1).toLowerCase();
              return (
                <div key={item.id} className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  {photo && (
                    <div className="relative w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                      <Image
                        src={getCloudinaryUrl(photo, { width: 80, height: 96 })}
                        alt={item.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {item.brand && (
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{item.brand}</p>
                        )}
                        <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.title}</p>
                        <p className="text-xs text-gray-400 mt-1">Size {item.size} · {conditionLabel}</p>
                      </div>
                      <button onClick={() => removeItem(item.id)}
                        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-50 transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2.5 py-1">Qty: 1 — one of a kind</span>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(item.retailPrice)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Delivery</span>
                <span className="text-gray-400 text-xs">Calculated at checkout</span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">{formatPrice(subtotal)}</span>
            </div>

            <Link href="/checkout"
              className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white font-semibold px-6 py-3.5 rounded-xl text-sm hover:bg-gray-700 transition-colors">
              Proceed to Checkout →
            </Link>
            <Link href="/catalogue"
              className="flex items-center justify-center gap-2 w-full border border-gray-200 text-gray-600 font-medium px-6 py-3 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
