"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogueItem } from "@thread/types";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/auth";

interface WishlistStore {
  items: CatalogueItem[];
  toggle: (item: CatalogueItem) => void;
  has: (id: string) => boolean;
  /** Merge local wishlist into the account wishlist, then adopt the server result. */
  syncFromServer: () => Promise<void>;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) => {
        const exists = get().items.some((i) => i.id === item.id);
        set((state) => ({
          items: exists
            ? state.items.filter((i) => i.id !== item.id)
            : [...state.items, item],
        }));
        if (getAuth()) {
          if (exists) void api.del(`/me/wishlist/${item.id}`).catch(() => {});
          else void api.post(`/me/wishlist/${item.id}`, {}).catch(() => {});
        }
      },
      has: (id) => get().items.some((i) => i.id === id),
      syncFromServer: async () => {
        if (!getAuth()) return;
        const localIds = get().items.map((i) => i.id);
        try {
          const items = await api.post<CatalogueItem[]>("/me/wishlist/merge", { itemIds: localIds });
          set({ items });
        } catch {
          // Offline / transient — keep the local wishlist as-is.
        }
      },
    }),
    { name: "perfect-fit-wishlist", skipHydration: true }
  )
);
