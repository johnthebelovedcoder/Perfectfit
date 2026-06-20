"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-xs font-medium text-white"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      You&apos;re offline — showing saved items. Cart is kept; checkout resumes when you reconnect.
    </div>
  );
}
