"use client";

import { useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { subscribeToPush } from "@/lib/push";

export function EnableNotificationsButton() {
  const [status, setStatus] = useState<"idle" | "enabled" | "unavailable">("idle");

  async function handleClick() {
    const ok = await subscribeToPush();
    setStatus(ok ? "enabled" : "unavailable");
  }

  if (status === "enabled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
        <CheckCircle2 size={12} /> Push Enabled
      </span>
    );
  }

  if (status === "unavailable") {
    return <span className="text-[11px] text-gray-400">Unavailable on device</span>;
  }

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-900 transition hover:bg-gray-200 active:scale-95"
    >
      <Bell size={12} /> Enable
    </button>
  );
}
