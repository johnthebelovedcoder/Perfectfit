import Link from "next/link";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { CheckCircle, XCircle, Camera, Star, Shield } from "lucide-react";

const ACCEPTED = [
  "Clean, washed, and odour-free",
  "No visible stains or permanent marks",
  "No holes, tears, or broken fastenings",
  "Original shape retained — not stretched or misshapen",
  "Brand labels present (preferred but not required)",
];

const REJECTED = [
  "Items with strong odours or visible stains",
  "Heavy pilling or excessive wear",
  "Broken zips, missing buttons, or faulty fastenings",
  "Heavily altered or non-original items",
  "Underwear, swimwear, or pierced jewellery",
];

const CONDITIONS = [
  { label: "Brand New", color: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "Never worn. Tags may or may not be attached." },
  { label: "Excellent", color: "bg-green-50 text-green-700 border-green-200", desc: "Worn once or twice. No visible signs of wear." },
  { label: "Good", color: "bg-yellow-50 text-yellow-700 border-yellow-200", desc: "Gently used. Minor signs of wear, nothing distracting." },
  { label: "Fair", color: "bg-orange-50 text-orange-700 border-orange-200", desc: "Visible wear. Priced accordingly. All flaws disclosed." },
];

export default function QualityPromisePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Quality Promise</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Every item, inspected</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
            No item goes live on Perfect Fit without passing our quality check. We reject anything that doesn&apos;t meet our standards so you can shop with confidence.
          </p>
        </section>

        {/* Inspection process */}
        <section className="py-20 px-4 bg-white">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-12">
              <Shield className="h-8 w-8 text-emerald-500 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-gray-900">Our Inspection Process</h2>
              <p className="text-gray-400 mt-2">Every submission goes through a 4-point check before we accept it</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Camera, title: "Photo review", desc: "We examine every submitted photo for undisclosed flaws, inconsistencies, and misrepresentation." },
                { icon: CheckCircle, title: "Condition grading", desc: "Our team assigns a condition grade based on seller photos and description. Grades are cross-checked before publishing." },
                { icon: Star, title: "Brand verification", desc: "Where possible, we verify brand authenticity and flag any suspected fakes before listing." },
                { icon: Shield, title: "Listing approval", desc: "Every listing is manually approved. Automated listings are not permitted on Perfect Fit." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="border border-gray-100 rounded-2xl p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
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

        {/* Accepted / Not Accepted */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">What we accept</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <CheckCircle className="h-4 w-4 text-emerald-500" /> Accepted
                </p>
                <ul className="space-y-2">
                  {ACCEPTED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <p className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                  <XCircle className="h-4 w-4 text-red-400" /> Not Accepted
                </p>
                <ul className="space-y-2">
                  {REJECTED.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Condition grades */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">Condition grades explained</h2>
            <p className="text-center text-gray-400 text-sm mb-10">Every listing displays a condition grade so you know exactly what you&apos;re buying</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {CONDITIONS.map(({ label, color, desc }) => (
                <div key={label} className="flex items-start gap-4 border border-gray-100 rounded-2xl p-5">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0 mt-0.5 ${color}`}>{label}</span>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-4 bg-gray-900 text-center">
          <div className="container mx-auto max-w-xl">
            <h2 className="text-2xl font-bold text-white mb-3">Shop with confidence</h2>
            <p className="text-gray-400 text-sm mb-6">Every piece is inspected and graded before it&apos;s listed — so what you see is what you get.</p>
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 font-semibold px-7 py-3.5 rounded-xl text-sm hover:bg-gray-100 transition-colors"
            >
              Browse the collection →
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
