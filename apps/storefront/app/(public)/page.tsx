import Link from "next/link";
import { Shield, Truck, RotateCcw, Star } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { HeroSlider } from "@/components/shared/HeroSlider";
import { HomeSection } from "@/components/catalogue/HomeSection";
import { CATEGORY_VALUES, categoryLabel } from "@thread/types";

const CATEGORIES = CATEGORY_VALUES.map((value) => ({ value, label: categoryLabel(value) }));

const OCCASIONS = [
  { label: "Weddings", desc: "Aso-Oke, lace & bridal sets", href: "/catalogue?category=TRADITIONAL_WEDDING_ATTIRE", bg: "from-rose-500 to-rose-700" },
  { label: "Festive & Party", desc: "Bold Ankara statements", href: "/catalogue?category=ANKARA_OUTFITS", bg: "from-amber-500 to-orange-600" },
  { label: "Everyday", desc: "Effortless women's wear", href: "/catalogue?category=WOMENS_AFRICAN_WEAR", bg: "from-emerald-500 to-teal-700" },
  { label: "For Him", desc: "Agbada, kaftans & senators", href: "/catalogue?category=MENS_AFRICAN_WEAR", bg: "from-slate-600 to-slate-800" },
];

const TESTIMONIALS = [
  { name: "Amara O.", location: "Houston, TX", quote: "Everything I couldn't find without flying home. Arrived fast, exactly as pictured, and the quality was better than I expected." },
  { name: "Kwame B.", location: "London, UK", quote: "Ordered an agbada for a wedding — inspected, well-packaged, and delivered in days. No more risky imports and long waits." },
  { name: "Ngozi A.", location: "Toronto, CA", quote: "Finally a place I trust for authentic Ankara. The size chart was spot on and returns gave me peace of mind." },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSlider />

        {/* Trust badges */}
        <section className="border-b border-gray-100 py-8 px-4">
          <div className="container mx-auto">
            <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              {[
                { icon: Shield, title: "Quality Inspected", desc: "Every item checked by our team" },
                { icon: Truck, title: "Fast Delivery", desc: "Shipped from our warehouse" },
                { icon: RotateCcw, title: "Easy Returns", desc: "48-hour return window" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{title}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* New Arrivals */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">New Arrivals</h2>
              <p className="text-sm text-gray-400 mt-0.5">Fresh pieces, just listed</p>
            </div>
            <Link href="/catalogue" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">View All →</Link>
          </div>
          <HomeSection limit={4} />
        </section>

        {/* Shop by category */}
        <section className="bg-gray-50 py-12 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Shop by Category</h2>
              <p className="text-sm text-gray-400 mt-1">Find exactly what you&apos;re looking for</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-w-4xl mx-auto">
              {CATEGORIES.slice(0, 5).map(({ label, value }) => (
                <Link key={value} href={`/catalogue?category=${value}`}
                  className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all">
                  <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg bg-gray-100 text-sm font-bold text-gray-400">{label[0]}</span>
                  <span className="text-sm text-gray-700 font-medium leading-tight">{label}</span>
                </Link>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link href="/catalogue"
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-900 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm px-6 py-3 rounded-xl transition-all">
                See all categories →
              </Link>
            </div>
          </div>
        </section>

        {/* Trending Now */}
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
              <p className="text-sm text-gray-400 mt-0.5">Popular picks from our curators</p>
            </div>
            <Link href="/catalogue" className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">View All →</Link>
          </div>
          <HomeSection limit={4} offset={4} />
        </section>

        {/* Shop by Occasion */}
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Shop by Occasion</h2>
            <p className="text-sm text-gray-400 mt-1">The right piece for every moment</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {OCCASIONS.map((o) => (
              <Link
                key={o.label}
                href={o.href}
                className={`group relative overflow-hidden rounded-2xl p-6 h-40 flex flex-col justify-end bg-gradient-to-br ${o.bg}`}
              >
                <span className="text-white text-lg font-bold">{o.label}</span>
                <span className="text-white/80 text-xs mt-0.5">{o.desc}</span>
                <span className="absolute top-4 right-4 text-white/70 text-lg group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-gray-50 py-14 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Loved by our community</h2>
              <p className="text-sm text-gray-400 mt-1">Authentic African fashion, delivered with care</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {TESTIMONIALS.map((t) => (
                <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                  <p className="text-xs font-semibold text-gray-900 mt-4">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Seller CTA */}
        <section className="relative overflow-hidden bg-[#0f0f0f] py-24 px-4">
          {/* Background texture */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          {/* Glow blobs */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left: copy */}
              <div>
                <span className="inline-block text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">
                  Sell on Perfect Fit
                </span>
                <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                  Your wardrobe<br />
                  <span className="text-emerald-400">earns money.</span>
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8 max-w-sm">
                  Submit the pieces you no longer wear. We inspect, photograph, list, and ship them — you just collect the payout.
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <Link
                    href={process.env["NEXT_PUBLIC_SELLER_URL"] ?? "http://localhost:3002"}
                    className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-colors"
                  >
                    Start Selling →
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    How it works
                  </Link>
                </div>
              </div>

              {/* Right: steps */}
              <div className="grid grid-cols-1 gap-3">
                {[
                  { step: "01", title: "Submit your item", desc: "Tell us about the piece — photos, condition, your price." },
                  { step: "02", title: "We review & agree", desc: "Our team inspects and confirms a payout with you." },
                  { step: "03", title: "Ship it to us", desc: "Drop off your item at any courier. We cover the rest." },
                  { step: "04", title: "Get paid", desc: "Once it sells, your payout lands in your account." },
                ].map(({ step, title, desc }) => (
                  <div key={step} className="flex items-start gap-4 bg-white/5 hover:bg-white/[0.07] border border-white/10 rounded-2xl px-5 py-4 transition-colors">
                    <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 w-6 shrink-0">{step}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
