import { z } from "zod";
import { IdDocumentTypeSchema, KycStatusSchema } from "./enums";

/** Minimum seller age, in years. */
export const KYC_MIN_AGE = 18;

/** ISO 3166-1 alpha-2 country code (e.g. GB, US, NG). */
const CountryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{2}$/, "Use a 2-letter country code (e.g. GB, US, NG)");

/**
 * Date of birth as a calendar date (YYYY-MM-DD), not a timestamp — a birth date
 * has no time zone, so parsing it as UTC midnight keeps it stable everywhere.
 */
const DateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the format YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)), "Enter a real date")
  .refine((s) => new Date(`${s}T00:00:00Z`) <= new Date(), "Date of birth cannot be in the future")
  .refine((s) => {
    const dob = new Date(`${s}T00:00:00Z`);
    const cutoff = new Date();
    cutoff.setUTCFullYear(cutoff.getUTCFullYear() - KYC_MIN_AGE);
    return dob <= cutoff;
  }, `Sellers must be at least ${KYC_MIN_AGE} years old`);

/**
 * Seller-submitted KYC: identity and address only. No document images are
 * collected — an admin reviews the details and approves or rejects.
 */
export const SubmitKycSchema = z.object({
  dateOfBirth: DateOfBirthSchema,

  addressLine1: z.string().trim().min(1).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(20),
  country: CountryCodeSchema,

  idDocumentType: IdDocumentTypeSchema,
  idDocumentNumber: z
    .string()
    .trim()
    .min(4)
    .max(50)
    .regex(/^[A-Za-z0-9 -]+$/, "Use letters, numbers, spaces or hyphens only"),
  idIssuingCountry: CountryCodeSchema,
});
export type SubmitKyc = z.infer<typeof SubmitKycSchema>;

/** Admin decision on a submitted KYC record. */
export const ReviewKycSchema = z.discriminatedUnion("decision", [
  z.object({ decision: z.literal("APPROVE") }),
  z.object({
    decision: z.literal("REJECT"),
    rejectionReason: z.string().trim().min(10).max(500),
  }),
]);
export type ReviewKyc = z.infer<typeof ReviewKycSchema>;

/** KYC fields as returned to the seller (own view) and to admins. */
export const KycDetailsSchema = z.object({
  kycStatus: KycStatusSchema,
  kycSubmittedAt: z.string().datetime().nullable(),
  kycReviewedAt: z.string().datetime().nullable(),
  kycRejectionReason: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  addressLine1: z.string().nullable(),
  addressLine2: z.string().nullable(),
  region: z.string().nullable(),
  postalCode: z.string().nullable(),
  country: z.string().nullable(),
  idDocumentType: IdDocumentTypeSchema.nullable(),
  idDocumentNumber: z.string().nullable(),
  idIssuingCountry: z.string().nullable(),
});
export type KycDetails = z.infer<typeof KycDetailsSchema>;
