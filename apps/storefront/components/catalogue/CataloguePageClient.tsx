"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ItemCard } from "./ItemCard";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";
import type { CatalogueItem, PaginationMeta } from "@thread/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

interface ItemsResponse {
  data: CatalogueItem[];
  meta: PaginationMeta;
}

interface Props {
  category?: string;
  condition?: string;
  gender?: string;
  sort?: string;
  search?: string;
  categoryLabel: string;
  /** First page fetched server-side (RSC) so products paint on first load. */
  initialData?: ItemsResponse;
}

type ViewMode = "grid" | "list";

const CONDITION_LABEL: Record<string, string> = {
  BRAND_NEW: "Brand New",
  EXCELLENT: "Thrift",
  GOOD: "Thrift",
  FAIR: "Thrift",
};

export function CataloguePageClient({ category, condition, gender, sort: initialSort, search, categoryLabel, initialData }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort] = useState(initialSort ?? "newest");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["items", { category, condition, gender, sort, search }],
    // Seed the first page from the server render so items show on first paint.
    // Only applies to the initial sort; changing sort triggers a fresh fetch.
    initialData:
      initialData && sort === (initialSort ?? "newest")
        ? { pages: [initialData], pageParams: [undefined as string | undefined] }
        : undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (condition) params.set("condition", condition);
      if (gender) params.set("genderTarget", gender);
      if (search) params.set("search", search);
      if (sort) params.set("sortBy", sort);
      if (pageParam) params.set("cursor", pageParam as string);
      params.set("limit", "24");
      const res = await fetch(`${API_URL}/v1/items?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json() as Promise<ItemsResponse>;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
  });

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div>
      {/* Title + controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{categoryLabel}</h1>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {/* Grid / List toggle */}
          <div className="flex gap-1 border border-gray-200 rounded-xl p-0.5 bg-white">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-700"
              }`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={viewMode === "grid"
          ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          : "space-y-3"}>
          {Array.from({ length: 12 }).map((_, i) => (
            viewMode === "grid" ? (
              <div key={i} className="space-y-2">
                <div className="aspect-[4/5] rounded-xl bg-gray-100 animate-pulse" />
                <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
              </div>
            ) : (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-gray-100 animate-pulse">
                <div className="w-20 h-24 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                  <div className="h-3 w-1/3 rounded bg-gray-100" />
                  <div className="h-3 w-1/4 rounded bg-gray-100" />
                </div>
              </div>
            )
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-gray-700">No items found</p>
          <p className="mt-2 text-sm text-gray-400">Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((item, i) => <ItemCard key={item.id} item={item} priority={i < 8} />)}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const photo = item.photos[0];
                const condLabel = CONDITION_LABEL[item.condition] ?? item.condition;
                return (
                  <Link key={item.id} href={`/item/${item.slug}`}
                    className="flex gap-4 items-center p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm transition-all group">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {photo && (
                        <Image
                          src={getCloudinaryUrl(photo, { width: 64, height: 80 })}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {item.brand && (
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{item.brand}</p>
                      )}
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Size {item.size} · {condLabel}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(item.retailPrice)}</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        item.condition === "BRAND_NEW"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                      }`}>
                        {condLabel}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {hasNextPage && (
            <div className="flex justify-center">
              <button
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
                className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {isFetchingNextPage ? "Loading..." : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
