"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

/**
 * Seller Agreement gate. Shown before a seller can list items — they must read
 * and accept before selling.
 *
 * ⚠️ DRAFT TERMS — this text is a starting point that reflects how the platform
 * actually works today. Have it reviewed/finalised by the business (and a legal
 * advisor) before launch. Bump SELLER_AGREEMENT_VERSION in @thread/types when the
 * wording changes materially.
 */
export function SellerAgreement({ onAccepted }: { onAccepted?: () => void }) {
  const qc = useQueryClient();
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => api.post("/sellers/me/agreement", {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["my-profile"] });
      void qc.invalidateQueries({ queryKey: ["seller-profile"] });
      onAccepted?.();
    },
    onError: (e: unknown) => setError(e instanceof Error ? e.message : "Could not save. Please try again."),
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seller Agreement</h1>
          <p className="text-sm text-gray-500">Please read and accept before you start selling.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5 text-sm text-gray-700 leading-relaxed max-h-[55vh] overflow-y-auto">
        <section>
          <h2 className="font-semibold text-gray-900 mb-1">1. How selling works</h2>
          <p>You submit items you own for review. Our team reviews each item and, if accepted, lists it on the Perfect Fit storefront. You keep ownership until the item sells.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">2. Pricing &amp; how you get paid</h2>
          <p>When you submit an item you propose a <strong>desired payout</strong>. During review we agree a <strong>fixed payout</strong> with you and set the <strong>retail price</strong> that buyers pay on the storefront.</p>
          <p className="mt-2">When your item sells, you receive <strong>exactly the agreed payout</strong> — no more, no less. The difference between the retail price and your payout is Perfect Fit&apos;s service fee, which covers listing, payment processing, customer service and logistics. Your payout does not change based on the final sale price.</p>
          <p className="mt-2 text-gray-500">Example: if we agree a $45 payout and the item is listed at $75, you receive $45 when it sells and Perfect Fit retains $30.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">3. When you&apos;re paid</h2>
          <p>Payouts are released after the buyer&apos;s return window closes (7 days after delivery), provided the sale is complete and not refunded or returned. Payouts require your identity verification (KYC) and payout details to be complete.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">4. Your responsibilities</h2>
          <p>You confirm that you own each item, that it is authentic and legal to sell, and that your description, photos and condition are accurate. Misrepresented or prohibited items may be removed and may affect your ability to sell.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">5. Returns &amp; refunds</h2>
          <p>If a buyer returns an item or an order is refunded, no payout is due for that item. If a payout was already queued it will be cancelled.</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">6. Listings &amp; removal</h2>
          <p>Perfect Fit may edit listing details for clarity, decline to list an item, or remove a listing that breaches these terms. You can edit your own live listings (except the retail price, which we set).</p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-900 mb-1">7. Changes to these terms</h2>
          <p>We may update this agreement. If the terms change materially, you may be asked to review and accept the new version before continuing to sell.</p>
        </section>
      </div>

      <label className="flex items-start gap-3 mt-5 cursor-pointer">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900" />
        <span className="text-sm text-gray-700">I have read and agree to the Seller Agreement, including how payouts and the service fee work.</span>
      </label>

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      <button
        onClick={() => mutation.mutate()}
        disabled={!agreed || mutation.isPending}
        className="mt-5 w-full bg-gray-900 hover:bg-black text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? "Saving…" : "Agree & Continue"}
      </button>
    </div>
  );
}
