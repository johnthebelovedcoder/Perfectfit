"use client";

import { useState } from "react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { Mail, MessageSquare, Clock, CheckCircle } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate submission — wire to email/CRM in production
    await new Promise((r) => setTimeout(r, 800));
    setSubmitted(true);
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-gray-900 text-white py-20 px-4 text-center">
          <p className="text-xs font-semibold tracking-widest text-emerald-400 uppercase mb-4">Contact Us</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">We&apos;re here to help</h1>
          <p className="text-gray-400 max-w-md mx-auto text-base">
            Questions about an order, a listing, or anything else — send us a message and we&apos;ll get back to you quickly.
          </p>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="grid sm:grid-cols-3 gap-6 mb-12">
              {[
                { icon: Mail, title: "Email", value: "hello@perfectfit.com", desc: "For general enquiries" },
                { icon: MessageSquare, title: "Seller Support", value: "sellers@perfectfit.com", desc: "For seller-specific questions" },
                { icon: Clock, title: "Response time", value: "Within 24 hours", desc: "Mon–Fri, 9am–6pm" },
              ].map(({ icon: Icon, title, value, desc }) => (
                <div key={title} className="bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center">
                  <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{title}</p>
                  <p className="font-semibold text-gray-900 mt-1">{value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
              ))}
            </div>

            {/* Form */}
            <div className="max-w-xl mx-auto">
              {submitted ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h2>
                  <p className="text-gray-500 text-sm">We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8 space-y-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-2">Send us a message</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</label>
                      <input
                        required
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</label>
                    <select
                      value={form.subject}
                      onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                    >
                      <option value="">Select a topic…</option>
                      <option>Order issue</option>
                      <option>Return request</option>
                      <option>Seller enquiry</option>
                      <option>Listing question</option>
                      <option>Payment / payout</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                      placeholder="Describe your issue or question in detail…"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
                  >
                    {loading ? "Sending…" : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
