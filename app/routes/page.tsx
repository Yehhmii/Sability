"use client";

import Link from "next/link";
import { Clock, Compass, MapPin, Plus, Trash2 } from "lucide-react";
import { useAnonymousAuth } from "@/hooks/use-anonymous-auth";
import { useRoutes } from "@/hooks/use-routes";

export default function RoutesPage() {
  const { user } = useAnonymousAuth();
  const { routes, loading, removeRoute } = useRoutes(user?.id ?? null);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-950">My Roads</h1>
          <p className="text-xs font-medium text-gray-500">
            Highways and corridors you actively monitor
          </p>
        </div>

        <Link
          href="/routes/new"
          className="flex items-center gap-1.5 rounded-full bg-gray-950 px-4 py-2 text-xs font-semibold text-white shadow-md transition active:scale-95 hover:bg-black"
        >
          <Plus size={15} />
          <span>Add Road</span>
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          <div className="h-20 w-full animate-pulse rounded-2xl bg-gray-200/70" />
          <div className="h-20 w-full animate-pulse rounded-2xl bg-gray-200/70" />
        </div>
      )}

      {!loading && routes.length === 0 && (
        <div className="rounded-3xl border border-gray-200/80 bg-white p-8 text-center card-shadow">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
            <Compass size={28} />
          </div>
          <h2 className="mt-3.5 text-base font-bold text-gray-900">No roads saved yet</h2>
          <p className="mt-1 text-xs text-gray-500 max-w-xs mx-auto">
            Save routes to receive automatic decay alerts, checkpoint warnings, and verification prompts.
          </p>
          <Link
            href="/routes/new"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-950 px-5 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-black"
          >
            <Plus size={15} /> Add your first road
          </Link>
        </div>
      )}

      {/* Routes List */}
      <div className="flex flex-col gap-3">
        {routes.map((route) => (
          <div
            key={route.id}
            className="group flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 card-shadow state-transition hover:border-gray-300 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-800">
                <MapPin size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-950">{route.label}</h3>
                <p className="text-xs text-gray-500">{route.corridor_name}</p>

                {(route.travel_window_start || route.start_lat != null) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {route.travel_window_start && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600">
                        <Clock size={10} />
                        {route.travel_window_start} - {route.travel_window_end || "late"}
                      </span>
                    )}
                    {route.start_lat != null && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                        {route.start_lat.toFixed(2)}, {route.start_lng?.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => removeRoute(route.id)}
              aria-label={`Remove ${route.label}`}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-600 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
