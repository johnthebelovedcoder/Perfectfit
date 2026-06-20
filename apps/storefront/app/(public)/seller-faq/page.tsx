"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

const FAQS = [
  {
    section: "Getting Started",
    items: [
      { q: "Do I need an account to sell?", a: "Yes. You need to create a seller account and have it verified before you can submit items. Verification usually takes under 24 hours." },
      { q: "Is there a fee to sign up?", a: "No. Creating a seller account is completely free. Perfect Fit earns by taking a percentage of the sale price, which is agreed when your item is accepted." },
      { q: "What types of items can I sell?", a: "Clothing (tops, bottoms, dresses, outerwear), shoes, bags, and accessories. Items must meet our quality standards — see the Quality Promise page for full details." },
    ],
  },
  {
    section: "Submitting Items",
    items: [
      { q: "How many photos do I need?", a: "At least 3, up to 8. We need a front, back, and close-up of any labels or defects. Good natural lighting helps your item get accepted faster." },
      { q: "What happens after I submit?", a: "Our team reviews your submission within 48 hours. We'll accept it, ask for more information, or suggest a price adjustment. You'll receive a notification either way." },
      { q: "Can I submit multiple items at once?", a: "Yes. You can submit as many items as you like, one at a time. Each submission is reviewed independently." },
      { q: "What if my item is rejected?", a: "We'll tell you why. Most rejections are due to photo quality or undisclosed condition issues. You may be able to resubmit with better photos or an updated description." },
    ],
  },
  {
    section: "Pricing & Payouts",
    items: [
      { q: "How is the payout determined?", a: "You tell us what you'd like to receive. We review it against market pricing and either agree, counter-offer, or (rarely) decline. You always have the final say." },
      { q: "When do I get paid?", a: "Within 7 days of your item selling. Payouts go directly to the bank account on your seller profile." },
      { q: "What percentage does Perfect Fit take?", a: "Our commission is agreed at the time of acceptance and factored into the retail price. The payout you agree to is the amount you receive — no surprise deductions." },
    ],
  },
  {
    section: "Shipping",
    items: [
      { q: "Do I need to pay for shipping?", a: "You cover the cost of shipping your item to our warehouse. We handle all outbound shipping to buyers." },
      { q: "Where do I ship the item?", a: "Our warehouse address is provided when your submission is accepted. You'll find it in your seller portal and in the acceptance email." },
      { q: "What if my item is damaged in transit?", a: "We recommend using a tracked service. If an item arrives damaged, we'll contact you before making any listing decisions." },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 py-4 text-left"
      >
        <span className={`text-sm font-medium ${open ? "text-gray-900" : "text-gray-700"}`}>{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <p className="text-sm text-gray-500 leading-relaxed pb-4 -mt-1">{a}</p>
      )}
    </div>
  );
}

export default function SellerFAQPage() {
  return (
    <>
      <Header />
      <main>
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Seller FAQ</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Seller questions, answered</h1>
          <p className="text-gray-400 max-w-md mx-auto text-base">Everything you need to know about selling on Perfect Fit.</p>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-2xl space-y-10">
            {FAQS.map(({ section, items }) => (
              <div key={section}>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{section}</h2>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 px-6">
                  {items.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
                </div>
              </div>
            ))}

            <div className="bg-gray-900 rounded-2xl p-8 text-center text-white">
              <p className="font-bold text-lg mb-2">Still have questions?</p>
              <p className="text-gray-400 text-sm mb-5">Our team is happy to help with anything not covered here.</p>
              <Link href="/contact" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Contact Support →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
