"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { haversineKm } from "@/lib/geo";
import { isLiveForHero } from "@/lib/confidence";
import type { Route, RouteWithSignal, Signal } from "@/lib/types";

const NEARBY_KM = 15; // fusion-engine rough matching radius
const CACHE_PREFIX = "sabi:last-signal:";
const LATEST_CACHE_KEY = "sabi:latest-network-signal";

function readCache(routeId: string): { signal: Signal | null; cachedAt: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CACHE_PREFIX + routeId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(routeId: string, signal: Signal | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CACHE_PREFIX + routeId,
      JSON.stringify({ signal, cachedAt: new Date().toISOString() })
    );
  } catch {
    // Storage full or unavailable — the app still works, it just has no offline fallback for this route.
  }
}

export function useSignalsForRoutes(routes: Route[]) {
  const [pairs, setPairs] = useState<RouteWithSignal[]>([]);
  const [latestSignal, setLatestSignal] = useState<Signal | null>(null);
  const [allActiveSignals, setAllActiveSignals] = useState<Signal[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: signals, error } = await supabase
        .from("signals")
        .select("*")
        .in("status", ["open", "expiring", "disputed"])
        .order("last_verified_at", { ascending: false });

      if (error || !signals) throw error ?? new Error("no data");

      setIsOffline(false);
      const activeSignals = signals as Signal[];
      setAllActiveSignals(activeSignals);

      // Latest network signal across the entire system.
      // Only treat it as "live" if it was verified within the last 3 hours —
      // an older signal, even if it's the freshest in the DB, should not
      // surface as an active alert in the hero card.
      const heroCandidate = activeSignals.length > 0 ? activeSignals[0] : null;
      const liveHeroSignal = heroCandidate && isLiveForHero(heroCandidate) ? heroCandidate : null;
      setLatestSignal(liveHeroSignal);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(
            LATEST_CACHE_KEY,
            JSON.stringify(liveHeroSignal)
          );
        } catch {}
      }

      // Map routes to their nearest signal
      const next = routes.map((route) => {
        let best: Signal | null = null;
        let bestDist = Infinity;
        if (route.start_lat != null && route.start_lng != null) {
          for (const s of activeSignals) {
            const d = haversineKm(route.start_lat, route.start_lng, s.lat, s.lng);
            if (d < NEARBY_KM && d < bestDist) {
              best = s;
              bestDist = d;
            }
          }
        }
        writeCache(route.id, best);
        return { route, signal: best };
      });
      setPairs(next);
    } catch {
      // Offline, or the request failed — fall back to each route's last cached signal.
      setIsOffline(true);
      if (typeof window !== "undefined") {
        try {
          const cachedLatest = window.localStorage.getItem(LATEST_CACHE_KEY);
          if (cachedLatest) setLatestSignal(JSON.parse(cachedLatest));
        } catch {}
      }
      setPairs(
        routes.map((route) => {
          const cached = readCache(route.id);
          return { route, signal: cached?.signal ?? null, cachedAt: cached?.cachedAt };
        })
      );
    } finally {
      setLoading(false);
    }
  }, [routes]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("signals-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => {
        fetchAll();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAll]);

  useEffect(() => {
    function goOnline() {
      fetchAll();
    }
    window.addEventListener("online", goOnline);
    return () => window.removeEventListener("online", goOnline);
  }, [fetchAll]);

  return { pairs, latestSignal, allActiveSignals, isOffline, loading, refresh: fetchAll };
}
