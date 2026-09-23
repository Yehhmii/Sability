// This file is compiled directly by @serwist/next's webpack plugin into public/sw.js.
// It's intentionally excluded from the main tsconfig.json (see tsconfig.worker.json) because
// the WebWorker and DOM lib type sets conflict if both are active in the same TS program —
// this is a known constraint of using TypeScript for service workers inside a Next.js app.

import { defaultCache } from "@serwist/next/worker";
import { NetworkFirst, Serwist } from "serwist";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Statically replaced at build time by Next's env inlining, same as any NEXT_PUBLIC_* var.
let supabaseHost = "";
try {
  supabaseHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
} catch {
  // .env not filled in yet — Supabase runtime caching just won't match anything until it is.
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Cache the last successful "current signals" fetch so a previously-viewed route can
      // still show something meaningful offline. The app also keeps its own per-route
      // localStorage snapshot (see hooks/use-signal-realtime.ts) for the exact "last known as
      // of [time]" label — this cache is the network-level safety net underneath it.
      matcher: ({ url }) => url.hostname === supabaseHost && url.pathname === "/rest/v1/signals",
      handler: new NetworkFirst({
        cacheName: "sabi-signals",
        networkTimeoutSeconds: 4,
      }),
    },
    ...defaultCache,
  ],
});

serwist.addEventListeners();
