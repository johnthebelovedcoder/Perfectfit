// Marketplace pricing — single source of truth shared by storefront and API.
// All amounts in integer USD cents.
//
// Sellers set the price THEY receive. Buyers pay that price plus a fixed markup
// which is Perfect Fit's fee. Perfect Fit never sets prices manually.

/** Perfect Fit's markup on the seller's price (12%). */
export const SELLER_MARKUP_RATE = 0.12;

/** Buyer-facing retail price = seller price + markup, rounded to the nearest cent. */
export function retailFromSellerPrice(sellerPriceCents: number): number {
  return Math.round(sellerPriceCents * (1 + SELLER_MARKUP_RATE));
}

/** Perfect Fit's fee = retail − seller price. */
export function platformFeeFromSellerPrice(sellerPriceCents: number): number {
  return retailFromSellerPrice(sellerPriceCents) - sellerPriceCents;
}
