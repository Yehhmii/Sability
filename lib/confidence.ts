import { formatDistanceToNowStrict } from "date-fns";
import type { ConfidenceLevel, DecayClass, Signal } from "./types";

export const HALF_LIFE_MIN: Record<DecayClass, number> = {
  fast: 15,
  medium: 360,
  slow: 2880,
};

/**
 * Maximum hours a signal can be before it is considered completely stale,
 * regardless of its decay class. This prevents slow-decay signals from
 * appearing misleadingly fresh after many hours in real-world time.
 */
const ABSOLUTE_MAX_HOURS = 24;

/**
 * After this many hours, the displayed freshness is capped and
 * starts being penalised on top of the exponential decay. A 6-hour-old
 * signal that is otherwise 80% fresh by half-life maths will still
 * lose some of that score here.
 */
const ABSOLUTE_CAP_START_HOURS = 4;

/**
 * Compute freshness % using a two-factor model:
 *
 * 1. Exponential half-life decay (mirrors the decay-tick Edge Function)
 * 2. Absolute age cap — independent of decay class, so a "slow" signal
 *    that is 20 hours old can't show as 65% fresh in the UI even if the
 *    maths technically allows it.
 *
 * The absolute cap linearly decays from 100% at ABSOLUTE_CAP_START_HOURS
 * down to 0% at ABSOLUTE_MAX_HOURS.  The returned value is the minimum
 * of the two factors, clamped to [0, 100].
 */
export function freshnessPct(lastVerifiedAt: string, decayClass: DecayClass): number {
  const minutesSinceVerified = (Date.now() - new Date(lastVerifiedAt).getTime()) / 60000;
  const hoursSinceVerified = minutesSinceVerified / 60;

  // Factor 1 — exponential half-life decay
  const halfLife = HALF_LIFE_MIN[decayClass] ?? HALF_LIFE_MIN.medium;
  const expFresh = 100 * Math.exp(-minutesSinceVerified / halfLife);

  // Factor 2 — hard absolute-age cap
  //   • before ABSOLUTE_CAP_START_HOURS: no cap (100%)
  //   • between cap-start and ABSOLUTE_MAX_HOURS: linear ramp from 100% → 0%
  //   • at or beyond ABSOLUTE_MAX_HOURS: 0%
  let absoluteCap: number;
  if (hoursSinceVerified <= ABSOLUTE_CAP_START_HOURS) {
    absoluteCap = 100;
  } else if (hoursSinceVerified >= ABSOLUTE_MAX_HOURS) {
    absoluteCap = 0;
  } else {
    const range = ABSOLUTE_MAX_HOURS - ABSOLUTE_CAP_START_HOURS;
    const elapsed = hoursSinceVerified - ABSOLUTE_CAP_START_HOURS;
    absoluteCap = 100 * (1 - elapsed / range);
  }

  return Math.max(0, Math.min(expFresh, absoluteCap));
}

/**
 * Hours since a signal was last verified. Used to determine whether
 * the hero card should show a live alert or a clean-slate state.
 */
export function hoursSince(dateIso: string): number {
  return (Date.now() - new Date(dateIso).getTime()) / 3_600_000;
}

/**
 * Returns true if a signal is recent enough to be considered "live"
 * for the hero card (i.e. less than 3 hours since last verification).
 */
export function isLiveForHero(signal: Signal): boolean {
  return hoursSince(signal.last_verified_at) < 3;
}

export function isExpiring(signal: Signal): boolean {
  return (
    signal.status === "expiring" ||
    (signal.status === "open" && freshnessPct(signal.last_verified_at, signal.decay_class) < 30)
  );
}

export function confidenceLabel(level: ConfidenceLevel): string {
  return level.toUpperCase();
}

/** Plain-language breakdown for the signal detail screen. */
export function explainConfidence(signal: Signal): string {
  const parts: string[] = [];
  const reportWord = signal.independent_report_count === 1 ? "person" : "people";

  if (signal.independent_report_count > 0) {
    parts.push(`${signal.independent_report_count} ${reportWord} reported this independently`);
  } else if (signal.source === "public_data") {
    parts.push("This came from a public news source, not yet confirmed by anyone on the ground");
  } else {
    parts.push("Only one report so far");
  }

  if (signal.trusted_source_count > 0) {
    const word = signal.trusted_source_count === 1 ? "was" : "were";
    parts.push(`${signal.trusted_source_count} of them ${word} a trusted local source`);
  }

  if (signal.contradicting_report_count > 0) {
    const word = signal.contradicting_report_count === 1 ? "report" : "reports";
    parts.push(
      `but ${signal.contradicting_report_count} conflicting ${word} came in too — treat this as unresolved`
    );
  } else if (signal.public_corroboration !== "none") {
    parts.push("and it lines up with public reporting");
  } else {
    parts.push("with no conflicting reports");
  }

  return parts.join(", ") + ".";
}

export function relativeTime(dateIso: string): string {
  return formatDistanceToNowStrict(new Date(dateIso), { addSuffix: true });
}

export function minutesSince(dateIso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000));
}

export function formatClock(dateIso: string): string {
  return new Date(dateIso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
