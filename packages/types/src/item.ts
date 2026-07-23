import { z } from "zod";
import { ItemCategorySchema, ItemConditionSchema, GenderTargetSchema } from "./enums";

export const CatalogueItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  category: ItemCategorySchema,
  itemType: z.string(),
  brand: z.string().nullable(),
  size: z.string(),
  genderTarget: GenderTargetSchema,
  condition: ItemConditionSchema,
  photos: z.array(z.string()),
  retailPrice: z.number().int(),
  publishedAt: z.string().datetime().nullable(),
  avgRating: z.number().nullable().optional(),
  reviewCount: z.number().int().optional(),
});
export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;

/** Admin-created catalogue item with no originating seller submission (house stock). */
export const CreateItemDirectSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(2000),
  category: ItemCategorySchema,
  itemType: z.string().min(1).max(100),
  brand: z.string().max(100).optional(),
  size: z.string().min(1).max(20),
  genderTarget: GenderTargetSchema,
  condition: ItemConditionSchema,
  photos: z.array(z.string()).min(1).max(8),
  retailPrice: z.number().int().positive(),
  agreedPayoutPrice: z.number().int().nonnegative().default(0),
});
export type CreateItemDirect = z.infer<typeof CreateItemDirectSchema>;

export const UpdateItemSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: ItemCategorySchema.optional(),
  itemType: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  size: z.string().max(20).optional(),
  genderTarget: GenderTargetSchema.optional(),
  condition: ItemConditionSchema.optional(),
  photos: z.array(z.string()).min(1).max(8).optional(),
  retailPrice: z.number().int().positive().optional(),
});
export type UpdateItem = z.infer<typeof UpdateItemSchema>;

export const CatalogueFilterSchema = z.object({
  category: ItemCategorySchema.optional(),
  condition: ItemConditionSchema.optional(),
  genderTarget: GenderTargetSchema.optional(),
  size: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().positive().optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(["newest", "price_asc", "price_desc"]).default("newest").optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CatalogueFilter = z.infer<typeof CatalogueFilterSchema>;
