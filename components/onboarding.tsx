"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

const KEY = "sabi:onboarded";

export function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(KEY)) setShow(true);
    } catch {
      // Storage unavailable — just skip onboarding rather than block the app.
    }
  }, []);

  function dismiss() {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-xs sm:items-center">
      <div className="safe-bottom w-full max-w-sm rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-md">
          <Compass size={24} />
        </div>

        <h2 className="mt-4 text-xl font-black tracking-tight text-gray-950">Welcome to Sabi</h2>
        <p className="mt-2 text-xs leading-relaxed text-gray-600">
          Know right now whether a road is safe — and exactly how sure to be. Sabi tracks live, honestly-decaying confidence signals for your travel routes.
        </p>

        <div className="mt-4 space-y-2.5 rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Route Digest:</strong> Live caution & all-clear signals for your roads.</span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-700">
            <span className="text-emerald-600 font-bold">✓</span>
            <span><strong>Sabi Check:</strong> Type or voice-record rumors to verify on the fly.</span>
          </div>
        </div>

        <button
          onClick={dismiss}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#121214] py-3 text-xs font-bold text-white shadow-md transition active:scale-98 hover:bg-black"
        >
          <span>Get Started</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
