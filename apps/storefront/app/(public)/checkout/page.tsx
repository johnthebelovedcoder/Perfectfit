"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, Lock, ChevronDown, ChevronUp, User } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { useCartStore } from "@/stores/cart.store";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useAuth } from "@/lib/auth";
import { getCloudinaryUrl, calculateShippingCents } from "@thread/utils";
import { Price } from "@/components/shared/Price";
import { api } from "@/lib/api";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { GuestCheckoutSchema } from "@thread/types";
import type { GuestCheckout } from "@thread/types";

// Publishable key is safe to expose; baked in at build time.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Washington DC",
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalKobo } = useCartStore();
  const online = useOnlineStatus();
  const auth = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSummaryOpen, setOrderSummaryOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const subtotal = totalKobo();
  const shipping = calculateShippingCents(subtotal);
  const total = subtotal + shipping;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<GuestCheckout>({
    resolver: zodResolver(GuestCheckoutSchema),
    defaultValues: {
      paymentMethod: "CARD",
      itemIds: items.map((i) => i.item.id),
    },
  });

  const onSubmit = async (data: GuestCheckout) => {
    if (!online) {
      setError("You're offline. Placing an order needs an internet connection — reconnect and try again. Your cart is saved.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      // 1. Create the (unpaid) order.
      const result = await api.post<{ order: { id: string; orderNumber: string }; guestToken: string }>(
        "/orders",
        { ...data, itemIds: items.map((i) => i.item.id) }
      );

      // 2. Ask the API for an EMBEDDED Stripe Checkout session for this order.
      const { clientSecret: secret } = await api.post<{ clientSecret: string }>("/payments/checkout-session", {
        orderId: result.order.id,
      });

      // 3. Mount Stripe's embedded card form on-page. Payment is confirmed
      //    server-side by the Stripe webhook; on success Stripe redirects to the
      //    order tracking page (where the cart is cleared).
      setClientSecret(secret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Prefill the email for a logged-in buyer so the order links to their account
  // (order history is matched by email).
  useEffect(() => {
    if (auth?.user.email) setValue("email", auth.user.email);
  }, [auth, setValue]);

  // Keep the (schema-validated) itemIds in sync with the cart. The cart store
  // uses skipHydration and only populates in an effect AFTER mount, so the
  // form's initial defaultValue is an empty array — which fails the
  // `itemIds.min(1)` rule and silently blocks submission (no visible error).
  useEffect(() => {
    setValue("itemIds", items.map((i) => i.item.id));
  }, [items, setValue]);

  useEffect(() => {
    if (hydrated && items.length === 0) router.push("/cart");
  }, [hydrated, items.length, router]);

  if (!hydrated || items.length === 0) return null;

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex items-center gap-1.5 text-sm text-gray-500">
              <Link href="/cart" className="hover:text-gray-900">Cart</Link>
              <span className="text-gray-300">/</span>
              <span className="text-gray-900 font-medium">Checkout</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr,380px] items-start">

            {/* ── Left — Form ──────────────────────────────────────────── */}
            <div className="space-y-6">
              {/* Guest checkout notice */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Checking out as guest</p>
                    <p className="text-xs text-gray-400">No account needed. Your order will be tracked by email.</p>
                  </div>
                </div>
                <div className="text-xs text-gray-400 border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span>Already have an account?</span>
                  <Link href="/auth/login" className="text-gray-700 font-medium hover:underline">Sign in for faster checkout</Link>
                </div>
              </div>

              <form id="checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Contact */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Contact Information</h2>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          First Name
                        </label>
                        <input
                          {...register("firstName")}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="John"
                        />
                        {errors.firstName && (
                          <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          Last Name
                        </label>
                        <input
                          {...register("lastName")}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="Doe"
                        />
                        {errors.lastName && (
                          <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Email Address
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                      {errors.email && (
                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">Order confirmation and tracking will be sent here</p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Phone Number
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="+1 (555) 000-0000"
                      />
                      {errors.phone && (
                        <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Shipping address */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h2 className="text-base font-bold text-gray-900 mb-4">Shipping Address</h2>
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Address Line 1
                      </label>
                      <input
                        {...register("addressLine1")}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                      {errors.addressLine1 && (
                        <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        Apartment, Suite, etc. <span className="text-gray-300 font-normal">(optional)</span>
                      </label>
                      <input
                        {...register("addressLine2")}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="Apt 4B"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          City
                        </label>
                        <input
                          {...register("city")}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          placeholder="New York"
                        />
                        {errors.city && (
                          <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                          State
                        </label>
                        <select
                          {...register("state")}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent bg-white"
                        >
                          <option value="">Select state...</option>
                          {US_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {errors.state && (
                          <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                        ZIP Code
                      </label>
                      <input
                        {...register("postalCode")}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                        placeholder="10001"
                      />
                      {errors.postalCode && (
                        <p className="mt-1 text-xs text-red-500">{errors.postalCode.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment is handled on Stripe's hosted checkout (PCI-compliant),
                    reached by redirect when the buyer places the order. */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Payment</h2>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Lock className="h-3 w-3" />
                      <span>Secured by Stripe</span>
                    </div>
                  </div>
                  {clientSecret ? (
                    <div className="rounded-xl overflow-hidden">
                      <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                        <EmbeddedCheckout />
                      </EmbeddedCheckoutProvider>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-gray-50 border border-gray-100 p-5 flex items-start gap-3">
                      <Lock className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Enter your details, then pay securely below</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Tap &quot;Continue to Payment&quot; and a secure card form (plus Apple&nbsp;Pay / Google&nbsp;Pay) appears right here. We never see or store your card details.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </form>
            </div>

            {/* ── Right — Order Summary ─────────────────────────────────── */}
            <div className="space-y-4">
              {/* Mobile collapsible header */}
              <button
                className="lg:hidden w-full flex items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
                onClick={() => setOrderSummaryOpen(!orderSummaryOpen)}
              >
                <span className="text-sm font-semibold text-gray-900">
                  Order Summary ({items.length} item{items.length !== 1 ? "s" : ""})
                </span>
                <div className="flex items-center gap-2">
                  <Price cents={total} className="text-sm font-bold" />
                  {orderSummaryOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                </div>
              </button>

              {/* Summary card — always visible on desktop */}
              <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${
                orderSummaryOpen ? "block" : "hidden lg:block"
              }`}>
                {/* Items */}
                <div className="p-5 space-y-4 border-b border-gray-100">
                  {items.map(({ item }) => {
                    const photo = item.photos[0];
                    return (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {photo && (
                            <Image
                              src={getCloudinaryUrl(photo, { width: 56, height: 64 })}
                              alt={item.title}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          )}
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">1</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 line-clamp-2">{item.title}</p>
                          <p className="text-xs text-gray-400">Size {item.size}</p>
                        </div>
                        <Price cents={item.retailPrice} className="text-sm font-semibold text-gray-900 shrink-0" />
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="p-5 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Subtotal</span>
                    <Price cents={subtotal} className="font-medium text-gray-900" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Shipping</span>
                    <Price cents={shipping} className="font-medium text-gray-900" />
                  </div>
                  <p className="text-[11px] text-gray-400">Shipped directly by the seller.</p>
                  <div className="border-t border-gray-100 pt-3 flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <Price cents={total} className="text-lg font-bold text-gray-900" />
                  </div>
                  <p className="text-[11px] text-gray-400 text-right">Charged in USD at checkout.</p>
                </div>
              </div>

              {/* CTA — hidden once the embedded Stripe form is showing (it has its own Pay button) */}
              {!clientSecret && (
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={isSubmitting || !online}
                  className="w-full bg-gray-900 text-white font-semibold py-4 rounded-2xl text-sm hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {!online
                    ? "Offline — reconnect to order"
                    : isSubmitting
                      ? "Preparing payment…"
                      : <>Continue to Payment — <Price cents={total} /></>}
                </button>
              )}

              {/* Trust row */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Secure checkout — SSL encrypted</span>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                By placing your order you agree to our{" "}
                <Link href="/terms" className="underline hover:text-gray-700">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-gray-700">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
