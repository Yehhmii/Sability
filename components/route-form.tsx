"use client";

import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { LocateFixed, MapPin, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  label: z.string().min(1, 'Give it a short name, e.g. "Way Home" or "Abuja Trip"'),
  corridor_name: z.string().min(1, "Which road or corridor is this?"),
  start_lat: z.coerce.number().min(-90).max(90),
  start_lng: z.coerce.number().min(-180).max(180),
  travel_window_start: z.string().optional(),
  travel_window_end: z.string().optional(),
});

type FormValues = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export function RouteForm({ userId }: { userId: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues, unknown, FormOutput>({ resolver: zodResolver(schema) });

  function useMyLocation() {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setValue("start_lat", Number(pos.coords.latitude.toFixed(5)));
      setValue("start_lng", Number(pos.coords.longitude.toFixed(5)));
    });
  }

  function fillDemoCorridor(label: string, corridor: string, lat: number, lng: number) {
    setValue("label", label);
    setValue("corridor_name", corridor);
    setValue("start_lat", lat);
    setValue("start_lng", lng);
  }

  async function onSubmit(values: FormOutput) {
    const supabase = createClient();
    await supabase.from("routes").insert({
      user_id: userId,
      label: values.label,
      corridor_name: values.corridor_name,
      start_lat: values.start_lat,
      start_lng: values.start_lng,
      travel_window_start: values.travel_window_start || null,
      travel_window_end: values.travel_window_end || null,
    });
    router.push("/routes");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      {/* Quick suggestions pills */}
      <div>
        <span className="text-[11px] font-semibold text-gray-400">Popular Corridors:</span>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() =>
              fillDemoCorridor("Kaduna Trip", "Kaduna-Abuja Expressway", 9.62, 7.43)
            }
            className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            + Kaduna — Abuja
          </button>
          <button
            type="button"
            onClick={() =>
              fillDemoCorridor("Ibadan Expressway", "Lagos-Ibadan Expressway", 6.89, 3.65)
            }
            className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            + Lagos — Ibadan
          </button>
          <button
            type="button"
            onClick={() =>
              fillDemoCorridor("Ore Highway", "Benin-Ore Expressway", 6.74, 4.88)
            }
            className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            + Benin — Ore
          </button>
        </div>
      </div>

      <Field label="Custom Route Name" error={errors.label?.message}>
        <input {...register("label")} placeholder="e.g. Daily Commute or Way Home" className={inputClass} />
      </Field>

      <Field label="Corridor / Highway Name" error={errors.corridor_name?.message}>
        <input
          {...register("corridor_name")}
          placeholder="e.g. Kaduna-Abuja Expressway"
          className={inputClass}
        />
      </Field>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-700">Starting Coordinates</span>
        <button
          type="button"
          onClick={useMyLocation}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800 hover:bg-gray-200 transition active:scale-95"
        >
          <LocateFixed size={13} /> Use Current GPS
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Latitude" error={errors.start_lat?.message}>
          <input
            {...register("start_lat")}
            inputMode="decimal"
            placeholder="9.62000"
            className={inputClass}
          />
        </Field>
        <Field label="Longitude" error={errors.start_lng?.message}>
          <input
            {...register("start_lng")}
            inputMode="decimal"
            placeholder="7.43000"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Travel Window From">
          <input {...register("travel_window_start")} type="time" className={inputClass} />
        </Field>
        <Field label="To">
          <input {...register("travel_window_end")} type="time" className={inputClass} />
        </Field>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 w-full rounded-full bg-[#121214] py-3 text-xs font-bold text-white shadow-md transition active:scale-98 hover:bg-black disabled:opacity-60"
      >
        {isSubmitting ? "Saving road…" : "Save Road"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-gray-50/70 px-3.5 py-2.5 text-xs font-medium text-gray-950 placeholder:text-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-900 transition";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-gray-700">{label}</span>
      {children}
      {error && <span className="text-[11px] font-semibold text-rose-600">{error}</span>}
    </label>
  );
}
