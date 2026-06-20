"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, LogOut, Settings, ChevronDown } from "lucide-react";
import { clearAuth, getAuth } from "@/lib/auth";
import { NotificationBell } from "./NotificationBell";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/submissions": "Submissions",
  "/items": "Catalogue",
  "/orders": "Orders",
  "/payouts": "Payouts",
  "/sellers": "Sellers",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "Admin";
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

  const initials = email ? email.slice(0, 2).toUpperCase() : "AD";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
          {initials}
        </div>
        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">{email}</span>
        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
          <div className="px-3 py-2.5 border-b border-gray-50">
            <p className="text-xs text-gray-400">Signed in as</p>
            <p className="text-sm font-medium text-gray-800 truncate">{email}</p>
          </div>
          <a
            href="/sellers"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-4 w-4" /> Settings
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

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const title = getPageTitle(pathname);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    // Route search to relevant page
    if (pathname.startsWith("/submissions")) {
      router.push(`/submissions?search=${encodeURIComponent(search)}`);
    } else if (pathname.startsWith("/items")) {
      router.push(`/items?search=${encodeURIComponent(search)}`);
    } else if (pathname.startsWith("/sellers")) {
      router.push(`/sellers?search=${encodeURIComponent(search)}`);
    } else if (pathname.startsWith("/orders")) {
      router.push(`/orders?search=${encodeURIComponent(search)}`);
    } else {
      router.push(`/submissions?search=${encodeURIComponent(search)}`);
    }
  }

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center gap-4 px-6 shrink-0">
      {/* Page title */}
      <h1 className="text-sm font-semibold text-gray-900 w-28 shrink-0">{title}</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}…`}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-colors"
          />
        </div>
      </form>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
        <div className="w-px h-5 bg-gray-200 mx-2" />
        <UserMenu />
      </div>
    </header>
  );
}
