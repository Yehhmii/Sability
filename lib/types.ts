export type TrustTier = "anonymous" | "community" | "trusted_local" | "vigilante";

export type ThreatType =
  | "checkpoint"
  | "movement"
  | "gunfire"
  | "robbery"
  | "road_blockage"
  | "other";

export type DecayClass = "fast" | "medium" | "slow";

export type SignalStatus = "open" | "expiring" | "expired" | "resolved" | "disputed";

export type ConfidenceLevel = "high" | "medium" | "low" | "disputed";

export type PublicCorroboration = "none" | "partial" | "strong";

export type ReportInputType = "text" | "voice" | "tap";

export type ReportRelationship =
  | "duplicate"
  | "corroborates"
  | "contradicts"
  | "new_detail"
  | "new_event"
  | "too_old"
  | "weak_source";

export interface Profile {
  id: string;
  display_name: string | null;
  trust_tier: TrustTier;
  trust_score: number;
  created_at: string;
}

export interface Route {
  id: string;
  user_id: string;
  label: string;
  corridor_name: string;
  start_lat: number | null;
  start_lng: number | null;
  end_lat: number | null;
  end_lng: number | null;
  travel_window_start: string | null;
  travel_window_end: string | null;
  days_active: string[];
  created_at: string;
}

export interface Signal {
  id: string;
  corridor_name: string;
  lat: number;
  lng: number;
  radius_m: number;
  threat_type: ThreatType;
  decay_class: DecayClass;
  summary: string | null;
  status: SignalStatus;
  confidence_level: ConfidenceLevel;
  confidence_score: number;
  raw_score: number;
  independent_report_count: number;
  trusted_source_count: number;
  contradicting_report_count: number;
  public_corroboration: PublicCorroboration;
  source: "human" | "public_data";
  first_reported_at: string;
  last_verified_at: string;
  next_verification_at: string | null;
  created_at: string;
}

export interface ReportExtracted {
  location?: string;
  threat_type?: ThreatType;
  event_time_estimate?: string;
  hop_distance?: number;
}

export interface Report {
  id: string;
  signal_id: string | null;
  reporter_id: string | null;
  route_id: string | null;
  raw_input_type: ReportInputType;
  raw_text: string | null;
  transcript: string | null;
  extracted: ReportExtracted | null;
  relationship: ReportRelationship | null;
  lat: number | null;
  lng: number | null;
  processed: boolean;
  created_at: string;
}

/** What the home screen renders per saved route: the route plus its nearest open signal, if any. */
export interface RouteWithSignal {
  route: Route;
  signal: Signal | null;
  /** ISO timestamp this pairing was last fetched — used to label the offline/stale variant. */
  cachedAt?: string;
}

export const THREAT_LABELS: Record<ThreatType, string> = {
  checkpoint: "Checkpoint reported",
  movement: "Movement reported",
  gunfire: "Gunfire reported",
  robbery: "Robbery reported",
  road_blockage: "Road blocked",
  other: "Incident reported",
};
