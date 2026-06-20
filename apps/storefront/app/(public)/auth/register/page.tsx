"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Buyer registration endpoint — to be wired when buyer auth is added to the API
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001"}/v1/auth/register/buyer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        }
      );
      if (!res.ok) {
        const json = await res.json() as { error?: { message?: string } };
        throw new Error(json.error?.message ?? "Registration failed.");
      }
      router.push("/auth/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="text-gray-400 text-sm mt-1">Shop smarter with a Perfect Fit account</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "firstName" as const, label: "First Name", placeholder: "Jane" },
                  { key: "lastName" as const, label: "Last Name", placeholder: "Doe" },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {label}
                    </label>
                    <input
                      value={form[key]}
                      onChange={set(key)}
                      required
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  autoComplete="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-11"
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-800 disabled:opacity-60 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? "Creating account…" : "Create Account"}
              </button>

              <p className="text-xs text-gray-400 text-center">
                By creating an account you agree to our{" "}
                <Link href="#" className="underline hover:text-gray-700">Terms</Link>{" "}
                and{" "}
                <Link href="#" className="underline hover:text-gray-700">Privacy Policy</Link>.
              </p>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-gray-900 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              Want to sell your clothes?{" "}
              <a
                href={process.env.NEXT_PUBLIC_SELLER_URL ?? "http://localhost:3002"}
                className="underline hover:text-gray-700"
              >
                Go to Seller Portal →
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
