"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, ChevronDown, Menu } from "lucide-react";
import { clearAuth, getAuth } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/analytics": "Analytics",
  "/submissions": "My Submissions",
  "/profile": "My Profile",
};

function getPageTitle(pathname: string): string {
  if (pathname === "/submissions/new") return "Submit Item";
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "Seller Portal";
}

function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth?.user?.email) setEmail(auth.user.email);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = email ? email.slice(0, 2).toUpperCase() : "SF";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[140px] truncate">
          {email}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-gray-50">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-gray-800 truncate">{email}</p>
          </div>
          <a
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <User className="h-4 w-4" /> My Profile
          </a>
          <button
            onClick={() => { clearAuth(); router.push("/login"); }}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export function SellerHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-3 px-4 sm:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-semibold text-gray-900 shrink-0">{title}</h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <NotificationBell />
        <div className="w-px h-5 bg-gray-200 mx-2" />
        <UserMenu />
      </div>
    </header>
  );
}
