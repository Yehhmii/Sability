"use client";

import { useState } from "react";
import { CheckCircle2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Toast } from "@/components/toast";

export function VerifyButton({
  signalId,
  userId,
  className = "",
}: {
  signalId: string;
  userId: string | null;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [toastVisible, setToastVisible] = useState(false);

  async function handleVerify() {
    if (status === "sending") return;
    setStatus("sending");

    const position = await getPositionSafely();

    const supabase = createClient();
    await supabase.from("reports").insert({
      signal_id: signalId, // written directly — the person is explicitly confirming this exact signal
      reporter_id: userId,
      raw_input_type: "tap",
      raw_text: "I am here, verifying this signal",
      lat: position?.coords.latitude ?? null,
      lng: position?.coords.longitude ?? null,
      processed: true, // taps skip the fusion-engine's matching step; the target signal is already known
    });

    setStatus("done");
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  }

  return (
    <>
      <button
        onClick={handleVerify}
        disabled={status === "sending"}
        className={`state-transition flex items-center justify-center gap-2 rounded-full bg-[#121214] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-black disabled:opacity-60 active:scale-98 ${className}`}
      >
        {status === "done" ? <CheckCircle2 size={15} /> : <MapPin size={15} />}
        {status === "sending"
          ? "Verifying location…"
          : status === "done"
          ? "Signal Verified!"
          : "I'm here — Verify Road Status"}
      </button>
      <Toast message="Thanks — ground signal re-verified and decay timer reset!" visible={toastVisible} />
    </>
  );
}

function getPositionSafely(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null), // permission denied or unavailable — still let the tap count
      { timeout: 5000 }
    );
  });
}
