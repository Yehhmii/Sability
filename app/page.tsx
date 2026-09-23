"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  CheckCircle2,
  HelpCircle,
  Plus,
  Radio,
  Search,
  SlidersHorizontal,
  User,
  X,
} from "lucide-react";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { useRoutes } from "@/hooks/use-routes";
import { useSignalsForRoutes } from "@/hooks/use-signal-realtime";
import { RouteList } from "@/components/route-list";
import { LatestSignalCard } from "@/components/latest-signal-card";
import { EnableNotificationsButton } from "@/components/enable-notifications-button";
import { THREAT_LABELS, type Signal } from "@/lib/types";
import { formatClock, freshnessPct, relativeTime } from "@/lib/confidence";

/** Small card used in search results overlay */
function SignalSearchCard({ signal }: { signal: Signal }) {
  const fresh = Math.round(freshnessPct(signal.last_verified_at, signal.decay_class));
  const isDisputed = signal.confidence_level === "disputed";

  return (
    <Link
      href={`/signal/${signal.id}`}
      className="flex items-start gap-3 rounded-2xl border border-gray-200/80 bg-white p-3.5 card-shadow transition hover:border-gray-300 hover:shadow-md"
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white ${
          isDisputed
            ? "bg-purple-500"
            : signal.confidence_level === "high"
            ? "bg-rose-500"
            : signal.confidence_level === "medium"
            ? "bg-amber-500"
            : "bg-blue-500"
        }`}
      >
        {isDisputed ? <HelpCircle size={15} /> : <AlertTriangle size={15} />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xs font-bold text-gray-900 line-clamp-1">{signal.corridor_name}</h3>
          <span className="shrink-0 text-[11px] font-medium text-gray-400">
            {relativeTime(signal.last_verified_at)}
          </span>
        </div>
        <p className="text-[11px] font-medium text-gray-600">
          {THREAT_LABELS[signal.threat_type]} · {fresh}% fresh
        </p>
        {signal.summary && (
          <p className="mt-0.5 text-[11px] text-gray-500 line-clamp-1">{signal.summary}</p>
        )}
      </div>

      <ArrowRight size={14} className="mt-1 shrink-0 text-gray-400" />
    </Link>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAnonymousAuth();
  const { routes, loading: routesLoading } = useRoutes(user?.id ?? null);
  const { pairs, latestSignal, allActiveSignals, loading: signalsLoading } = useSignalsForRoutes(routes);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const loading = authLoading || routesLoading || (routes.length > 0 && signalsLoading);

  // Filter active signals by search query across corridor, threat type, and summary
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    return allActiveSignals.filter(
      (s) =>
        s.corridor_name.toLowerCase().includes(q) ||
        THREAT_LABELS[s.threat_type]?.toLowerCase().includes(q) ||
        s.summary?.toLowerCase().includes(q)
    );
  }, [searchQuery, allActiveSignals]);

  const showSearchOverlay = searchFocused && searchQuery.trim().length >= 2;

  return (
    <div className="flex flex-col gap-5">
      {/* Top Header */}
      <header className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">Hello, Traveler</h1>
          <p className="text-xs font-medium text-gray-500">Live Road Intelligence & Decay Signals</p>
        </div>

        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-200 via-amber-100 to-teal-100 p-0.5 shadow-sm">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
              <User size={19} className="text-gray-800" />
            </div>
          </div>
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
        </div>
      </header>

      {/* Search Bar — functional, filters allActiveSignals */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="pointer-events-none absolute left-4 text-gray-400">
            <Search size={18} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Search corridors, highways, threats..."
            className="w-full rounded-full border border-gray-200/90 bg-white py-3 pl-11 pr-12 text-xs font-medium text-gray-900 placeholder:text-gray-400 card-shadow focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300"
            >
              <X size={14} />
            </button>
          ) : (
            <div className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-950 text-white shadow-sm">
              <SlidersHorizontal size={14} />
            </div>
          )}
        </div>

        {/* Search Results Overlay */}
        {showSearchOverlay && (
          <div className="absolute top-full left-0 right-0 z-30 mt-2 flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl">
            {searchResults.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <CheckCircle2 size={20} className="text-gray-300" />
                <p className="text-xs font-semibold text-gray-400">
                  No active signals match &quot;{searchQuery}&quot;
                </p>
                <p className="text-[11px] text-gray-400">
                  This corridor appears clear, or no signals are active.
                </p>
              </div>
            ) : (
              <>
                <p className="px-1 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {searchResults.length} Active Signal{searchResults.length !== 1 ? "s" : ""} Found
                </p>
                {searchResults.map((s) => (
                  <SignalSearchCard key={s.id} signal={s} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Hero Section: Most Recent Signal across Network */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Radio size={14} className="animate-pulse text-rose-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900">
              Live Network Activity
            </h2>
          </div>
          {/* <span className="text-[11px] font-medium text-gray-500">
            {allActiveSignals.length > 0
              ? `${allActiveSignals.length} Active Signal${allActiveSignals.length !== 1 ? "s" : ""}`
              : "All Clear"}
          </span> */}
        </div>

        {/* Hero Card — latest signal even if not on user's saved route */}
        <LatestSignalCard signal={latestSignal} />
      </section>

      {/* Section: Your Saved Roads with per-route signal status */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">Your Saved Roads</h2>
            <p className="text-[11px] text-gray-500">
              {pairs.filter((p) => p.signal !== null).length > 0
                ? `${pairs.filter((p) => p.signal !== null).length} route${pairs.filter((p) => p.signal !== null).length !== 1 ? "s" : ""} with active alerts`
                : "All routes monitoring — no alerts right now"}
            </p>
          </div>

          <Link
            href="/routes/new"
            className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 hover:underline"
          >
            <Plus size={14} />
            <span>Add Road</span>
          </Link>
        </div>

        <RouteList pairs={pairs} userId={user?.id ?? null} loading={loading} />
      </section>

      {/* Push notification row */}
      <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-3 card-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <Bell size={13} />
            </div>
            <span className="text-xs font-medium text-gray-700">Realtime Push Alerts</span>
          </div>
          <EnableNotificationsButton />
        </div>
      </div>
    </div>
  );
}
