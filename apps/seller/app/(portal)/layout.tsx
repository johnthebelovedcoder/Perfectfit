import { SellerSidebar } from "@/components/shared/SellerSidebar";
import { SellerHeader } from "@/components/shared/SellerHeader";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#f5f5f5]">
      <SellerSidebar />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <SellerHeader />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
