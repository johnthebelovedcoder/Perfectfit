"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogIn, LogOut, Heart, Package, ChevronDown, Store } from "lucide-react";
import { useAuth, clearAuth } from "@/lib/auth";

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const auth = useAuth();

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        aria-label="Account menu"
        aria-expanded={open}
      >
        <User className="h-5 w-5" />
        <ChevronDown className={`h-3 w-3 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Buyer account */}
          <div className="py-1">
            {auth ? (
              <>
                <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">{auth.user.email}</p>
                <Link
                  href="/account/orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Package className="h-4 w-4 text-gray-400" />
                  My Orders
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogIn className="h-4 w-4 text-gray-400" />
                Sign In
              </Link>
            )}
          </div>

          <div className="border-t border-gray-100 py-1">
            <p className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">Shopping</p>
            <Link
              href="/wishlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Heart className="h-4 w-4 text-gray-400" />
              My Wishlist
            </Link>
            <Link
              href="/order/track"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Package className="h-4 w-4 text-gray-400" />
              Track My Order
            </Link>
          </div>

          <div className="border-t border-gray-100 py-1">
            <Link
              href={`${process.env.NEXT_PUBLIC_SELLER_URL ?? "http://localhost:3002"}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Store className="h-4 w-4 text-gray-400" />
              <div>
                <p className="font-medium">Seller Portal</p>
                <p className="text-[11px] text-gray-400">Sell your clothes on Perfect Fit</p>
              </div>
            </Link>
          </div>

          {auth && (
            <div className="border-t border-gray-100 py-1">
              <button
                onClick={() => { clearAuth(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4 text-gray-400" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
