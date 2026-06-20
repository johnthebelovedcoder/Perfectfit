import { z } from "zod";
import { RoleSchema } from "./enums";

export const RegisterBuyerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});
export type RegisterBuyer = z.infer<typeof RegisterBuyerSchema>;

export const RegisterSellerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  city: z.string().min(1).max(100),
  bankAccountName: z.string().min(1).max(200),
  bankAccountNumber: z.string().min(10).max(20),
  bankName: z.string().min(1).max(100),
});
export type RegisterSeller = z.infer<typeof RegisterSellerSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
});
export type Login = z.infer<typeof LoginSchema>;

export const UpdateSellerProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  city: z.string().min(1).max(100).optional(),
  bankAccountName: z.string().min(1).max(200).optional(),
  bankAccountNumber: z.string().min(10).max(20).optional(),
  bankName: z.string().min(1).max(100).optional(),
});
export type UpdateSellerProfile = z.infer<typeof UpdateSellerProfileSchema>;

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: RoleSchema,
  emailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
});
export type SessionUser = z.infer<typeof SessionUserSchema>;
