"use client";

import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { get, set, del } from "idb-keyval";
import { useState, useEffect } from "react";
import { useCartStore } from "@/stores/cart.store";
import { useWishlistStore } from "@/stores/wishlist.store";

// Persisted reads survive reloads and offline sessions. gcTime must be >= maxAge,
// otherwise React Query evicts queries before they can be restored from storage.
const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24 * 7; // 7 days

function StoreHydrator() {
  useEffect(() => {
    void useCartStore.persist.rehydrate();
    void useWishlistStore.persist.rehydrate();
  }, []);
  return null;
}

// IndexedDB-backed async persister. idb-keyval only touches IndexedDB at call time
// (on the client), so importing this module during SSR is safe.
const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
  key: "perfect-fit-rq-cache",
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: PERSIST_MAX_AGE,
            retry: 1,
          },
        },
      })
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE }}
    >
      <StoreHydrator />
      {children}
    </PersistQueryClientProvider>
  );
}
