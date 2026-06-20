"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ChevronLeft, ChevronRight, Shield, Truck, RotateCcw, Star } from "lucide-react";
import { AddToCartButton } from "./AddToCartButton";
import { ItemCard } from "./ItemCard";
import { SizeChartModal } from "./SizeChartModal";
import { ReviewsSection } from "./ReviewsSection";
import { useWishlistStore } from "@/stores/wishlist.store";
import { Footer } from "@/components/shared/Footer";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";
import { categoryLabel } from "@thread/types";
import type { CatalogueItem } from "@thread/types";

const CONDITION_STYLE: Record<string, string> = {
  BRAND_NEW: "bg-blue-100 text-blue-700",
  EXCELLENT: "bg-amber-100 text-amber-700",
  GOOD:      "bg-amber-100 text-amber-700",
  FAIR:      "bg-orange-100 text-orange-700",
};
const CONDITION_LABEL: Record<string, string> = {
  BRAND_NEW: "Brand New",
  EXCELLENT: "Thrift",
  GOOD:      "Thrift",
  FAIR:      "Thrift",
};

interface ReviewData {
  id: string;
  rating: number;
  title?: string | null;
  body: string;
  buyerName: string;
  verified: boolean;
  createdAt: string;
}

interface ReviewStats {
  count: number;
  average: number;
  breakdown: Record<number, number>;
}

interface Props {
  item: CatalogueItem;
  similar: CatalogueItem[];
  reviews: ReviewData[];
  reviewStats: ReviewStats;
}

export function ItemDetailClient({ item, similar, reviews, reviewStats }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const wishlisted = useWishlistStore((s) => s.items.some((i) => i.id === item.id));

  const photos = item.photos.length ? item.photos : [
    "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800&q=80",
  ];
  const activePhoto = photos[activeIdx]!;

  const prev = () => setActiveIdx((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setActiveIdx((i) => (i + 1) % photos.length);

  const catLabel = categoryLabel(item.category);
  const condStyle = CONDITION_STYLE[item.condition] ?? "bg-gray-100 text-gray-600";
  const condLabel = CONDITION_LABEL[item.condition] ?? item.condition;

  return (
    <>
      <main>
        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <div className="bg-gray-50 border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
              <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors">Home</Link>
              <span className="text-gray-300">/</span>
              <Link href="/catalogue" className="text-gray-500 hover:text-gray-900 transition-colors">Shop All</Link>
              <span className="text-gray-300">/</span>
              <Link href={`/catalogue?category=${item.category}`}
                className="text-gray-500 hover:text-gray-900 transition-colors">
                {catLabel}
              </Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-medium truncate max-w-[200px]">{item.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 pb-16">
          <div className="grid gap-10 lg:grid-cols-[1fr,420px]">
            {/* ── Photo viewer ──────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 select-none">
                <Image
                  src={getCloudinaryUrl(activePhoto, { width: 800, height: 1000 })}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                {photos.length > 1 && (
                  <>
                    <button onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors z-10">
                      <ChevronLeft className="h-5 w-5 text-gray-700" />
                    </button>
                    <button onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors z-10">
                      <ChevronRight className="h-5 w-5 text-gray-700" />
                    </button>
                    {/* Photo counter */}
                    <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs font-medium px-2 py-1 rounded-full">
                      {activeIdx + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail strip */}
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {photos.map((photo, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`shrink-0 relative w-16 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeIdx
                          ? "border-gray-900 shadow-md"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image
                        src={getCloudinaryUrl(photo, { width: 64, height: 80 })}
                        alt={`Photo ${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Right panel ───────────────────────────────────────────── */}
            <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              {/* Brand + title + price */}
              <div>
                {item.brand && (
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">{item.brand}</p>
                )}
                <h1 className="text-2xl font-bold text-gray-900 leading-snug">{item.title}</h1>
                {reviewStats.count > 0 && (
                  <a href="#reviews" className="flex items-center gap-1.5 mt-2 group w-fit">
                    <span className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(reviewStats.average) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                      ))}
                    </span>
                    <span className="text-xs font-medium text-gray-500 group-hover:text-gray-800 transition-colors">
                      {reviewStats.average.toFixed(1)} ({reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""})
                    </span>
                  </a>
                )}
                <p className="mt-3 text-3xl font-bold text-gray-900">{formatPrice(item.retailPrice)}</p>
              </div>

              {/* Condition + size + gender pills */}
              <div className="flex flex-wrap gap-2">
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${condStyle}`}>
                  {condLabel}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                  Size {item.size}
                </span>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                  {item.genderTarget.charAt(0) + item.genderTarget.slice(1).toLowerCase()}
                </span>
              </div>

              {/* Metadata table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                {[
                  ["Category", catLabel],
                  ["Condition", condLabel],
                  ["For", item.genderTarget.charAt(0) + item.genderTarget.slice(1).toLowerCase()],
                  ...(item.brand ? [["Brand", item.brand]] : []),
                ].map(([label, value], i) => (
                  <div key={label}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${i % 2 === 0 ? "bg-gray-50" : "bg-white"}`}>
                    <span className="text-gray-400 font-medium">{label}</span>
                    <span className="text-gray-900 capitalize">{value}</span>
                  </div>
                ))}
                {/* Size row with chart link */}
                <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-gray-50">
                  <span className="text-gray-400 font-medium">Size</span>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-900">{item.size}</span>
                    <SizeChartModal category={item.category} />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1.5">Description</p>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <AddToCartButton item={item} />
                </div>
                <button
                  onClick={() => toggleWishlist(item)}
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all ${
                    wishlisted
                      ? "border-rose-300 bg-rose-50 text-rose-500"
                      : "border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200"
                  }`}
                  aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                  <Heart className={`h-5 w-5 ${wishlisted ? "fill-rose-500" : ""}`} />
                </button>
              </div>

              {/* Trust badges */}
              <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                {[
                  { icon: Shield, label: "Quality Inspected", desc: "Physically checked by our team" },
                  { icon: Truck, label: "Ships from Perfect Fit", desc: "Dispatched from our warehouse" },
                  { icon: RotateCcw, label: "48-Hour Returns", desc: "Return if not as described" },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <Icon className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-800">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── You Might Also Like ────────────────────────────────────── */}
          {similar.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">You Might Also Like</h2>
                  <p className="text-sm text-gray-400 mt-0.5">More {catLabel}</p>
                </div>
                <Link href={`/catalogue?category=${item.category}`}
                  className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {similar.map((s) => <ItemCard key={s.id} item={s} />)}
              </div>
            </section>
          )}
          {/* ── Reviews ───────────────────────────────────────────────── */}
          <ReviewsSection
            slug={item.slug}
            initialReviews={reviews}
            initialStats={reviewStats}
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
