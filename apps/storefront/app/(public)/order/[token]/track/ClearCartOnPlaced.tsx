"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart.store";

/**
 * Clears the cart once the buyer lands on the tracking page after a successful
 * Stripe payment (?placed=1). Rendered only on that redirect, so cancelled
 * payments keep the cart intact.
 */
export function ClearCartOnPlaced() {
  useEffect(() => {
    useCartStore.getState().clearCart();
  }, []);
  return null;
}
