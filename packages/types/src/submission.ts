import { z } from "zod";
import {
  ItemCategorySchema,
  ItemConditionSchema,
  GenderTargetSchema,
  SubmissionStatusSchema,
  RejectionReasonSchema,
} from "./enums";

export const CreateSubmissionSchema = z.object({
  category: ItemCategorySchema,
  itemType: z.string().min(1).max(100),
  brand: z.string().max(100).optional(),
  size: z.string().min(1).max(20),
  genderTarget: GenderTargetSchema,
  condition: ItemConditionSchema,
  conditionNote: z.string().max(500).optional(),
  photos: z.array(z.string()).min(3, "At least 3 photos required").max(8),
  sellerDescription: z.string().min(10).max(2000),
  desiredPayoutPrice: z.number().int().positive(),
});
export type CreateSubmission = z.infer<typeof CreateSubmissionSchema>;

export const ReviewSubmissionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("ACCEPT"),
    retailPrice: z.number().int().positive(),
    agreedPayoutPrice: z.number().int().positive(),
    adminNote: z.string().max(500).optional(),
  }),
  z.object({
    decision: z.literal("REJECT"),
    rejectionReason: RejectionReasonSchema,
    rejectionNote: z.string().max(500).optional(),
  }),
  z.object({
    decision: z.literal("REQUEST_MORE_INFO"),
    moreInfoRequest: z.string().min(10).max(500),
  }),
]);
export type ReviewSubmission = z.infer<typeof ReviewSubmissionSchema>;

export const NegotiatePriceSchema = z.object({
  agreedPayoutPrice: z.number().int().positive(),
  adminNote: z.string().max(500).optional(),
});
export type NegotiatePrice = z.infer<typeof NegotiatePriceSchema>;

export const SellerNegotiationResponseSchema = z.object({
  accept: z.boolean(),
});
export type SellerNegotiationResponse = z.infer<typeof SellerNegotiationResponseSchema>;

export const SubmissionSummarySchema = z.object({
  id: z.string(),
  createdAt: z.string().datetime(),
  category: ItemCategorySchema,
  itemType: z.string(),
  brand: z.string().nullable(),
  size: z.string(),
  condition: ItemConditionSchema,
  photos: z.array(z.string()),
  status: SubmissionStatusSchema,
  desiredPayoutPrice: z.number().int(),
  agreedPayoutPrice: z.number().int().nullable(),
  retailPrice: z.number().int().nullable(),
});
export type SubmissionSummary = z.infer<typeof SubmissionSummarySchema>;
