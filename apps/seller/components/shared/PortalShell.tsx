"use client";

import { useState } from "react";
import { SellerSidebar } from "./SellerSidebar";
import { SellerHeader } from "./SellerHeader";

export function PortalShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <SellerSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden min-w-0">
        <SellerHeader onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
