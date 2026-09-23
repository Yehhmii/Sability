"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  HelpCircle,
  Radio,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import {
  confidenceLabel,
  formatClock,
  freshnessPct,
  isExpiring,
  minutesSince,
  relativeTime,
} from "@/lib/confidence";
import { THREAT_LABELS, type ConfidenceLevel, type Signal } from "@/lib/types";
import { VerifyButton } from "@/components/verify-button";

const CONFIDENCE_BADGE_STYLE: Record<ConfidenceLevel, { bg: string; text: string; border: string }> = {
  high: {
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  medium: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  low: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  disputed: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
};

export function SignalCard({
  label,
  signal,
  cachedAt,
  userId,
  linkToDetail = true,
}: {
  /** Route label (home screen) or the signal's own corridor name (detail screen). */
  label: string;
  signal: Signal | null;
  cachedAt?: string;
  userId: string | null;
  linkToDetail?: boolean;
}) {
  // Recompute freshness every 20s so it visibly ticks down without a network round-trip.
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  const body = signal ? (
    <CautionBody signal={signal} userId={userId} stale={Boolean(cachedAt)} />
  ) : (
    <ClearBody cachedAt={cachedAt} />
  );

  const inner = (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow state-transition hover:border-gray-300 hover:shadow-md">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gray-900">{label}</span>
          {signal && (
            <span className="text-[11px] font-medium text-gray-500">• {signal.corridor_name}</span>
          )}
        </div>
        {cachedAt ? (
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
            <WifiOff size={11} /> cached
          </span>
        ) : (
          signal && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-gray-500">
              <span className="text-amber-500">★</span>
              <span>{(signal.confidence_score ? Math.min(5, Math.max(3.5, signal.confidence_score * 5)) : 4.8).toFixed(1)}</span>
            </div>
          )
        )}
      </div>

      {body}

      {linkToDetail && signal && (
        <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-2.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-900 group-hover:underline">
            View report analysis <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      )}
    </div>
  );

  if (!linkToDetail || !signal) return inner;

  return (
    <Link href={`/signal/${signal.id}`} className="block">
      {inner}
    </Link>
  );
}

function ClearBody({ cachedAt }: { cachedAt?: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-emerald-50/60 p-3 border border-emerald-100">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 size={18} />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">All Clear — Nothing reported</p>
        <p className="text-xs text-gray-500">
          {cachedAt ? `Last known clear as of ${relativeTime(cachedAt)}` : "Verified clear right now"}
        </p>
      </div>
    </div>
  );
}

function CautionBody({
  signal,
  userId,
  stale,
}: {
  signal: Signal;
  userId: string | null;
  stale: boolean;
}) {
  const fresh = Math.round(freshnessPct(signal.last_verified_at, signal.decay_class));
  const expiring = !stale && isExpiring(signal);
  const Icon = signal.confidence_level === "disputed" ? HelpCircle : AlertTriangle;
  const badgeStyle = CONFIDENCE_BADGE_STYLE[signal.confidence_level] || CONFIDENCE_BADGE_STYLE.medium;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            <Icon size={13} />
            <span>{signal.confidence_level === "disputed" ? "DISPUTED" : "CAUTION"}</span>
          </span>
          <span className="text-xs font-semibold text-gray-800">
            {THREAT_LABELS[signal.threat_type]}
          </span>
        </div>

        <span className="text-[11px] font-medium text-gray-500">
          {fresh}% fresh
        </span>
      </div>

      {signal.summary && (
        <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-2">
          {signal.summary}
        </p>
      )}

      {/* Freshness progress bar */}
      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fresh > 60 ? "bg-emerald-500" : fresh > 30 ? "bg-amber-500" : "bg-rose-500"
            }`}
            style={{ width: `${fresh}%` }}
          />
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={12} /> {formatClock(signal.last_verified_at)}
        </span>
        <span>
          {signal.independent_report_count} report
          {signal.independent_report_count === 1 ? "" : "s"}
          {signal.trusted_source_count > 0 && ` (${signal.trusted_source_count} trusted)`}
        </span>
      </div>

      {expiring && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50/70 p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700">
            <Radio size={14} className="animate-pulse" />
            <span>SIGNAL EXPIRING — NEEDS RE-VERIFICATION</span>
          </div>
          <p className="mt-1 text-xs text-gray-700">
            Report is now {minutesSince(signal.last_verified_at)}m old. Are you near this road?
          </p>
          <VerifyButton signalId={signal.id} userId={userId} className="mt-2.5 w-full" />
        </div>
      )}
    </div>
  );
}
