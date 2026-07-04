"use client";

import { useEffect, useState } from "react";
import { useCurrencyStore } from "@/stores/currency.store";

/**
 * Renders a USD-cent amount in the shopper's selected display currency.
 * Charging still happens in USD via Stripe — this is a display convenience for
 * the diaspora audience. Renders USD on the server/first paint to avoid a
 * hydration mismatch, then switches to the chosen currency after mount.
 */
export function Price({ cents, className }: { cents: number; className?: string }) {
  const [mounted, setMounted] = useState(false);
  const code = useCurrencyStore((s) => s.code);
  const rates = useCurrencyStore((s) => s.rates);

  useEffect(() => setMounted(true), []);

  const activeCode = mounted ? code : "USD";
  const rate = (mounted ? rates[activeCode] : 1) ?? 1;
  const value = (cents / 100) * rate;

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: activeCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  return <span className={className}>{formatted}</span>;
}
