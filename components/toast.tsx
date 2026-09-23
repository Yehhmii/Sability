"use client";

import { CheckCircle2 } from "lucide-react";

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gray-800 bg-gray-950 px-5 py-2.5 text-xs font-semibold text-white shadow-2xl transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100 scale-100" : "pointer-events-none translate-y-3 opacity-0 scale-95"
      }`}
    >
      <CheckCircle2 size={16} className="text-emerald-400" />
      <span>{message}</span>
    </div>
  );
}
