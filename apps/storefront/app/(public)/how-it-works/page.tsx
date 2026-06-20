import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Search, ClipboardCheck, PackageCheck, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";

const BUYER_STEPS = [
  {
    icon: Search,
    title: "Browse the catalogue",
    desc: "Filter by category, size, condition, and price. Every item has been inspected and approved by our team before listing.",
  },
  {
    icon: ShoppingBag,
    title: "Add to cart & checkout",
    desc: "Checkout as a guest or with your account. We accept all major payment methods.",
  },
  {
    icon: PackageCheck,
    title: "Receive your order",
    desc: "Your item ships from our warehouse within 1–2 business days. Track it every step of the way.",
  },
];

const SELLER_STEPS = [
  {
    num: "01",
    title: "Submit your item",
    desc: "Create a seller account and submit photos, condition notes, and the payout you're hoping for. Takes under 5 minutes.",
  },
  {
    num: "02",
    title: "We review it",
    desc: "Our team reviews every submission within 48 hours. We'll accept, request more info, or suggest a price adjustment.",
  },
  {
    num: "03",
    title: "Ship to our warehouse",
    desc: "Once accepted, ship your item to us. We cover photography, listing copy, and all buyer communication.",
  },
  {
    num: "04",
    title: "Get paid",
    desc: "When your item sells, the agreed payout lands in your bank account within 7 days. No chasing payments.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">How It Works</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Simple from start to finish</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
            Whether you&apos;re here to shop or sell, Perfect Fit takes care of the heavy lifting so you don&apos;t have to.
          </p>
        </section>

        {/* Buying */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">For Buyers</h2>
              <p className="text-gray-400 mt-2">Shop with confidence — every item quality-checked before it reaches you</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-8">
              {BUYER_STEPS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="relative text-center">
                  {i < BUYER_STEPS.length - 1 && (
                    <ArrowRight className="hidden sm:block absolute top-6 -right-4 h-5 w-5 text-gray-200" />
                  )}
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/catalogue" className="inline-flex items-center gap-2 bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors">
                Browse the Catalogue →
              </Link>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Selling */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-gray-900">For Sellers</h2>
              <p className="text-gray-400 mt-2">Turn your unworn clothes into cash — we handle everything after you ship</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {SELLER_STEPS.map(({ num, title, desc }) => (
                <div key={num} className="bg-white border border-gray-100 rounded-2xl p-6 flex gap-4">
                  <span className="text-2xl font-black text-gray-100 font-mono leading-none mt-0.5">{num}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/become-a-seller" className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                Start Selling →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
