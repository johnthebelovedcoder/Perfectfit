import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { RotateCcw, Clock, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export default function ReturnsPolicyPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Returns Policy</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">48-hour returns</h1>
          <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
            If your item isn&apos;t as described, you can return it within 48 hours of delivery — no awkward questions.
          </p>
        </section>

        {/* Window */}
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-2xl">
            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-10">
              <Clock className="h-8 w-8 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-emerald-900 text-lg">48-hour return window</p>
                <p className="text-emerald-700 text-sm mt-0.5">Your return window opens when your order is marked as delivered. You have 48 hours from that moment.</p>
              </div>
            </div>

            <div className="space-y-8 text-gray-700">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" /> What we accept returns for
                </h2>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {[
                    "Item significantly different from the listing description or photos",
                    "Undisclosed damage, stains, or defects not mentioned in the listing",
                    "Wrong item received",
                    "Item arrived damaged during shipping",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-400" /> What we don&apos;t accept returns for
                </h2>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {[
                    "Change of mind after purchase",
                    "Sizing issues (please check the listed measurements carefully before buying)",
                    "Minor wear consistent with the stated condition grade",
                    "Returns requested after the 48-hour window has closed",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-500" /> How to request a return
                </h2>
                <ol className="space-y-3 text-sm leading-relaxed">
                  {[
                    "Go to your order tracking page using the link in your confirmation email.",
                    'Click "Request Return" and describe the issue. Photos of the problem are required.',
                    "Our team reviews your request within 24 hours and emails you a prepaid return label if approved.",
                    "Drop off the item at any designated courier point within 3 days of approval.",
                    "Once received and inspected, a full refund is issued within 5–7 business days.",
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="font-bold text-gray-300 text-sm font-mono shrink-0">{String(i + 1).padStart(2, "0")}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5 text-sm">
                <p className="font-semibold text-gray-900 mb-1">Questions?</p>
                <p className="text-gray-500">
                  If you&apos;re unsure whether your issue qualifies, contact us before the window closes.{" "}
                  <Link href="/contact" className="text-emerald-600 hover:underline font-medium">Get in touch →</Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
