import { z } from "zod";

export const RoleSchema = z.enum(["BUYER", "SELLER", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

export const SubmissionStatusSchema = z.enum([
  "PENDING_REVIEW",
  "AWAITING_MORE_INFO",
  "UNDER_NEGOTIATION",
  "ACCEPTED",
  "REJECTED",
  "AWAITING_SHIPMENT",
  "RECEIVED_AT_WAREHOUSE",
  "LIVE",
  "SOLD",
  "PAYOUT_QUEUED",
  "PAYOUT_PROCESSED",
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const ItemConditionSchema = z.enum(["BRAND_NEW", "EXCELLENT", "GOOD", "FAIR"]);
export type ItemCondition = z.infer<typeof ItemConditionSchema>;

export const ItemCategorySchema = z.enum([
  "WOMENS_AFRICAN_WEAR",
  "MENS_AFRICAN_WEAR",
  "CHILDRENS_AFRICAN_WEAR",
  "ANKARA_OUTFITS",
  "LACE_OUTFITS",
  "ASO_OKE_ATTIRE",
  "ADIRE_WEAR",
  "KAFTANS_AGBADA",
  "DRESSES_GOWNS",
  "SKIRTS_BLOUSES",
  "TRADITIONAL_WEDDING_ATTIRE",
  "ACCESSORIES",
  "SHOES_BAGS",
  "PRELOVED_THRIFTED",
]);
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

/** Display labels for each category enum value (single source of truth). */
export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  WOMENS_AFRICAN_WEAR: "Women's African Wear",
  MENS_AFRICAN_WEAR: "Men's African Wear",
  CHILDRENS_AFRICAN_WEAR: "Children's African Wear",
  ANKARA_OUTFITS: "Ankara Outfits",
  LACE_OUTFITS: "Lace Outfits",
  ASO_OKE_ATTIRE: "Aso-Oke Attire",
  ADIRE_WEAR: "Adire Wear",
  KAFTANS_AGBADA: "Kaftans & Agbada",
  DRESSES_GOWNS: "Dresses & Gowns",
  SKIRTS_BLOUSES: "Skirts & Blouses",
  TRADITIONAL_WEDDING_ATTIRE: "Traditional Wedding Attire",
  ACCESSORIES: "Accessories (Gele, Caps, Beads, etc.)",
  SHOES_BAGS: "Shoes & Bags",
  PRELOVED_THRIFTED: "Pre-Loved / Thrifted African Wear",
};

/** Ordered list of category values, for building dropdowns/filters. */
export const CATEGORY_VALUES = ItemCategorySchema.options;

/** Resolve a category enum value to its display label (falls back to the raw value). */
export function categoryLabel(category: string): string {
  return (CATEGORY_LABELS as Record<string, string>)[category] ?? category;
}

export const GenderTargetSchema = z.enum(["MEN", "WOMEN", "UNISEX", "KIDS"]);
export type GenderTarget = z.infer<typeof GenderTargetSchema>;

export const OrderStatusSchema = z.enum([
  "PLACED",
  "PROCESSING",
  "DISPATCHED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
  "CANCELLED",
]);
export type OrderStatus = z.infer<typeof OrderStatusSchema>;

export const PayoutStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export type PayoutStatus = z.infer<typeof PayoutStatusSchema>;

export const RejectionReasonSchema = z.enum([
  "ITEM_CONDITION_BELOW_STANDARD",
  "CATEGORY_NOT_ACCEPTED",
  "PHOTOS_INSUFFICIENT",
  "ITEM_NOT_SELLABLE",
  "OTHER",
]);
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;
