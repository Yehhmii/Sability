"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Map, MessageSquarePlus, ShieldAlert } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isReport = pathname.startsWith("/report");
  const isRoutes = pathname.startsWith("/routes");

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 rounded-full bg-[#121214] p-1.5 px-3 dock-shadow backdrop-blur-md border border-white/10 transition-all">
        {/* Home Tab */}
        <Link
          href="/"
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            isHome
              ? "bg-white text-gray-950 shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Home size={18} />
          {isHome && <span>Home</span>}
        </Link>

        {/* Report / Sabi Check Tab */}
        <Link
          href="/report"
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            isReport
              ? "bg-white text-gray-950 shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <MessageSquarePlus size={18} />
          {isReport && <span>Sabi Check</span>}
        </Link>

        {/* Routes Tab */}
        <Link
          href="/routes"
          className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
            isRoutes
              ? "bg-white text-gray-950 shadow-sm"
              : "text-gray-400 hover:text-white"
          }`}
        >
          <Map size={18} />
          {isRoutes && <span>My Roads</span>}
        </Link>
      </div>
    </nav>
  );
}
