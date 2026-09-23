# Sability - Sabi for short 

A Progressive Web App (Best previewed on a mobile device) for knowing, right now, whether a road is safe and how sure to be about it.

Two things, one system: save the roads you travel and get a live, honestly-decaying confidence
signal for each one (**route digest**), and paste or record a rumor to have it checked against
everything already known (**Sabi check**). See `signals` change over time and re-verify with one
tap when a signal is about to expire.

## 1. Set up the backend first

This app expects the Supabase for backend and function calls.

**One required addition** on top of that guide: this frontend shows an anonymized report
timeline on the signal detail screen, which needs a small public view (the base `reports` table
is intentionally locked down to each person's own rows for privacy). 

This view only exposes `relationship` and timing, never reporter identity, raw text, or
location, consistent with the privacy stance from the setup guide.

## 2. Configure and run

```bash
in .env
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, GROQ_API_KEY

npm install
npm run dev
```


Open `http://localhost:3000`. You'll be signed in anonymously and silently — no login screen.
Add a road near one of the seeded demo signals.

## What's built

- Anonymous auth on first load, no signup friction
- Home screen with a Signal Card per saved road: all-clear, caution (high/medium/low/disputed,
  color-coded), expiring, and offline/stale variants
- Client-side freshness countdown that ticks every 20s between realtime updates
- "I'm here — verify" — logs a geolocated tap as a report and resets the signal's decay clock
- Sabi check: type or record a voice note (`MediaRecorder`, with a file-upload fallback),
  transcribed server-side via Groq's `whisper-large-v3` (`/api/transcribe`, the only place
  `GROQ_API_KEY` is touched), then watched live via Supabase Realtime until the fusion engine
  finishes processing it, with a plain-language result
- Realtime in-app notifications (Postgres changes on `signals`) — this **is** the v1 notification
  mechanism, deliberately built before any Web Push work
- Installable PWA via Serwist: app-shell precaching plus a `NetworkFirst` runtime cache for the
  `signals` REST endpoint, backed by a per-route `localStorage` snapshot so the offline card can
  show a real "last known as of [time]" label rather than nothing

## What's stretch / partially built

**Push notifications are intentionally incomplete**, the
realtime mechanism above covers the "the app tells me something changed" requirement completely
while the app is open, with zero extra infrastructure. What *is* built: the client-side
subscribe flow (`lib/push.ts`, the "Enable notifications" button on the home screen) and an API
route that stores the subscription (`app/api/push/subscribe`). What's **not** built: anything
that actually *sends* a push from the backend when a signal changes 


## Assumptions made

- Routes use a single lat/lng point (`start_lat`/`start_lng`) rather than a full path, matching
  the backend's simple-geo approach — good enough to match a route to nearby signals via a
  bounding box + haversine check, not precise turn-by-turn.
- The "I'm here — verify" tap writes `signal_id` directly and skips the fusion engine's matching
  step, since the person is explicitly confirming a signal they can already see, not describing
  something new.
- Light mode is the default and primary experience per the design brief; dark mode exists as a
  CSS variable set (`:root` vs `[data-theme="dark"]`) but there's no visible toggle wired up yet.

## NOTE
- Please allow acces to our mic and location when asked.
- Ensure you pronouce the location you are talking about clearly for better transcrption of your message.
- The app works best on mobile devices.
- click the three dot to be able to install it on your device for the best experience.


## With more time
- setup push notification module 
- installation from the web to users device 
- enable captach for anonymous signin to prevent spamming 
- adding PostGIS for proper geo mapping 
- and some ui and logic adjustments. 
