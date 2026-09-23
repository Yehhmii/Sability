"use client";

import { useRef, useState } from "react";
import { Mic, Square, Upload } from "lucide-react";

export function VoiceRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [unsupported, setUnsupported] = useState(false);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => chunks.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(blob);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setUnsupported(true);
    }
  }

  function stop() {
    mediaRecorder.current?.stop();
    setRecording(false);
    if (timer.current) clearInterval(timer.current);
  }

  if (unsupported) {
    return (
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-6 text-center text-xs text-gray-600 transition hover:bg-gray-100/60">
        <Upload size={22} className="text-gray-500" />
        <span className="font-semibold text-gray-900">Upload voice memo</span>
        <span className="text-[11px] text-gray-400">Microphone unavailable — tap to select audio file</span>
        <input
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onRecorded(file);
          }}
        />
      </label>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-6 text-center">
      <div className="relative">
        {recording && (
          <span className="absolute -inset-2 animate-ping rounded-full bg-rose-400/40 opacity-75" />
        )}
        <button
          type="button"
          onClick={recording ? stop : start}
          className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 ${
            recording
              ? "bg-rose-600 text-white"
              : "bg-gray-950 text-white hover:bg-black"
          }`}
          aria-label={recording ? "Stop recording" : "Start recording"}
        >
          {recording ? <Square size={20} /> : <Mic size={24} />}
        </button>
      </div>

      <div>
        <p className="text-xs font-bold text-gray-900">
          {recording ? "Recording Voice Note..." : "Tap microphone to speak"}
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          {recording ? (
            <span className="font-mono text-rose-600 font-bold">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")} (Tap to finish)
            </span>
          ) : (
            "Whisper AI transcribes and checks your report automatically"
          )}
        </p>
      </div>
    </div>
  );
}
