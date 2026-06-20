import { AdminNav } from "@/components/shared/AdminNav";
import { AdminHeader } from "@/components/shared/AdminHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-[#111111] flex flex-col min-h-screen">
        <div className="px-5 pt-6 pb-4">
          <a
            href="/"
            className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 mb-5 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Store
          </a>
          <p className="text-white font-bold text-base">Perfect Fit</p>
          <p className="text-gray-500 text-xs mt-0.5">Admin Dashboard</p>
        </div>
        <div className="flex-1 px-3">
          <AdminNav />
        </div>
      </aside>

      {/* Main column: header + page content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
