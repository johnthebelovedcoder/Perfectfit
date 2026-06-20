"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BarChart3, Package, PlusCircle, Wallet, User, LogOut } from "lucide-react";
import { cn } from "@thread/ui";
import { clearAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/submissions", label: "My Submissions", icon: Package },
  { href: "/submissions/new", label: "Submit Item", icon: PlusCircle },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/profile", label: "Profile", icon: User },
];

export function SellerNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname === href || pathname.startsWith(href + "/")
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-4"
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </nav>
  );
}
