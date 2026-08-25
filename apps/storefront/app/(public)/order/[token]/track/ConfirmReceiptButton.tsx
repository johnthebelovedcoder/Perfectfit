"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";

/** Buyer confirms they received the order — this releases the seller's payout. */
export function ConfirmReceiptButton({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function confirm() {
    setState("pending");
    try {
      const res = await fetch(`${API_URL}/v1/orders/${token}/received`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json() as { message?: string; error?: { message?: string } };
        throw new Error(body.error?.message ?? body.message ?? "Request failed");
      }
      setState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="w-full rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm text-emerald-700 font-medium">
        ✅ Thanks for confirming — enjoy your order!
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <button
        onClick={confirm}
        disabled={state === "pending"}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        <CheckCircle className="h-4 w-4" />
        {state === "pending" ? "Confirming…" : "I've received my order"}
      </button>
      {state === "error" && <p className="text-xs text-red-500 text-center">{errorMsg}</p>}
      <p className="text-[11px] text-gray-400 text-center">Confirming lets us release payment to the seller.</p>
    </div>
  );
}
