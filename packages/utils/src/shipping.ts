// Shipping policy — single source of truth shared by storefront and API.
// All amounts in integer USD cents.

/** Flat domestic (US) shipping fee. */
export const FLAT_SHIPPING_CENTS = 699;

/** Orders at or above this subtotal ship free. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;

/**
 * Shipping charged for a given item subtotal (cents).
 * Returns 0 when the free-shipping threshold is met.
 */
export function calculateShippingCents(subtotalCents: number): number {
  if (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0;
  return FLAT_SHIPPING_CENTS;
}
