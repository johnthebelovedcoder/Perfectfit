"use client";

import { useQuery } from "@tanstack/react-query";
import { ItemCard } from "./ItemCard";
import { api } from "@/lib/api";
import type { CatalogueItem } from "@thread/types";

interface Props {
  limit?: number;
  offset?: number;
  category?: string;
}

export function HomeSection({ limit = 4, offset = 0, category }: Props) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["home-items", { limit, offset, category }],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: String(limit + offset) });
      if (category) params.set("category", category);
      // /items returns { data: CatalogueItem[], meta }; api.get unwraps the outer
      // { data } envelope, so the result IS the items array.
      const all = await api.get<CatalogueItem[]>(`/items?${params.toString()}`);
      return (all ?? []).slice(offset, offset + limit);
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[4/5] rounded-xl bg-gray-100 animate-pulse" />
            <div className="h-3 w-3/4 rounded bg-gray-100 animate-pulse" />
            <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (isError || (data ?? []).length === 0) {
    return (
      <p className="text-sm text-gray-400 py-6">
        {isError ? "Couldn't load these right now — please refresh." : "Nothing here yet — check back soon."}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {(data ?? []).map((item) => <ItemCard key={item.id} item={item} />)}
    </div>
  );
}
