"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogueItem } from "@thread/types";

interface CartItem {
  item: CatalogueItem;
  addedAt: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CatalogueItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalKobo: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (get().items.some((i) => i.item.id === item.id)) return;
        set((state) => ({
          items: [...state.items, { item, addedAt: Date.now() }],
        }));
      },
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.item.id !== id) })),
      clearCart: () => set({ items: [] }),
      totalKobo: () => get().items.reduce((sum, i) => sum + i.item.retailPrice, 0),
    }),
    {
      name: "perfect-fit-cart",
      // Skip automatic rehydration so we control it from the client provider
      // This prevents the Next.js SSR hydration mismatch
      skipHydration: true,
    }
  )
);
