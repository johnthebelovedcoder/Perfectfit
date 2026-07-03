"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, X, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useCartStore } from "@/stores/cart.store";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";

const CONDITION_LABEL: Record<string, string> = {
  BRAND_NEW: "Brand New",
  EXCELLENT: "Excellent",
  GOOD:      "Good",
  FAIR:      "Fair",
};

// Neutral placeholder for items without a photo.
const BLUR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='10'%3E%3Crect width='8' height='10' fill='%23f3f4f6'/%3E%3C/svg%3E";

export function WishlistClient() {
  const items = useWishlistStore((s) => s.items);
  const toggle = useWishlistStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.addItem);
  const cartItemIds = useCartStore((s) => s.items.map((i) => i.item.id).join(","));
  const inCartSet = new Set(cartItemIds ? cartItemIds.split(",") : []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
          <Heart className="h-9 w-9 text-rose-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h1>
        <p className="text-gray-400 max-w-xs mb-8">
          Save items you love by tapping the heart on any product. They&apos;ll all appear here.
        </p>
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.length} saved item{items.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/catalogue" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
          Continue Shopping →
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((item) => {
          const photo = item.photos[0];
          const imageUrl = photo ? getCloudinaryUrl(photo, { width: 400, height: 500 }) : BLUR;
          const alreadyInCart = inCartSet.has(item.id);

          return (
            <div key={item.id} className="group relative">
              {/* Remove button */}
              <button
                onClick={() => toggle(item)}
                className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-white/90 shadow flex items-center justify-center text-gray-400 hover:text-rose-500 transition-colors
                  md:opacity-0 md:group-hover:opacity-100"
                aria-label="Remove from wishlist"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Image */}
              <Link href={`/item/${item.slug}`} className="block relative aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />

                {/* Add to cart slide-up */}
                <div className="absolute bottom-0 inset-x-0 p-2 translate-y-0 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!alreadyInCart) addToCart(item);
                    }}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold shadow transition-colors
                      ${alreadyInCart ? "bg-emerald-500 text-white" : "bg-gray-900 text-white hover:bg-gray-700"}`}
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {alreadyInCart ? "In Cart" : "Add to Cart"}
                  </button>
                </div>
              </Link>

              {/* Info */}
              <div className="mt-2.5 px-0.5 space-y-0.5">
                {item.brand && (
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{item.brand}</p>
                )}
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{item.title}</p>
                  <p className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.retailPrice)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">Size {item.size}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    item.condition === "BRAND_NEW" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {CONDITION_LABEL[item.condition] ?? item.condition}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
