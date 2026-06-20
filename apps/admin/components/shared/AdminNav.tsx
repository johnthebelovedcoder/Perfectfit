"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Inbox, Package, ShoppingBag, Wallet, Users, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/submissions", label: "Submissions", icon: Inbox },
  { href: "/items", label: "Catalogue", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/sellers", label: "Sellers", icon: Users },
  { href: "/security", label: "Security", icon: ShieldCheck },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
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
  );
}
