"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { AdminNav } from "./AdminNav";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} aria-hidden />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={`w-64 lg:w-60 shrink-0 bg-[#111111] flex flex-col z-50 transition-transform duration-200
          fixed inset-y-0 left-0 lg:static lg:min-h-screen lg:translate-x-0
          ${menuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              Back to Store
            </a>
            <button onClick={() => setMenuOpen(false)} className="lg:hidden text-gray-500 hover:text-white" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-white font-bold text-base mt-5">Perfect Fit</p>
          <p className="text-gray-500 text-xs mt-0.5">Admin Dashboard</p>
        </div>
        {/* Close the drawer when a nav link is tapped */}
        <div className="flex-1 px-3" onClick={() => setMenuOpen(false)}>
          <AdminNav />
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden min-w-0">
        <AdminHeader onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
