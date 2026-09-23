"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  HelpCircle,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { Signal } from "@/lib/types";
import { THREAT_LABELS } from "@/lib/types";
import { formatClock, freshnessPct, relativeTime } from "@/lib/confidence";

export function LatestSignalCard({ signal }: { signal: Signal | null }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  if (!signal) {
    return (
      <div className="group relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white p-5 card-shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex items-start justify-between">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            Live Network Status
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-emerald-700 shadow-sm backdrop-blur-sm">
            <ShieldCheck size={18} />
          </div>
        </div>

        <div className="mt-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">
            All Monitored Corridors Clear
          </h2>
          <p className="mt-1.5 text-xs text-gray-600 line-clamp-2">
            No active road blocks, checkpoints, or security alerts reported across network routes in
            the last 24 hours.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-emerald-100/60 pt-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
            <Sparkles size={14} className="text-emerald-600" />
            <span>100% Safe Route Health</span>
          </div>

          <Link
            href="/report"
            className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white shadow-md transition-transform active:scale-95 hover:bg-black"
          >
            <span>Sabi Check</span>
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
              <ArrowRight size={12} />
            </div>
          </Link>
        </div>
      </div>
    );
  }

  const fresh = Math.round(freshnessPct(signal.last_verified_at, signal.decay_class));
  const isDisputed = signal.confidence_level === "disputed";
  const isHighCaution = signal.confidence_level === "high";

  // Score to 5.0 star scale
  const starRating = (
    signal.confidence_score ? Math.min(5, Math.max(3.5, signal.confidence_score * 5)) : 4.8
  ).toFixed(1);

  const themeGradient = isHighCaution
    ? "from-rose-500/10 via-amber-500/5 to-white border-rose-200"
    : isDisputed
    ? "from-purple-500/10 via-indigo-500/5 to-white border-purple-200"
    : "from-amber-500/10 via-yellow-500/5 to-white border-amber-200";

  const badgeColor = isHighCaution
    ? "bg-rose-50 text-rose-700 border-rose-200"
    : isDisputed
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${themeGradient} p-5 card-shadow-lg transition-all duration-300 hover:shadow-xl`}
    >
      {/* Background soft ambient decoration */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-amber-400/10 blur-2xl" />

      {/* Top row: Status pill & favorite icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${badgeColor}`}
          >
            <Radio size={12} className="animate-pulse" />
            <span>{isDisputed ? "Disputed Activity" : "Live Network Alert"}</span>
          </span>
          <span className="text-[11px] font-medium text-gray-500">
            {relativeTime(signal.last_verified_at)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex h-9 w-9 items-center justify-center rounded-full border border-gray-100 bg-white/90 shadow-sm backdrop-blur-sm transition active:scale-90 ${
            bookmarked ? "text-rose-500" : "text-gray-600 hover:text-gray-900"
          }`}
          aria-label="Bookmark signal"
        >
          <Bookmark size={16} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Main Signal Heading */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-gray-950">
            {signal.corridor_name}
          </h2>
          <div className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800 shadow-xs border border-gray-100">
            <span className="text-amber-500">★</span>
            <span>{starRating}</span>
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs font-medium text-gray-600">
          <span className="flex items-center gap-1 text-rose-600 font-semibold">
            {isDisputed ? <HelpCircle size={14} /> : <AlertTriangle size={14} />}
            {THREAT_LABELS[signal.threat_type] || "Incident reported"}
          </span>
          <span>•</span>
          <span className="capitalize">{signal.confidence_level} Confidence</span>
        </div>

        {signal.summary ? (
          <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-2">
            {signal.summary}
          </p>
        ) : (
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Reported on this corridor. Decaying live confidence rating.
          </p>
        )}
      </div>

      {/* Freshness Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={12} /> Verified at {formatClock(signal.last_verified_at)}
          </span>
          <span>{fresh}% Fresh</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-200/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              fresh > 60 ? "bg-emerald-500" : fresh > 30 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${fresh}%` }}
          />
        </div>
      </div>

      {/* Bottom Action Pill matching reference image */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <Users size={14} className="text-gray-400" />
          <span>
            <strong className="font-semibold text-gray-900">
              {signal.independent_report_count}
            </strong>{" "}
            independent {signal.independent_report_count === 1 ? "report" : "reports"}
          </span>
        </div>

        <Link
          href={`/signal/${signal.id}`}
          className="group/btn inline-flex items-center gap-2.5 rounded-full bg-[#121214] px-4 py-2 text-xs font-semibold text-white shadow-md transition-all active:scale-95 hover:bg-black"
        >
          <span>See details</span>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 transition-transform group-hover/btn:translate-x-0.5">
            <ArrowRight size={12} />
          </div>
        </Link>
      </div>
    </div>
  );
}
