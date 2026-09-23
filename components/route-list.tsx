"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Compass, MapPin, Plus, ShieldCheck, Sparkles } from "lucide-react";
import { SignalCard } from "@/components/signal-card";
import type { RouteWithSignal } from "@/lib/types";

type FilterType = "all" | "alerts" | "clear";

export function RouteList({
  pairs,
  userId,
  loading,
}: {
  pairs: RouteWithSignal[];
  userId: string | null;
  loading: boolean;
}) {
  const [filter, setFilter] = useState<FilterType>("all");

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-28 w-full animate-pulse rounded-2xl bg-gray-200/70" />
        <div className="h-28 w-full animate-pulse rounded-2xl bg-gray-200/70" />
      </div>
    );
  }

  if (pairs.length === 0) {
    return (
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 text-center card-shadow">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 shadow-inner">
          <Compass size={28} className="text-gray-900" />
        </div>
        <h3 className="mt-3.5 text-base font-bold text-gray-900">No roads saved yet</h3>
        <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
          Save the highways or daily routes you travel. Sabi will give you live, honestly-decaying safety confidence signals.
        </p>

        <Link
          href="/routes/new"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#121214] px-5 py-2.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 hover:bg-black"
        >
          <Plus size={15} />
          <span>Add a road you travel</span>
        </Link>
      </div>
    );
  }

  // Filter pairs
  const filteredPairs = pairs.filter((pair) => {
    if (filter === "alerts") return pair.signal !== null;
    if (filter === "clear") return pair.signal === null;
    return true;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "all"
              ? "bg-[#121214] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50"
          }`}
        >
          All Roads ({pairs.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("alerts")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "alerts"
              ? "bg-[#121214] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50"
          }`}
        >
          Active Alerts ({pairs.filter((p) => p.signal !== null).length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("clear")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filter === "clear"
              ? "bg-[#121214] text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-50"
          }`}
        >
          All Clear ({pairs.filter((p) => p.signal === null).length})
        </button>
      </div>

      {filteredPairs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 p-6 text-center text-xs text-gray-500">
          No roads match this filter.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredPairs.map((pair) => (
            <SignalCard
              key={pair.route.id}
              label={pair.route.label}
              signal={pair.signal}
              cachedAt={pair.cachedAt}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
