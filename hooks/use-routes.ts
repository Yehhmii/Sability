"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Route } from "@/lib/types";

export function useRoutes(userId: string | null) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    setLoading(true);
    const { data } = await supabase
      .from("routes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setRoutes(data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeRoute = useCallback(
    async (id: string) => {
      const supabase = createClient();
      await supabase.from("routes").delete().eq("id", id);
      setRoutes((prev) => prev.filter((r) => r.id !== id));
    },
    []
  );

  return { routes, loading, refresh, removeRoute };
}
