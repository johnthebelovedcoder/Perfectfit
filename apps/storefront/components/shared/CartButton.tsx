"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";

export function CartButton() {
  const items = useCartStore((s) => s.items);

  return (
    <Link href="/cart" className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
      <ShoppingBag className="h-5 w-5" />
      {items.length > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gray-900 text-[10px] text-white font-bold">
          {items.length}
        </span>
      )}
      <span className="sr-only">Cart ({items.length} items)</span>
    </Link>
  );
}
