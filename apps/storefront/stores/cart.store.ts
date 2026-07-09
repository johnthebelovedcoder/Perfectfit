"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CatalogueItem } from "@thread/types";
import { api } from "@/lib/api";
import { getAuth } from "@/lib/auth";

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
  /** Merge local cart into the account cart, then adopt the server result. */
  syncFromServer: () => Promise<void>;
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
        // Persist to the account when signed in (fire-and-forget).
        if (getAuth()) void api.post(`/me/cart/${item.id}`, {}).catch(() => {});
      },
      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.item.id !== id) }));
        if (getAuth()) void api.del(`/me/cart/${id}`).catch(() => {});
      },
      clearCart: () => {
        set({ items: [] });
        if (getAuth()) void api.del("/me/cart").catch(() => {});
      },
      totalKobo: () => get().items.reduce((sum, i) => sum + i.item.retailPrice, 0),
      syncFromServer: async () => {
        if (!getAuth()) return;
        const localIds = get().items.map((i) => i.item.id);
        try {
          const items = await api.post<CatalogueItem[]>("/me/cart/merge", { itemIds: localIds });
          set({ items: items.map((item) => ({ item, addedAt: Date.now() })) });
        } catch {
          // Offline / transient — keep the local cart as-is.
        }
      },
    }),
    {
      name: "perfect-fit-cart",
      // Skip automatic rehydration so we control it from the client provider
      // This prevents the Next.js SSR hydration mismatch
      skipHydration: true,
    }
  )
);
