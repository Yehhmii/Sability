"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 mb-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 shadow-sm"
    >
      <WifiOff size={14} />
      <span>Offline mode — Showing cached road safety snapshots</span>
    </div>
  );
}
