"use client";

import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { useCartStore } from "@/stores/cart.store";
import type { CatalogueItem } from "@thread/types";

interface Props {
  item: CatalogueItem;
}

export function AddToCartButton({ item }: Props) {
  const { items, addItem } = useCartStore();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = items.some((i) => i.item.id === item.id);

  const handleAdd = () => {
    addItem(item);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  if (inCart || justAdded) {
    return (
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default transition-all"
      >
        <Check className="h-4 w-4" />
        {justAdded ? "Added to Cart!" : "In Cart"}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 active:scale-[0.98] transition-all"
    >
      <ShoppingBag className="h-4 w-4" />
      Add to Cart
    </button>
  );
}
