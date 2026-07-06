"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

function Verify() {
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [msg, setMsg] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) { setState("error"); setMsg("This verification link is missing its token."); return; }
    (async () => {
      try {
        const res = await fetch(`${API}/v1/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as { error?: { message?: string } };
        if (!res.ok || json.error) { setState("error"); setMsg(json.error?.message ?? "Could not verify your email."); return; }
        setState("ok");
      } catch {
        setState("error");
        setMsg("Something went wrong. Please try again.");
      }
    })();
  }, [token]);

  if (state === "loading") {
    return (
      <div className="text-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
        <p className="text-sm text-gray-500 mt-3">Verifying your email…</p>
      </div>
    );
  }

  if (state === "ok") {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Email verified</h2>
        <p className="text-sm text-gray-500 mt-1 mb-6">Your email is confirmed — your account is all set.</p>
        <Link href="/catalogue" className="inline-flex bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
        <XCircle className="h-6 w-6 text-red-500" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">Verification failed</h2>
      <p className="text-sm text-gray-500 mt-1 mb-6">{msg} You can request a new link from your account.</p>
      <Link href="/account/orders" className="inline-flex bg-gray-900 text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-gray-800 transition-colors">
        Go to my account
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <Suspense fallback={null}>
              <Verify />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
