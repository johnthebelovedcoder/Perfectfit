import { PortalShell } from "@/components/shared/PortalShell";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>;
}
