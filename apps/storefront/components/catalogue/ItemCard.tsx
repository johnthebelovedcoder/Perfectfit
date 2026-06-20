"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";
import type { CatalogueItem } from "@thread/types";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";
import { useState } from "react";

interface ItemCardProps {
  item: CatalogueItem;
  /** Set true for above-the-fold cards so the image is eager-loaded (better LCP). */
  priority?: boolean;
}

// Tiny neutral blur shown while the real image loads — kills the gray-box flash.
const BLUR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='10'%3E%3Crect width='8' height='10' fill='%23f3f4f6'/%3E%3C/svg%3E";

const CONDITION_STYLE: Record<string, string> = {
  BRAND_NEW:  "bg-blue-100 text-blue-700",
  EXCELLENT:  "bg-amber-100 text-amber-700",
  GOOD:       "bg-amber-100 text-amber-700",
  FAIR:       "bg-orange-100 text-orange-700",
};
const CONDITION_LABEL: Record<string, string> = {
  BRAND_NEW: "Brand New",
  EXCELLENT: "Thrift",
  GOOD:      "Thrift",
  FAIR:      "Thrift",
};

export function ItemCard({ item, priority = false }: ItemCardProps) {
  const photo = item.photos[0];
  const imageUrl = photo ? getCloudinaryUrl(photo, { width: 400, height: 500 }) : "/placeholder.jpg";
  const condStyle = CONDITION_STYLE[item.condition] ?? "bg-gray-100 text-gray-600";
  const condLabel = CONDITION_LABEL[item.condition] ?? item.condition;

  const addItem = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) => s.items.some((i) => i.item.id === item.id));
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.id === item.id));

  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) return;
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(item);
  };

  return (
    <Link href={`/item/${item.slug}`} className="group block">
      <div className="relative overflow-hidden rounded-xl bg-gray-100 aspect-[4/5]">
        <Image
          src={imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={BLUR}
          priority={priority}
          loading={priority ? "eager" : "lazy"}
        />

        {/* Condition pill — top left */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${condStyle}`}>
            {condLabel}
          </span>
        </div>

        {/* Wishlist button — top right, always visible on mobile, hover on desktop */}
        <button
          onClick={handleWishlist}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all duration-200
            md:opacity-0 md:translate-y-1 md:group-hover:opacity-100 md:group-hover:translate-y-0
            ${wishlisted
              ? "bg-rose-500 text-white"
              : "bg-white/90 text-gray-500 hover:text-rose-500"
            }`}
          aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
        >
          <Heart className={`h-4 w-4 ${wishlisted ? "fill-white" : ""}`} />
        </button>

        {/* Add to cart — bottom bar, slides up on hover */}
        <div className="absolute bottom-0 inset-x-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200 ease-out">
          <button
            onClick={handleAddToCart}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold shadow transition-colors duration-150
              ${inCart || justAdded
                ? "bg-emerald-500 text-white"
                : "bg-gray-900 text-white hover:bg-gray-700"
              }`}
          >
            <ShoppingBag className="h-4 w-4" />
            {justAdded ? "Added!" : inCart ? "In Cart" : "Add to Cart"}
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-0.5 px-0.5">
        {item.brand && (
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{item.brand}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{item.title}</p>
          <p className="text-sm font-bold text-gray-900 shrink-0">{formatPrice(item.retailPrice)}</p>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Size {item.size}</p>
          {item.avgRating != null && (
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-medium text-gray-500">{item.avgRating.toFixed(1)}</span>
              {item.reviewCount != null && item.reviewCount > 0 && (
                <span className="text-[11px] text-gray-400">({item.reviewCount})</span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
