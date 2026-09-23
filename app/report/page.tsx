"use client";

import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { useRoutes } from "@/hooks/use-routes";
import { ReportForm } from "@/components/report-form";

export default function ReportPage() {
  const { user, loading: authLoading } = useAnonymousAuth();
  const { routes } = useRoutes(user?.id ?? null);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-xs text-gray-500">Loading Sabi check…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="pt-1">
        <h1 className="text-2xl font-black tracking-tight text-gray-950">Sabi Check</h1>
        <p className="text-xs font-medium text-gray-500">
          Heard a rumor or saw something? Paste or record it to cross-check against live ground signals.
        </p>
      </header>

      <div className="rounded-3xl border border-gray-200/80 bg-white p-5 card-shadow-lg">
        <ReportForm userId={user.id} routes={routes} />
      </div>
    </div>
  );
}
