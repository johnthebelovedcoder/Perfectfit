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

/** Display labels for each condition enum value (single source of truth). */
export const CONDITION_LABELS: Record<ItemCondition, string> = {
  BRAND_NEW: "Brand New",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  FAIR: "Fair",
};

/** Ordered list of condition values, for building dropdowns/filters. */
export const CONDITION_VALUES = ItemConditionSchema.options;

/** Resolve a condition enum value to its display label (falls back to the raw value). */
export function conditionLabel(condition: string): string {
  return (CONDITION_LABELS as Record<string, string>)[condition] ?? condition;
}

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

/** Display labels for each gender-target enum value (single source of truth). */
export const GENDER_LABELS: Record<GenderTarget, string> = {
  MEN: "Men",
  WOMEN: "Women",
  UNISEX: "Unisex",
  KIDS: "Kids",
};

/** Ordered list of gender-target values, for building dropdowns/filters. */
export const GENDER_VALUES = GenderTargetSchema.options;

/** Resolve a gender-target enum value to its display label (falls back to the raw value). */
export function genderLabel(gender: string): string {
  return (GENDER_LABELS as Record<string, string>)[gender] ?? gender;
}

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

export const KycStatusSchema = z.enum(["NOT_STARTED", "SUBMITTED", "APPROVED", "REJECTED"]);
export type KycStatus = z.infer<typeof KycStatusSchema>;

/** Display labels for each KYC status (single source of truth). */
export const KYC_STATUS_LABELS: Record<KycStatus, string> = {
  NOT_STARTED: "Not started",
  SUBMITTED: "Awaiting review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Resolve a KYC status to its display label (falls back to the raw value). */
export function kycStatusLabel(status: string): string {
  return (KYC_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

export const IdDocumentTypeSchema = z.enum(["PASSPORT", "DRIVERS_LICENCE", "NATIONAL_ID"]);
export type IdDocumentType = z.infer<typeof IdDocumentTypeSchema>;

/** Display labels for each accepted ID document type (single source of truth). */
export const ID_DOCUMENT_LABELS: Record<IdDocumentType, string> = {
  PASSPORT: "Passport",
  DRIVERS_LICENCE: "Driver's Licence",
  NATIONAL_ID: "National ID Card",
};

/** Ordered list of ID document types, for building dropdowns. */
export const ID_DOCUMENT_VALUES = IdDocumentTypeSchema.options;

/** Resolve an ID document type to its display label (falls back to the raw value). */
export function idDocumentLabel(type: string): string {
  return (ID_DOCUMENT_LABELS as Record<string, string>)[type] ?? type;
}

export const RejectionReasonSchema = z.enum([
  "ITEM_CONDITION_BELOW_STANDARD",
  "CATEGORY_NOT_ACCEPTED",
  "PHOTOS_INSUFFICIENT",
  "ITEM_NOT_SELLABLE",
  "OTHER",
]);
export type RejectionReason = z.infer<typeof RejectionReasonSchema>;
