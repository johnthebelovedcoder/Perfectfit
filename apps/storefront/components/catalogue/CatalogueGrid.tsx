"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ItemCard } from "./ItemCard";
import { Button, Skeleton } from "@thread/ui";
import { api } from "@/lib/api";
import type { CatalogueItem, PaginationMeta } from "@thread/types";

interface Props {
  category?: string;
  search?: string;
}

interface ItemsResponse {
  data: CatalogueItem[];
  meta: PaginationMeta;
}

export function CatalogueGrid({ category, search }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["items", { category, search }],
      queryFn: async ({ pageParam }) => {
        const params = new URLSearchParams();
        if (category) params.set("category", category);
        if (search) params.set("search", search);
        if (pageParam) params.set("cursor", pageParam as string);
        params.set("limit", "24");

        return api.get<ItemsResponse>(`/items?${params.toString()}`);
      },
      getNextPageParam: (lastPage) => {
        const meta = (lastPage as unknown as { meta: PaginationMeta }).meta;
        return meta.hasMore ? meta.nextCursor : undefined;
      },
      initialPageParam: undefined as string | undefined,
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-[4/5] w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  const items = data?.pages.flatMap((page) => {
    const p = page as unknown as { data: CatalogueItem[] };
    return p.data;
  }) ?? [];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-lg font-medium">No items found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try adjusting your filters or check back later.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
