"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@thread/ui";
import { RegisterSellerSchema } from "@thread/types";
import { setAuth } from "@/lib/auth";
import type { RegisterSeller } from "@thread/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

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

      if (!res.ok || json.error) {
        setError(json.error?.message ?? "Registration failed");
        return;
      }

      if (json.data!.user.role !== "SELLER") { setError("Registration error. Please contact support."); return; }
      setAuth({ accessToken: json.data!.accessToken, refreshToken: json.data!.refreshToken, user: json.data!.user });
      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="text-2xl font-bold mb-4">Perfect Fit</div>
          <CardTitle>Start selling on Perfect Fit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" {...register("firstName")} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" {...register("lastName")} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium">Bank Details (for payouts)</p>
              <div className="space-y-1.5">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" {...register("bankName")} />
                {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccountName">Account Name</Label>
                <Input id="bankAccountName" {...register("bankAccountName")} />
                {errors.bankAccountName && <p className="text-xs text-destructive">{errors.bankAccountName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input id="bankAccountNumber" {...register("bankAccountNumber")} />
                {errors.bankAccountNumber && <p className="text-xs text-destructive">{errors.bankAccountNumber.message}</p>}
              </div>
            </div>

            {error && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Create Seller Account"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-foreground">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
