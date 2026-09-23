"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  Clock,
  HelpCircle,
  History,
  Layers,
  MapPin,
  Radio,
  Share2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { VerifyButton } from "@/components/verify-button";
import {
  explainConfidence,
  formatClock,
  freshnessPct,
  isExpiring,
  minutesSince,
  relativeTime,
} from "@/lib/confidence";
import { THREAT_LABELS, type Signal } from "@/lib/types";

interface TimelineRow {
  id: string;
  raw_input_type: "text" | "voice" | "tap";
  relationship: string | null;
  created_at: string;
}

const RELATIONSHIP_LABEL: Record<string, { title: string; desc: string; icon: string }> = {
  corroborates: {
    title: "Ground Corroboration",
    desc: "Confirmed an existing ground report from another traveler",
    icon: "✓",
  },
  new_detail: {
    title: "Detail Added",
    desc: "Added specific location or checkpoint timing",
    icon: "+",
  },
  duplicate: {
    title: "Duplicate Report",
    desc: "Repeated existing known incident",
    icon: "↺",
  },
  contradicts: {
    title: "Conflicting Report",
    desc: "Traveler reported road was clear / contradicted caution",
    icon: "!",
  },
  new_event: {
    title: "Initial Alert",
    desc: "First report submitted for this incident",
    icon: "★",
  },
  too_old: {
    title: "Past Event",
    desc: "Described an event from hours ago that has since cleared",
    icon: "⏱",
  },
  weak_source: {
    title: "Secondhand Rumor",
    desc: "Unconfirmed secondhand account",
    icon: "?",
  },
};

export default function SignalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAnonymousAuth();
  const [signal, setSignal] = useState<Signal | null>(null);
  const [timeline, setTimeline] = useState<TimelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "confidence">("overview");

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function load() {
      const [{ data: sig }, { data: rows }] = await Promise.all([
        supabase.from("signals").select("*").eq("id", id).single(),
        // report_timeline is a public view exposing only relationship + timing — never reporter
        supabase
          .from("report_timeline")
          .select("*")
          .eq("signal_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (!mounted) return;
      setSignal((sig as Signal) ?? null);
      setTimeline((rows as TimelineRow[]) ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel(`signal-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "signals", filter: `id=eq.${id}` },
        (payload) => setSignal(payload.new as Signal)
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
        <p className="text-xs text-gray-500">Loading live signal intelligence…</p>
      </div>
    );
  }

  if (!signal) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm font-semibold text-gray-900">Signal not found or expired</p>
        <button
          onClick={() => router.push("/")}
          className="rounded-full bg-gray-950 px-5 py-2 text-xs font-semibold text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  const fresh = Math.round(freshnessPct(signal.last_verified_at, signal.decay_class));
  const expiring = isExpiring(signal);
  const isDisputed = signal.confidence_level === "disputed";

  return (
    <div className="flex flex-col gap-4 pb-20">
      {/* Top Header Bar with circular back and bookmark buttons */}
      <header className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-800 card-shadow transition hover:bg-gray-50 active:scale-95"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-bold text-gray-950">{signal.corridor_name}</h1>
          <p className="text-[11px] text-gray-500">
            Updated {relativeTime(signal.last_verified_at)}
          </p>
        </div>

        <button
          onClick={() => setBookmarked(!bookmarked)}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-white card-shadow transition hover:bg-gray-50 active:scale-95 ${
            bookmarked ? "text-rose-500" : "text-gray-700"
          }`}
          aria-label="Save signal"
        >
          <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        </button>
      </header>

      {/* Hero Status Card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-5 card-shadow-lg">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isDisputed
                ? "bg-purple-100 text-purple-700"
                : signal.confidence_level === "high"
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isDisputed ? <HelpCircle size={13} /> : <AlertTriangle size={13} />}
            <span>{isDisputed ? "DISPUTED ROAD" : "CAUTION ACTIVE"}</span>
          </span>

          <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-800">
            <span className="text-amber-500">★</span>
            <span>
              {(signal.confidence_score
                ? Math.min(5, Math.max(3.5, signal.confidence_score * 5))
                : 4.8
              ).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <h2 className="text-lg font-bold text-gray-950">
            {THREAT_LABELS[signal.threat_type] || "Incident reported"}
          </h2>
          <p className="mt-1 text-xs text-gray-600 leading-relaxed">
            {signal.summary || "Live caution signal active on this corridor."}
          </p>
        </div>

        {/* Freshness Bar */}
        <div className="mt-4 rounded-2xl bg-gray-50 p-3 border border-gray-100">
          <div className="flex items-center justify-between text-xs font-medium text-gray-600">
            <span className="flex items-center gap-1.5">
              <Clock size={13} /> Verified at {formatClock(signal.last_verified_at)}
            </span>
            <span className="font-bold text-gray-900">{fresh}% Fresh</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200/70">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fresh > 60 ? "bg-emerald-500" : fresh > 30 ? "bg-amber-500" : "bg-rose-500"
              }`}
              style={{ width: `${fresh}%` }}
            />
          </div>
        </div>
      </div>

      {/* Pill tabs matching reference design */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab("overview")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "overview"
              ? "bg-gray-950 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80"
          }`}
        >
          Overview & Stats
        </button>
        <button
          onClick={() => setActiveTab("timeline")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "timeline"
              ? "bg-gray-950 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80"
          }`}
        >
          Timeline History ({timeline.length})
        </button>
        <button
          onClick={() => setActiveTab("confidence")}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "confidence"
              ? "bg-gray-950 text-white shadow-sm"
              : "bg-white text-gray-600 border border-gray-200/80"
          }`}
        >
          Confidence Model
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow">
              <span className="text-[11px] font-medium text-gray-500">Independent Reports</span>
              <p className="mt-1 text-lg font-bold text-gray-950">
                {signal.independent_report_count}
              </p>
              <span className="text-[10px] text-emerald-600 font-medium">Verified travelers</span>
            </div>

            <div className="rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow">
              <span className="text-[11px] font-medium text-gray-500">Trusted Local Sources</span>
              <p className="mt-1 text-lg font-bold text-gray-950">
                {signal.trusted_source_count}
              </p>
              <span className="text-[10px] text-gray-400 font-medium">Vetted tier accounts</span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Plain Language Breakdown
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-gray-800">
              {explainConfidence(signal)}
            </p>
          </div>
        </div>
      )}

      {/* Tab: Timeline History (Itinerary-style cards like phone 3 in screenshot) */}
      {activeTab === "timeline" && (
        <div className="flex flex-col gap-2.5">
          {timeline.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-xs text-gray-500">
              No report history events recorded yet.
            </div>
          ) : (
            timeline.map((row, idx) => {
              const rel = row.relationship
                ? RELATIONSHIP_LABEL[row.relationship] || {
                    title: "Report Logged",
                    desc: row.relationship,
                    icon: "•",
                  }
                : {
                    title: "Signal Report Logged",
                    desc: "Logged into the realtime fusion engine",
                    icon: "•",
                  };

              return (
                <div
                  key={row.id}
                  className="rounded-2xl border border-gray-200/80 bg-white p-3.5 card-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-800">
                        {rel.icon}
                      </span>
                      <span className="text-xs font-bold text-gray-900">{rel.title}</span>
                    </div>
                    <span className="text-[11px] font-medium text-gray-400">
                      {relativeTime(row.created_at)}
                    </span>
                  </div>
                  <p className="mt-1.5 pl-8 text-xs text-gray-600">{rel.desc}</p>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab: Confidence Model */}
      {activeTab === "confidence" && (
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow space-y-3">
          <div>
            <span className="text-[11px] font-semibold text-gray-500">Decay Class</span>
            <p className="text-xs font-bold text-gray-900 capitalize">
              {signal.decay_class} Decay
            </p>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <span className="text-[11px] font-semibold text-gray-500">Public Corroboration</span>
            <p className="text-xs font-bold text-gray-900 capitalize">
              {signal.public_corroboration}
            </p>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <span className="text-[11px] font-semibold text-gray-500">Source Type</span>
            <p className="text-xs font-bold text-gray-900 capitalize">
              {signal.source === "human" ? "On-ground Human Witness" : "Public News Ingestion"}
            </p>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Button matching Book A Tour in reference */}
      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto max-w-md px-4 pointer-events-none">
        <div className="pointer-events-auto">
          <VerifyButton
            signalId={signal.id}
            userId={user?.id ?? null}
            className="w-full rounded-full bg-gray-950 py-3.5 text-xs font-bold text-white shadow-xl hover:bg-black active:scale-98"
          />
        </div>
      </div>
    </div>
  );
}
