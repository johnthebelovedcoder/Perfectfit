import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { DollarSign, Package, Users, Zap } from "lucide-react";
import Link from "next/link";

const SELLER_URL = process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002";

const PERKS = [
  { icon: DollarSign, title: "You set the price", desc: "Tell us what payout you want. We negotiate fairly and you always have final say." },
  { icon: Package, title: "We do the hard part", desc: "Photography, listing, shipping, customer service — all handled by us." },
  { icon: Users, title: "Reach real buyers", desc: "Your items are shown to thousands of active shoppers on Perfect Fit." },
  { icon: Zap, title: "Fast payouts", desc: "When your item sells, you get paid within 7 days. Direct to your bank account." },
];

export default function BecomeASellerPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-[#0f0f0f] py-24 px-4 text-center">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Sell on Perfect Fit</p>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
              Your closet is worth more<br />than you think
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto text-base leading-relaxed mb-10">
              Perfect Fit makes it easy to turn clothes you no longer wear into real money. Submit, ship, and get paid — we handle everything in between.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href={`${SELLER_URL}/register`}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors">
                Create Seller Account →
              </a>
              <Link href="/how-it-works"
                className="inline-flex items-center gap-2 border border-white/20 text-gray-300 hover:text-white hover:border-white/40 font-medium px-8 py-3.5 rounded-xl text-sm transition-colors">
                How it works
              </Link>
            </div>
          </div>
        </section>

        {/* Perks */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">Why sell with Perfect Fit?</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {PERKS.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4 bg-gray-50 border border-gray-100 rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-white border border-gray-200 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">Get started in minutes</h2>
            <ol className="space-y-4">
              {[
                { n: "1", t: "Create your seller account", d: "Sign up with your email. Provide your bank details for payouts. We verify your account within 24 hours." },
                { n: "2", t: "Submit your first item", d: "Upload photos, describe the condition, and name your payout. Our team reviews every submission before it goes live." },
                { n: "3", t: "Ship it to us", d: "Once accepted, we send you shipping instructions. Drop off at any courier — we cover the logistics from there." },
                { n: "4", t: "Collect your payout", d: "Your item sells. We process your payout within 7 days, straight to your account." },
              ].map(({ n, t, d }) => (
                <li key={n} className="flex gap-5 bg-white border border-gray-100 rounded-2xl p-6">
                  <span className="text-3xl font-black text-gray-100 font-mono leading-none shrink-0">{n}</span>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">{t}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="text-center mt-10">
              <a href={`${SELLER_URL}/register`}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3.5 rounded-xl text-sm transition-colors">
                Start Selling Today →
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
