import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, Package, Truck, MapPin, ShoppingBag } from "lucide-react";
import { ReturnButton } from "./ReturnButton";
import { ClearCartOnPlaced } from "./ClearCartOnPlaced";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { formatPrice, getCloudinaryUrl } from "@thread/utils";

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ placed?: string }>;
}

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

const STATUS_STEPS = [
  { key: "PLACED",           label: "Order Placed",      icon: CheckCircle },
  { key: "PROCESSING",       label: "Processing",        icon: Package },
  { key: "DISPATCHED",       label: "Dispatched",        icon: Truck },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery",  icon: Truck },
  { key: "DELIVERED",        label: "Delivered",         icon: MapPin },
];

interface OrderItem {
  item: { title: string; photos: string[]; retailPrice: number };
  priceKobo: number; // DB field name, but value is now cents
}

interface Order {
  orderNumber: string;
  status: string;
  firstName: string;
  email: string;
  city: string;
  state: string;
  trackingNumber?: string | null;
  courierName?: string | null;
  createdAt: string;
  dispatchedAt?: string | null;
  orderItems: OrderItem[];
  totalAmountKobo: number; // DB field name, value is cents
}

export const metadata: Metadata = { title: "Track Your Order — Perfect Fit" };

async function getOrder(token: string): Promise<Order | null> {
  try {
    const res = await fetch(`${API_URL}/v1/orders/${token}/track`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json() as { data: Order };
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function TrackPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { placed } = await searchParams;
  const order = await getOrder(token);
  if (!order) notFound();

  const isReturnState = order.status === "RETURN_REQUESTED" || order.status === "REFUNDED";
  const isCancelled = order.status === "CANCELLED";
  const currentStep = STATUS_STEPS.findIndex((s) => s.key === order.status);
  // For return/refund states treat as "Delivered" (last normal step) so the bar shows full progress
  const activeIdx = isReturnState ? STATUS_STEPS.length - 1 : currentStep === -1 ? 0 : currentStep;

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 max-w-2xl">

          {/* Clear the cart once payment succeeded and the buyer landed here */}
          {placed === "1" && <ClearCartOnPlaced />}

          {/* Just-placed banner */}
          {placed === "1" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-start gap-4">
              <CheckCircle className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-800">Order confirmed! 🎉</p>
                <p className="text-sm text-emerald-700 mt-0.5">
                  Thanks, {order.firstName}! We&apos;ve received your order and will process it shortly.
                  A confirmation email will be sent to <strong>{order.email}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h1 className="text-lg font-bold text-gray-900">Order #{order.orderNumber}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                order.status === "DELIVERED" ? "bg-emerald-100 text-emerald-700" :
                order.status === "DISPATCHED" || order.status === "OUT_FOR_DELIVERY" ? "bg-blue-100 text-blue-700" :
                "bg-amber-100 text-amber-700"
              }`}>
                {order.status.replaceAll("_", " ")}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Placed {new Date(order.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              {" · "}{order.city}, {order.state}
            </p>
            {order.trackingNumber && (
              <p className="text-sm text-gray-500 mt-1">
                Tracking: <span className="font-mono font-medium">{order.trackingNumber}</span>
                {order.courierName && ` via ${order.courierName}`}
              </p>
            )}
          </div>

          {/* Cancellation notice */}
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-5">
              <p className="font-semibold text-red-800">Order cancelled</p>
              <p className="text-sm text-red-600 mt-1">This order was cancelled. If you were charged, a refund will be issued within 3–5 business days.</p>
            </div>
          )}

          {/* Return / refund status */}
          {order.status === "RETURN_REQUESTED" && (
            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-5">
              <p className="font-semibold text-orange-800">Return in progress</p>
              <p className="text-sm text-orange-600 mt-1">Your return request is being reviewed. We'll contact you within 24 hours.</p>
            </div>
          )}
          {order.status === "REFUNDED" && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-5">
              <p className="font-semibold text-emerald-800">Refund processed</p>
              <p className="text-sm text-emerald-600 mt-1">Your refund has been processed. Funds should appear in your account within 3–5 business days.</p>
            </div>
          )}

          {/* Progress stepper */}
          {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-5">Delivery Progress</h2>
            <div className="flex items-start justify-between relative">
              {/* Connector line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100 -z-0" />
              <div
                className="absolute top-5 left-5 h-0.5 bg-emerald-400 transition-all duration-700 -z-0"
                style={{ width: `${(activeIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
              />

              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done = i <= activeIdx;
                const current = i === activeIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      done
                        ? "border-emerald-400 bg-emerald-400 text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-300"
                    } ${current ? "ring-4 ring-emerald-100" : ""}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <p className={`text-[10px] text-center leading-tight max-w-[60px] ${
                      done ? "text-gray-700 font-semibold" : "text-gray-400"
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-4">Your Items</h2>
            <div className="space-y-4">
              {order.orderItems.map((oi, i) => {
                const photo = oi.item.photos[0];
                // priceKobo is the DB column name but now stores cents
                const priceCents = oi.priceKobo;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="relative w-14 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {photo && (
                        <Image
                          src={getCloudinaryUrl(photo, { width: 56, height: 64 })}
                          alt={oi.item.title}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">{oi.item.title}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{formatPrice(priceCents)}</p>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Total</span>
              <span className="text-base font-bold text-gray-900">{formatPrice(order.totalAmountKobo)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {order.status === "DELIVERED" && (
              <ReturnButton token={token} />
            )}
            <Link
              href="/catalogue"
              className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Link>
          </div>

          <p className="mt-6 text-xs text-gray-400 text-center">
            Questions? Email{" "}
            <a href="mailto:support@perfectfit.com" className="underline hover:text-gray-700">
              support@perfectfit.com
            </a>
            {" "}or bookmark this page to track your order.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
