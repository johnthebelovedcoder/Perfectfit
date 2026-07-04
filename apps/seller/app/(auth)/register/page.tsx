"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { RegisterSellerSchema } from "@thread/types";
import { setAuth } from "@/lib/auth";
import type { RegisterSeller } from "@thread/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

const inputCls =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterSeller>({
    resolver: zodResolver(RegisterSellerSchema),
  });

  const onSubmit = async (data: RegisterSeller) => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/v1/auth/register/seller`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json() as { data?: { accessToken: string; refreshToken: string; user: { id: string; email: string; role: string; emailVerified: boolean } }; error?: { message: string } };

      if (!res.ok || json.error) { setError(json.error?.message ?? "Registration failed"); return; }
      if (json.data!.user.role !== "SELLER") { setError("Registration error. Please contact support."); return; }
      setAuth({ accessToken: json.data!.accessToken, refreshToken: json.data!.refreshToken, user: json.data!.user });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Wordmark */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold tracking-tight">Perfect Fit</p>
          <h1 className="text-xl font-semibold text-gray-800 mt-4">Start selling on Perfect Fit</h1>
          <p className="text-sm text-gray-500 mt-1">Create your seller account to submit and track items</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">First Name</label>
                <input className={inputCls} {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Last Name</label>
                <input className={inputCls} {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <input type="email" autoComplete="email" className={inputCls} {...register("email")} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  autoComplete="new-password"
                  className={`${inputCls} pr-10`}
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPass((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600" aria-label={showPass ? "Hide password" : "Show password"}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Phone Number</label>
                <input type="tel" className={inputCls} {...register("phone")} />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">City</label>
                <input className={inputCls} {...register("city")} />
                {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
              </div>
            </div>

            {/* Bank details */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-sm font-semibold text-gray-800">Bank Details <span className="font-normal text-gray-400">(for payouts)</span></p>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Bank Name</label>
                <input className={inputCls} {...register("bankName")} />
                {errors.bankName && <p className="text-xs text-red-500">{errors.bankName.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Account Name</label>
                  <input className={inputCls} {...register("bankAccountName")} />
                  {errors.bankAccountName && <p className="text-xs text-red-500">{errors.bankAccountName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Account Number</label>
                  <input className={inputCls} {...register("bankAccountNumber")} />
                  {errors.bankAccountNumber && <p className="text-xs text-red-500">{errors.bankAccountNumber.message}</p>}
                </div>
              </div>
            </div>

            {error && <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600">{error}</div>}

            <button type="submit" disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3 rounded-xl text-sm transition-colors disabled:opacity-60">
              {isSubmitting ? "Creating Account..." : "Create Seller Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-gray-800 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
