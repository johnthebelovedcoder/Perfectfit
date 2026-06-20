"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, CheckCircle } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { api } from "@/lib/api";
import { setAuth } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await api.post<{ accessToken: string; refreshToken: string; user: { id: string; email: string; role: string } }>(
        "/auth/login",
        { email, password }
      );
      if (result.user.role === "ADMIN") {
        window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3003";
      } else if (result.user.role === "SELLER") {
        window.location.href = process.env.NEXT_PUBLIC_SELLER_URL ?? "http://localhost:3002";
      } else {
        setAuth({ accessToken: result.accessToken, refreshToken: result.refreshToken, user: result.user });
        router.push("/account/orders");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-gray-50 min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Sign in to your Perfect Fit account</p>
        </div>

        {justRegistered && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 flex items-center gap-3 text-sm text-emerald-700">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Account created! You can sign in now.
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
                <Link href="#" className="text-xs text-gray-400 hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 pr-11"
                  placeholder="••••••••"
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
              <LogIn className="h-4 w-4" />
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              New to Perfect Fit?{" "}
              <Link href="/auth/register" className="text-gray-900 font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Seller separator */}
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
  );
}

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense>
        <LoginForm />
      </Suspense>
      <Footer />
    </>
  );
}
