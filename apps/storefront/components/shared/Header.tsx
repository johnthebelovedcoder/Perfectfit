"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Heart, Menu, X } from "lucide-react";
import { CartButton } from "./CartButton";
import { SearchModal } from "./SearchModal";
import { ProfileMenu } from "./ProfileMenu";
import { useWishlistStore } from "@/stores/wishlist.store";

// Curated top-nav subset (short labels). The full category list lives in the
// catalogue sidebar, homepage grid, and footer.
const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/catalogue", label: "Shop All" },
  { href: "/catalogue?category=WOMENS_AFRICAN_WEAR", label: "Women's" },
  { href: "/catalogue?category=MENS_AFRICAN_WEAR", label: "Men's" },
  { href: "/catalogue?category=CHILDRENS_AFRICAN_WEAR", label: "Children's" },
  { href: "/catalogue?category=ANKARA_OUTFITS", label: "Ankara" },
  { href: "/catalogue?category=ASO_OKE_ATTIRE", label: "Aso-Oke" },
];

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const wishlistCount = useWishlistStore((s) => s.items.length);

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-gray-900 text-white text-xs text-center py-2.5 px-4">
        Curated African fashion — every piece inspected & approved before it&apos;s listed
      </div>

      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="text-xl font-bold tracking-tight">
              Perfect Fit
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white font-bold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <ProfileMenu />
            <CartButton />
          </div>
        </div>

        {/* Mobile nav drawer */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <nav className="container mx-auto px-4 py-2 flex flex-col">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-sm font-medium text-gray-700 hover:text-gray-900 border-b border-gray-50 last:border-0"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
