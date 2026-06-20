"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogueItem } from "@thread/types";

interface WishlistStore {
  items: CatalogueItem[];
  toggle: (item: CatalogueItem) => void;
  has: (id: string) => boolean;
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
      },
      has: (id) => get().items.some((i) => i.id === id),
    }),
    { name: "perfect-fit-wishlist", skipHydration: true }
  )
);
