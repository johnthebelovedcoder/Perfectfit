"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, PlusCircle, Package, X } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/submissions", label: "My Submissions", icon: Package },
  { href: "/submissions/new", label: "Submit Item", icon: PlusCircle },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SellerSidebar({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden />
      )}

      <aside
        className={`w-64 sm:w-56 shrink-0 bg-[#111111] flex flex-col z-50 transition-transform duration-200
          fixed inset-y-0 left-0 lg:static lg:min-h-screen lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <a
              href={process.env["NEXT_PUBLIC_STOREFRONT_URL"] ?? "http://localhost:3000"}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Store
            </a>
            {/* Close (mobile only) */}
            <button onClick={onClose} className="lg:hidden text-gray-500 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-white font-bold text-base mt-5">Perfect Fit</p>
          <p className="text-gray-500 text-xs mt-0.5">Seller Portal</p>
        </div>

        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              href === "/submissions/new"
                ? pathname === href
                : pathname === href ||
                  (href !== "/dashboard" &&
                    pathname.startsWith(href + "/") &&
                    !pathname.startsWith("/submissions/new"));
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
