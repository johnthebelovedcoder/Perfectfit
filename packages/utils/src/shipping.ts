// Shipping policy — single source of truth shared by storefront and API.
// All amounts in integer USD cents.

/** Flat shipping fee, per seller/parcel. Passed through to the seller who ships. */
export const FLAT_SHIPPING_CENTS = 699;

/**
 * Shipping charged for an order. Sellers now post parcels directly to buyers, so
 * the buyer always pays the flat fee and it is passed to the seller — there is no
 * free-shipping threshold (Perfect Fit would otherwise absorb the seller's postage).
 */
export function calculateShippingCents(_subtotalCents: number): number {
  return FLAT_SHIPPING_CENTS;
}
