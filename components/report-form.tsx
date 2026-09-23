"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MapPin,
  Mic,
  Radio,
  SearchIcon,
  Sparkles,
  Type,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VoiceRecorder } from "@/components/voice-recorder";
import type { Report, Route } from "@/lib/types";

type Mode = "text" | "voice";
type Stage = "idle" | "transcribing" | "checking" | "done" | "error";

interface GeoResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

/** Search Nominatim for a place name and return candidate results. */
async function searchLocation(query: string): Promise<GeoResult[]> {
  if (!query.trim() || query.trim().length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim()
    )}&addressdetails=0&limit=5&countrycodes=ng`;
    const res = await fetch(url, {
      headers: { "Accept-Language": "en" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as GeoResult[];
    if (data.length > 0) return data;

    // Fallback: search without strict countrycode restriction
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query.trim() + " Nigeria"
    )}&addressdetails=0&limit=5`;
    const fallbackRes = await fetch(fallbackUrl, {
      headers: { "Accept-Language": "en" },
    });
    if (!fallbackRes.ok) return [];
    return (await fallbackRes.json()) as GeoResult[];
  } catch {
    return [];
  }
}

const POPULAR_LOCATIONS = [
  { name: "Kaduna-Abuja Expressway", lat: 9.62, lng: 7.43 },
  { name: "Lagos-Ibadan Expressway", lat: 6.89, lng: 3.65 },
  { name: "Benin-Ore Highway", lat: 6.74, lng: 4.88 },
  { name: "Abuja Central / Toll Gate", lat: 9.0765, lng: 7.3986 },
  { name: "Jaji / Zaria Corridor", lat: 10.82, lng: 7.71 },
];

function LocationSearch({
  onSelect,
  selectedName,
  onClear,
}: {
  onSelect: (name: string, lat: number, lng: number) => void;
  selectedName: string | null;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(val: string) {
    setQuery(val);
    setHasSearched(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim() || val.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const found = await searchLocation(val);
      setResults(found);
      setSearching(false);
      setHasSearched(true);
    }, 350);
  }

  function confirmCustomLocation(customName: string) {
    if (!customName.trim()) return;
    const match = results[0];
    const lat = match ? parseFloat(match.lat) : 9.0765;
    const lng = match ? parseFloat(match.lon) : 7.3986;
    onSelect(customName.trim(), lat, lng);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  }

  if (selectedName) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-800">
          <MapPin size={14} className="text-emerald-600 shrink-0" />
          <span className="line-clamp-1">{selectedName}</span>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="ml-2 shrink-0 rounded-full p-0.5 text-emerald-700 hover:bg-emerald-200 transition"
          aria-label="Clear location"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-2">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {searching ? <Loader2 size={15} className="animate-spin text-gray-700" /> : <SearchIcon size={15} />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim()) confirmCustomLocation(query);
            }
          }}
          placeholder="Search town, highway or area (e.g. Jaji, Kaduna Expressway)..."
          className="w-full rounded-xl border border-gray-200 bg-gray-50/70 py-2.5 pl-9 pr-24 text-xs font-medium text-gray-950 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition"
        />
        {query.trim().length > 0 && (
          <button
            type="button"
            onClick={() => confirmCustomLocation(query)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-gray-950 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-black transition active:scale-95"
          >
            Use this
          </button>
        )}
      </div>

      {/* Popular locations quick pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Popular:</span>
        {POPULAR_LOCATIONS.map((loc) => (
          <button
            key={loc.name}
            type="button"
            onClick={() => onSelect(loc.name, loc.lat, loc.lng)}
            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700 hover:bg-gray-200 transition"
          >
            + {loc.name}
          </button>
        ))}
      </div>

      {/* Search results dropdown */}
      {(results.length > 0 || (hasSearched && query.trim().length >= 2)) && (
        <div className="absolute top-11 left-0 right-0 z-30 mt-1 rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
          {results.length > 0 ? (
            results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => {
                  onSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon));
                  setQuery("");
                  setResults([]);
                  setHasSearched(false);
                }}
                className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 transition"
              >
                <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="text-xs font-medium text-gray-800 line-clamp-2">{r.display_name}</span>
              </button>
            ))
          ) : (
            <div className="p-3 text-center">
              <p className="text-xs font-medium text-gray-600">No exact place match found for &quot;{query}&quot;</p>
              <button
                type="button"
                onClick={() => confirmCustomLocation(query)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gray-950 px-4 py-1.5 text-xs font-bold text-white hover:bg-black transition"
              >
                <CheckCircle2 size={13} />
                Set &quot;{query}&quot; as incident location
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReportForm({ userId, routes }: { userId: string; routes: Route[] }) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [routeId, setRouteId] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idle");
  const [resultOutcome, setResultOutcome] = useState<{ title: string; desc: string; type: string } | null>(null);
  // Named location picked via search
  const [locationName, setLocationName] = useState<string | null>(null);
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const resolvedRef = useRef(false);

  function handleLocationSelect(name: string, lat: number, lng: number) {
    setLocationName(name);
    setLocationLat(lat);
    setLocationLng(lng);
    // Clear any selected saved route when a specific location is typed
    setRouteId("");
  }

  function handleLocationClear() {
    setLocationName(null);
    setLocationLat(null);
    setLocationLng(null);
  }

  async function submitReport(
    rawText: string | null,
    transcript: string | null,
    inputType: "text" | "voice",
    voiceLat?: number | null,
    voiceLng?: number | null
  ) {
    setStage("checking");
    resolvedRef.current = false;
    const supabase = createClient();

    // For text mode: use named-location coordinates if picked, else fall back to saved route.
    // For voice mode: coordinates are passed in directly from getPositionSafely() in VoiceRecorder flow.
    let lat: number | null = null;
    let lng: number | null = null;

    if (inputType === "voice") {
      lat = voiceLat ?? null;
      lng = voiceLng ?? null;
    } else {
      if (locationLat != null && locationLng != null) {
        lat = locationLat;
        lng = locationLng;
      } else {
        const selectedRoute = routes.find((r) => r.id === routeId);
        lat = selectedRoute?.start_lat ?? null;
        lng = selectedRoute?.start_lng ?? null;
      }
    }

    const { data: inserted, error } = await supabase
      .from("reports")
      .insert({
        raw_input_type: inputType,
        raw_text: rawText,
        transcript,
        reporter_id: userId,
        route_id: routeId || null,
        lat,
        lng,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      setStage("error");
      return;
    }

    function resolve(row: Report) {
      if (resolvedRef.current) return;
      resolvedRef.current = true;
      setResultOutcome(describeOutcome(row));
      setStage("done");
      supabase.removeChannel(channel);
    }

    const channel = supabase
      .channel(`report-${inserted.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "reports", filter: `id=eq.${inserted.id}` },
        (payload) => resolve(payload.new as Report)
      )
      .subscribe();

    // Safety net in case the realtime event doesn't arrive
    setTimeout(async () => {
      if (resolvedRef.current) return;
      const { data } = await supabase.from("reports").select("*").eq("id", inserted.id).single();
      if (data?.processed) resolve(data as Report);
    }, 8000);
  }

  async function handleTextSubmit() {
    if (!text.trim()) return;
    await submitReport(text.trim(), null, "text");
  }

  async function handleVoiceRecorded(blob: Blob) {
    setStage("transcribing");
    const formData = new FormData();
    formData.append("audio", blob, "note.webm");
    const res = await fetch("/api/transcribe", { method: "POST", body: formData });
    if (!res.ok) {
      setStage("error");
      return;
    }
    const { transcript } = (await res.json()) as { transcript: string };
    // For voice, attempt GPS location
    const position = await getPositionSafely();
    await submitReport(null, transcript, "voice", position?.coords.latitude ?? null, position?.coords.longitude ?? null);
  }

  if (stage === "checking" || stage === "transcribing") {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/70 p-8 text-center">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white shadow-md">
          <Radio size={20} className="animate-pulse" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">
          {stage === "transcribing"
            ? "Transcribing voice memo with Whisper AI…"
            : "Cross-referencing with ground signals…"}
        </h3>
        <p className="text-xs text-gray-500 max-w-xs">
          The Sabi Fusion Engine is checking your input against known corridor reports and decay scores.
        </p>
      </div>
    );
  }

  if (stage === "done" && resultOutcome) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 size={20} className="text-emerald-600" />
          <h3 className="text-sm font-bold">{resultOutcome.title}</h3>
        </div>
        <p className="text-xs leading-relaxed text-gray-700">{resultOutcome.desc}</p>

        <button
          onClick={() => {
            setStage("idle");
            setText("");
            setResultOutcome(null);
            handleLocationClear();
            setRouteId("");
          }}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gray-950 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-black"
        >
          <span>Check another rumor</span>
          <ArrowRight size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Pill switcher */}
      <div className="flex rounded-full bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition-all ${
            mode === "text"
              ? "bg-white text-gray-950 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Type size={14} /> Type Rumor
        </button>
        <button
          type="button"
          onClick={() => setMode("voice")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-full py-2 text-xs font-semibold transition-all ${
            mode === "voice"
              ? "bg-white text-gray-950 shadow-sm"
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          <Mic size={14} /> Voice Note
        </button>
      </div>

      {mode === "text" ? (
        <div className="flex flex-col gap-3">
          {/* Location Search — required for text mode */}
          <div className="relative flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-700">
              Where did this happen? <span className="text-rose-500">*</span>
            </label>
            <LocationSearch
              onSelect={handleLocationSelect}
              selectedName={locationName}
              onClear={handleLocationClear}
            />
            {!locationName && (
              <p className="text-[11px] text-gray-400">
                Search by town, road name, landmark, or area to pin the incident location.
              </p>
            )}
          </div>

          {/* Saved road association — optional, when no named location is typed */}
          {routes.length > 0 && !locationName && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-gray-700">
                Or relate to a saved road <span className="font-normal text-gray-400">(optional)</span>
              </span>
              <select
                value={routeId}
                onChange={(e) => setRouteId(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-medium text-gray-950 focus:border-gray-900 focus:bg-white focus:outline-none"
              >
                <option value="">General Area / Not Sure</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label} ({r.corridor_name})
                  </option>
                ))}
              </select>
            </label>
          )}

          {/* What happened text */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-gray-700">What did you hear or see?</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Someone on WhatsApp said there's a heavy security checkpoint around Jaji on the Kaduna expressway..."
              rows={4}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs font-medium text-gray-950 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none"
            />
          </label>

          {/* Quick rumor suggestions */}
          <div>
            <span className="text-[11px] font-semibold text-gray-400">Quick templates:</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setText("Heard rumors of an unofficial checkpoint near the toll gate area.")}
                className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
              >
                Checkpoint rumor
              </button>
              <button
                type="button"
                onClick={() => setText("Road blockage reported around the bridge due to a broken down truck.")}
                className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
              >
                Road blockage
              </button>
              <button
                type="button"
                onClick={() => setText("Passed through 10 minutes ago, everything looks clear and smooth.")}
                className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200"
              >
                All clear
              </button>
            </div>
          </div>

          <button
            onClick={handleTextSubmit}
            disabled={!text.trim() || (!locationName && !routeId)}
            className="mt-1 flex items-center justify-center gap-2 rounded-full bg-[#121214] py-3 text-xs font-bold text-white shadow-md transition active:scale-95 hover:bg-black disabled:opacity-40"
          >
            <Sparkles size={15} />
            <span>Check this rumor</span>
          </button>

          {!locationName && !routeId && text.trim() && (
            <p className="text-center text-[11px] font-semibold text-amber-700">
              Please search and select a location to pin this report.
            </p>
          )}
        </div>
      ) : (
        /* Voice mode — GPS is auto-captured at submission, no location search needed */
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-[11px] font-medium text-blue-800">
            <MapPin size={13} className="mb-0.5 inline-block text-blue-600" /> Voice notes automatically capture your live GPS position when submitted.
          </div>
          <VoiceRecorder onRecorded={handleVoiceRecorded} />
        </div>
      )}

      {stage === "error" && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle size={16} />
          <span>Could not process report. Check your network connection and retry.</span>
        </div>
      )}
    </div>
  );
}

function describeOutcome(report: Report): { title: string; desc: string; type: string } {
  switch (report.relationship) {
    case "corroborates":
    case "new_detail":
    case "duplicate":
      return {
        title: "Report Corroborated",
        desc: "This matches existing ground reports. The signal's confidence score has been strengthened with more independent sources.",
        type: "corroborated",
      };
    case "contradicts":
      return {
        title: "Conflicting Report Flagged",
        desc: "This contradicts current known status. Sabi has flagged this corridor signal as DISPUTED until further traveler verification.",
        type: "disputed",
      };
    case "new_event":
      return {
        title: "New Incident Signal Logged",
        desc: "This is the first report of this activity. A new decaying caution signal has been established for this corridor.",
        type: "new",
      };
    case "too_old":
      return {
        title: "Historical Event",
        desc: "This sounds like an event that occurred earlier in the day and has likely passed. Logged for records without raising a caution.",
        type: "old",
      };
    case "weak_source":
      return {
        title: "Unconfirmed Secondhand Rumor",
        desc: "Logged as a secondhand account with low initial weight until on-ground travelers corroborate it.",
        type: "weak",
      };
    default:
      return {
        title: "Signal Checked & Logged",
        desc: "Your report has been analyzed by the fusion engine and added to the corridor's realtime intelligence.",
        type: "default",
      };
  }
}

function getPositionSafely(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null), // permission denied or unavailable — still submit without a location
      { timeout: 5000 }
    );
  });
}