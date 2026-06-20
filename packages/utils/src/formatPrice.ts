/**
 * Format an integer cents amount as a human-readable USD string.
 * All monetary values are stored as integers (cents). Display only at the UI layer.
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(dollars);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Legacy aliases removed — use centsToDollars / dollarsToCents directly

export function calculateMargin(retailPrice: number, payoutPrice: number): number {
  return retailPrice - payoutPrice;
}

export function calculateMarginPercent(retailPrice: number, payoutPrice: number): number {
  if (retailPrice === 0) return 0;
  return Math.round(((retailPrice - payoutPrice) / retailPrice) * 100);
}
