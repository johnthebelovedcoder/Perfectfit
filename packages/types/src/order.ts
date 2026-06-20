import { z } from "zod";
import { OrderStatusSchema } from "./enums";

export const GuestCheckoutSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  addressLine1: z.string().min(1).max(200),
  addressLine2: z.string().max(200).optional(),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().max(20).optional(),
  itemIds: z.array(z.string()).min(1),
  paymentMethod: z.enum(["CARD", "BANK_TRANSFER", "MOBILE_MONEY"]),
});
export type GuestCheckout = z.infer<typeof GuestCheckoutSchema>;

export const UpdateOrderStatusSchema = z.object({
  status: OrderStatusSchema,
  trackingNumber: z.string().max(100).optional(),
  courierName: z.string().max(100).optional(),
  note: z.string().max(500).optional(),
});
export type UpdateOrderStatus = z.infer<typeof UpdateOrderStatusSchema>;

export const ReturnRequestSchema = z.object({
  orderNumber: z.string(),
  email: z.string().email(),
  reason: z.string().min(10).max(1000),
});
export type ReturnRequest = z.infer<typeof ReturnRequestSchema>;

export const OrderTrackingSchema = z.object({
  orderNumber: z.string(),
  status: OrderStatusSchema,
  firstName: z.string(),
  email: z.string(),
  city: z.string(),
  state: z.string(),
  trackingNumber: z.string().nullable(),
  courierName: z.string().nullable(),
  createdAt: z.string().datetime(),
  dispatchedAt: z.string().datetime().nullable(),
  deliveredAt: z.string().datetime().nullable(),
  totalAmountKobo: z.number().int(),
  orderItems: z.array(
    z.object({
      priceKobo: z.number().int(),
      item: z.object({
        title: z.string(),
        photos: z.array(z.string()),
        retailPrice: z.number().int(),
      }),
    })
  ),
});
export type OrderTracking = z.infer<typeof OrderTrackingSchema>;
