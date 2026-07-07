#hackthekitty 2026
# Project Report

**Project Name:** Purrdict

**Reference ID:** DCG9D1RC

---

## 1. Executive Summary

Purrdict is an Internet of Things (IoT)-based cat monitoring platform that integrates an ESP32-CAM smart collar/leash, motion sensors, GPS tracking, and a Next.js web application (also available as an Android app through Capacitor) to monitor a cat's behavior, emotional state, health, and location in real time.

The device provides a live camera feed, allowing owners to remotely observe their cat's activities, while the GPS displays the cat's real-time location and the distance between the owner and the pet. Sensor data are analyzed using evidence-based detection rules supported by 17 peer-reviewed veterinary and animal behavior studies, ensuring that every behavioral insight is transparent and scientifically supported rather than a black-box AI prediction.

Through a single dashboard, owners can access the live camera, GPS location, behavior analysis, emotional and health indicators, and activity updates, enabling them to monitor their cat, understand the reasons behind detected behaviors, and respond promptly when necessary.

## 2. Project Overview

### 2a. Why we're building this

Most consumer pet trackers report raw activity counts or make vague "AI-powered" behavior claims with no way to verify them. Cat owners are left guessing whether a change in activity means something is actually wrong. Purrdict was built to solve a specific set of everyday problems cat owners face, and each core feature exists to close one of those gaps:

- **"What is my cat doing right now, when I'm not home?"** — The ESP32-CAM collar streams a live video feed to the app, connected directly through the owner's device pairing, so the owner can check in on their cat's activity in real time without being physically present.
- **"What if my cat goes missing?"** — The built-in GPS tracking shows the cat's live location and continuously calculates the distance between the cat and home, so if the cat wanders off or goes missing, the owner already knows roughly where to start looking instead of searching blind.
- **"Is my cat actually healthy, or just quiet?"** — The health dashboard turns raw motion-sensor data into an activity baseline (steps, rest, activity level) instead of leaving the owner to guess, and pairs that with a built-in vet finder that shows nearby clinics, gives directions, and lets the owner book/contact them directly when something looks off.
- **"I want to hold on to the little moments."** — The scrapbook/album feature lets owners create dedicated "books" of photos, videos, and written notes to capture and revisit memories of their cat, the same way a physical photo album would.
- **"I keep forgetting feeding times, vet visits, grooming, etc."** — The reminders (to-do list) feature lets owners set up recurring tasks and duties tied to their cat's care, so nothing gets missed.

On top of solving these practical problems, every detection rule in Purrdict is also traceable to one of 17 peer-reviewed veterinary and ethology papers, mapping observable sensor signatures (motion intensity, frame-to-frame change, activity timing) directly onto behavior and welfare categories defined in published research — so every reading on the dashboard cites the paper and method behind it (e.g. Ikurior et al. 2023's ODBA thresholds, Evangelista et al. 2019's Feline Grimace Scale, Nicholson & O'Carroll 2021's feline emotion ethogram).

### 2b. How it relates to the theme

The hackathon theme, "Coding for Kitties," is the core of the product rather than a surface-level tie-in: the entire system — hardware, backend, and UI — exists to answer one question for a cat owner: *"What is my cat up to, and is she okay?"* Every feature (live behavior feed, emotion assessment, pain/wellness check, GPS geofencing, needs prediction, scrapbook, reminders) is built around cat welfare and care.

### 2c. Target Audience

Cat owners who want more insight into their indoor/outdoor cat's daily behavior and wellbeing than a standard activity tracker provides — particularly owners who want a leash-based device that also gives them a live camera view, GPS location, and evidence-based health signals, without needing to trust an opaque AI model.

## 3. Key Features

### Auth, Onboarding & Cat Profiles
- [x] Signup / login with JWT sessions and bcrypt (cost 12) password hashing (`/api/auth/signup`, `/api/auth/login`)
- [x] Sign out (clears auth state, localStorage, and JWT)
- [x] 4-step guided setup wizard: Device pairing → name the cat → profile details (breed, age, fur color, icon or photo upload) → trading-card style preview
- [x] Cat cards on the dashboard with edit (name/breed/age/photo/fur color) and delete, full CRUD via `/api/cats` and `/api/cats/[id]`
- [x] One-click Demo Mode — instantly bootstraps a sample cat ("Whiskers") so judges/users can try the app without hardware
- [x] First-run guided tutorial overlay walking new users through Live, Cam, Map, Tasks, and Album tabs

### Live Behavior & Wellness Detection
- [x] Live behavior detection feed — 10 behaviors (sleeping, grooming, eating, playing, walking, sitting/alert, scratching, running, drinking, jumping) classified from ESP32 motion data, each shown with confidence % and its research citation 
- [x] Emotion assessment — 5 states (contentment, excitement, relaxation, curiosity, alertness) derived from motion-behavior correlates (Nicholson & O'Carroll 2021)
- [x] Wellness / pain check panel citing the Evangelista et al. 2023 pain ethogram
- [x] Circadian rhythm context card showing time-of-day activity phase and a 24-hour activity pattern chart (Piccione et al. 2013 crepuscular framework)
- [x] Observation history timeline polling live sensor/behavior data from the database every 10 seconds
- [x] Research Basis panel citing all 17 supporting papers
- [x] *Fixed during this review:* the Emotion Assessment panel used to be a client-side lookup keyed off the currently-displayed behavior label (`deriveEmotion()` in `dashboard/page.tsx`), with nothing writing to the `emotion_assessments` table. It's now a real server-side pipeline (`src/lib/emotion.ts`): every time `POST /api/esp32/data` logs a behavior event, it also derives and persists a full 5-emotion score (fear/anger/joy/contentment/interest, per Nicholson & O'Carroll 2021) plus posture/tail/ear/eye/vocalization fields to `emotion_assessments`. The dashboard now fetches and renders the latest DB row instead of recomputing anything from the on-screen label, and only falls back to a client-computed estimate (using the same scoring function) when no row exists yet, e.g. a brand-new Demo Mode session.
- [x] *Current limitation:* the Wellness Check panel still always renders a static "Score: 0/10 — No Anomalies" — it is not yet computed from a real 14-day baseline (tracked in Future Improvements).

### Live Cat Cam
- [x] Live video stream from the device, proxied server-side (`/api/esp32/stream`) with basic SSRF protection (only private/local IP ranges accepted)
- [x] Snapshot capture — grabs the current video frame to canvas and downloads it as a JPEG
- [x] Auto-reconnect / force-reconnect handling for the ESP32's single-viewer stream limitation
- [x] Settings modal to configure and persist the device


### GPS Tracking — "Away From Home" Detection & Distance
- [x] **Home setup:** the owner types their home address once; it's geocoded to lat/lng via OpenStreetMap Nominatim and saved to `localStorage`, giving the geofence a fixed center point to measure against.
- [x] **Live map:** a real Leaflet.js + OpenStreetMap map renders the home point, a dashed geofence circle (80m radius), a pulsing cat marker for the current position, and a yellow dashed trail line connecting recent positions.
- [x] **Distance-from-home calculation:** on every position update, the app converts the lat/lng delta between the cat's current point and home into meters using an equirectangular approximation (`Δlat × 111,320m` and `Δlng × 111,320m × cos(homeLat)`), then takes the Euclidean distance — this is what powers the live "Xm from home" readout and the distance progress bar.
- [x] **Away-from-home alert:** that live distance is compared against the 80m geofence radius. Inside the radius shows a green "● SAFE ZONE" badge; the moment the cat's position crosses outside it, the badge flips to a red "⚠ OUTSIDE" warning and the distance bar turns red — an immediate visual alert that the cat has wandered off.
- [x] **Backend logging endpoint:** `POST /api/gps/monitor` logs a GPS reading to the `gps_logs` table and runs the same haversine geofence check server-side, returning whether the point is inside the radius and the distance in meters. It's a plain async DB write (previously behind a Temporal workflow, now removed — see Future Improvements) — it still has no real ESP32 GPS hardware to read from, since there is no GPS module in the current firmware.
- [x] *Improved during this review:* the simulated movement on the map page used to teleport between a fixed list of waypoints every 3 seconds. It's now a random-waypoint walk model — the cat picks a random destination (mostly within the geofence, with an occasional longer excursion so the "outside geofence" alert still triggers), walks toward it at a mode-dependent speed (0.3-0.6 m/s exploring, 0.5-1.0 m/s walking, 1.2-2.2 m/s playing), then pauses to rest or groom for 4-16 seconds before picking a new destination — smooth continuous motion updated every 400ms instead of jumping between fixed points. The geofence math, distance display, and safe/outside alert states are unchanged (still fully real); only the *simulated* coordinate source is more realistic. This is still a client-side stand-in — it's waiting on an actual GPS sensor in the firmware to become the real coordinate source.

### Vet Finder — Search & "Booking" Flow
- [x] **Live search API:** `GET /api/vets/search` geocodes a free-text location (or accepts lat/lng directly, e.g. from the browser's Geolocation API) via OpenStreetMap Nominatim, then queries the Overpass API for real `amenity=veterinary` points of interest within a configurable radius (default 15km, max 50km) — name, address, phone, hours, and website come directly from OpenStreetMap tags, sorted nearest-first.
- [x] **Search by location:** the owner types a city/country, or taps "Use my current location" to reverse-geocode their position and search around it — both paths now hit the live API instead of a static list.
- [x] **Real distance ranking:** every returned clinic's straight-line distance from the search origin is computed server-side with the haversine formula; a separate "distance from home" is also shown in the clinic detail view once a home address is set.
- [x] **"Booking" action:** Purrdict doesn't run its own appointment-scheduling backend — instead, tapping a clinic opens a detail view with one-tap **📞 Call Now** (`tel:` link, shown only if OpenStreetMap has a phone number for that clinic) and **🗺️ Directions** (opens the address in Google Maps) buttons, so the owner books the visit by phone or navigates there directly.
- [x] *Fixed during this review:* the previous version had no `/api/vets/search` route at all — the entire clinic list lived client-side in `health/page.tsx` as a hardcoded `WORLDWIDE_VETS` object covering 8 fixed regions (Philippines, NYC, London, Tokyo, Sydney, Toronto, Berlin, Singapore). That object and its lookup function have been removed; the Vet Finder modal now calls the live route for every search, so results reflect real, current OpenStreetMap data for *any* location worldwide, not just the 8 pre-seeded regions.
- [x] *Known limitation:* result quality depends on how completely a given area is mapped in OpenStreetMap — sparsely-mapped regions may return fewer clinics (or none) even if physical clinics exist there, and OpenStreetMap has no star-rating field, so the rating shown in the old static data has been dropped rather than fabricated.

### Needs & Health Monitor
- [x] Needs predictor — estimates hunger, thirst, play, rest, attention, and vet-check needs with confidence percentages, sorted by likelihood
- [x] Health monitor — 7-day baseline chart plus activity metrics (steps, jumps, grooming minutes, feeding events, water visits, restlessness) with a "Detection Methods" citation panel, plus a "Schedule a vet visit?" prompt that opens the Vet Finder above
- [x] *Current limitation:* both pages are fully client-side with no supporting API route. The Needs Predictor renders a fixed array from `src/lib/mockData.ts` (`needPredictions`) — the numbers never change. The Health Monitor calls `generateHealthWeek()` / `generateSensorMetrics()`, which produce fresh `Math.random()` values on every page load, labeled with sensor names (MPU6050, INP) that don't correspond to anything in the actual ESP32 firmware, which only has a camera and frame-difference motion detection — no accelerometer, gyroscope, or proximity sensor exists in the current hardware code.

### Scrapbook — Photo/Video/Note Albums
- [x] **Create albums:** owners create named "books" with a custom cover color and pattern (dots, stripes, zigzag, stars, hearts) — each book is a separate album, e.g. one per cat or one per season.
- [x] **Add memories:** inside a book, owners add entries of 3 types — photo, video (both up to 50MB, converted to base64 on upload), or a written note — each with a caption, optional full story text, and an optional mood tag (milestone/funny/chaos/cozy/wholesome).
- [x] **Book-style browsing:** entries render two-per-spread like an actual photo album, with a page-flip animation and dot-style page indicators; tapping an entry opens a full-size detail view with the media, caption, date, and tag.
- [x] **Local-first sync:** every create/delete updates the on-screen list and `localStorage` immediately, then syncs to the database in the background via `/api/scrapbook/books` and `/api/scrapbook/entries` — if the DB call fails, the memory still shows up and persists locally instead of disappearing.
- [x] *Fixed during this review:* the `scrapbook_entries` schema (`sql/001_schema.sql`) defines `cat_id UUID NOT NULL`, and `POST /api/scrapbook/entries` used to look up `cats WHERE owner_id = $1 LIMIT 1` and silently pass `null` if the user had no cat yet, which would have failed the `NOT NULL` constraint against a real database. The route now returns a `400 "Add a cat profile before creating scrapbook entries."` instead of attempting that insert — the entry still appears locally via the local-first fallback, but the DB sync no longer throws an unhandled constraint violation.

### Reminders
- [x] Categorized tasks (feeding/health/play/grooming/vet/other) with priority levels, recurrence, completion tracking, and a completion-rate ring chart
- [x] A reminder-check endpoint (`POST /api/reminders/schedule`) exists on the backend — checks whether a reminder is due, marks it done, and auto-creates the next occurrence if it's recurring — though the current Reminders dashboard list runs on local state rather than calling that endpoint yet

### Platform, Security & AI-Agent Integration
- [x] CSP/HSTS/X-Frame-Options security headers on every response, parameterized SQL throughout, JWT + bcrypt (cost 12) auth
- [x] OAuth 2.0 authorization server (RFC 6749 Authorization Code + PKCE S256, RFC 7591 Dynamic Client Registration, RFC 9728 Protected Resource/Authorization Server metadata)
- [x] MCP (Model Context Protocol) server exposing 6 tools — list cats, get cat health, get cat location, get scrapbook, get reminders, create reminder — so AI agents like Claude can query a cat's data through an authenticated connector
- [x] Android app via Capacitor, wrapping the same web dashboard in a native shell
- [x] *Removed during this review:* Temporal (durable workflow orchestration) has been dropped from the project entirely. It previously backed 4 workflows (`pairEsp32Workflow`, `reminderSchedulerWorkflow`, `gpsMonitoringWorkflow`, `behaviorAnalysisWorkflow`), but none of them were actually invoked by any page in the dashboard UI — each one sat behind an API route that nothing called, so the durability/retry machinery added dependency weight (`@temporalio/*`, a separate worker process, a running Temporal server) without being exercised anywhere in the live request path. `src/temporal/` has been deleted, the `@temporalio/*` packages and `temporal:worker`/`temporal:dev` scripts removed from `package.json`, and the three API routes that used to start Temporal workflows (`/api/esp32/pair`, `/api/reminders/schedule`, `/api/gps/monitor`) now do the same DB work directly as plain async functions — same request/response contract, no workflow engine in between.
- [x] *Removed during this review:* Aikido Zen Firewall has also been dropped from the project entirely. It was loaded via a Next.js `instrumentation.ts` hook at server startup (`src/instrumentation.ts`, now deleted), and its package (`@aikidosec/firewall`) has been removed from `package.json` and `next.config.ts`'s `serverExternalPackages` list. The application-level security controls it complemented — parameterized SQL queries, CSP/HSTS/X-Frame-Options headers, JWT + bcrypt auth, and PIN input validation — are all still in place and unaffected; only the third-party runtime firewall layer itself is gone.
- [x] *Current limitation:* `/api/esp32/pair`, `/api/reminders/schedule`, and `/api/gps/monitor` all have working routes, but no page in the dashboard UI currently calls any of the three — the Setup wizard's "pair device" step and the Map/Reminders pages use their own separate local logic instead.
- [x] *Fixed during this review (previously listed as limitations/bugs):*
  - **MCP tool `list_cats` cross-user data exposure** — the query had no `WHERE owner_id = ...` clause, so any authenticated MCP client could read every user's cats. Fixed by threading the authenticated `userId` from `withMcpAuth`'s token validation into the tool's `extra.authInfo.extra.userId` and adding `WHERE owner_id = $1` to the query.
  - **MCP tool `get_reminders` `include_done` logic bug** — the old query built `WHERE done = false ${doneFilter ? "" : "OR true"}`, which always evaluated to `OR true` and ignored the flag. Fixed by scoping to the authenticated `owner_id` and conditionally appending `AND done = false` only when `include_done` is false.
  - **`GET /api/debug-oauth` unauthenticated OAuth metadata leak** — removed the route entirely (it was already marked in its own source comment as temporary/to-delete).
  - **Scrapbook entry creation with no cat yet** — `POST /api/scrapbook/entries` used to silently pass `cat_id = null`, which would fail the schema's `NOT NULL` constraint against a real database. It now returns a `400` with a clear message ("Add a cat profile before creating scrapbook entries") instead of attempting the insert.

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16.2.9, React 19.2.4, Tailwind CSS 4 |
| Mobile | Capacitor 8 (Android), wraps the deployed web app in a WebView |
| Backend / API | Next.js API routes (Route Handlers) |
| Database | PostgreSQL / Neon serverless (`@neondatabase/serverless`), raw parameterized SQL, no ORM |
| Auth | bcryptjs (cost 12) + jsonwebtoken (custom JWT) |
| Security | CSP/HSTS/X-Frame-Options headers, parameterized SQL, input validation |
| Maps / Geo | Leaflet.js + react-leaflet, OpenStreetMap (CartoDB dark tiles), Nominatim geocoding, Overpass API (vet search), browser Geolocation API |
| AI-agent integration | `mcp-handler` (MCP server) behind a custom OAuth 2.0 authorization server |
| Hardware / Firmware | ESP32-CAM (AI-Thinker, OV2640 camera), Arduino/C++ firmware |
| Deployment | Vercel (`purrdict.vercel.app`) |

## 5. Technical Architecture

```
┌────────────────────────────┐        WiFi/HTTP        ┌───────────────────────────────┐
│      ESP32-CAM COLLAR      │ ───────────────────────▶│        NEXT.JS 16 SERVER        │
│  OV2640 camera              │  MJPEG stream (port 81) │  API Routes                     │
│  Frame-diff motion sensing  │  POST sensor data /60s  │  CSP/HSTS security headers      │
└────────────────────────────┘  → /api/esp32/data       │  JWT auth (bcrypt)               │
                                                          └───────────────┬─────────────────┘
                                                                          │
                                       ┌──────────────────────────────────┼─────────────────────┐
                                       ▼                                  ▼                     ▼
                          ┌─────────────────────────┐      ┌───────────────────────┐  ┌────────────────────┐
                          │   OPENSTREETMAP APIs     │      │   POSTGRESQL / NEON    │  │  OAuth 2.0 / MCP    │
                          │   Nominatim (geocoding)   │      │  users, cats,          │  │  RFC 6749/7591/     │
                          │   Overpass (vet search)   │◀────▶│  esp32_devices,        │  │  7636/9728           │
                          │                            │      │  sensor_readings,      │  │  Claude Connector    │
                          │                            │      │  behavior_events,      │  └────────────────────┘
                          └─────────────────────────┘      │  gps_logs, emotions,   │
                                                             │  scrapbook, reminders  │
                                                             └───────────┬────────────┘
                                                                         │
                                                                         ▼
                                              ┌───────────────────────────────────────────┐
                                              │   FRONTEND (React 19 + Tailwind CSS 4)      │
                                              │   Dashboard, Cam, GPS Map (Leaflet/OSM),     │
                                              │   Needs, Health, Scrapbook, Reminders        │
                                              └───────────────────────────────────────────┘
                                                                         ▲
                                                                         │  same deployed
                                                                         │  web app in a
                                                                         │  WebView
                                                             ┌───────────┴────────────┐
                                                             │  ANDROID APP (Capacitor) │
                                                             └─────────────────────────┘
```

**Data flow:** The ESP32-CAM captures frames, estimates motion intensity from JPEG frame-size differencing (a proxy for ODBA, per Ikurior et al. 2023), and POSTs that reading to `/api/esp32/data` roughly once a minute. That route looks up or auto-registers the device, classifies behavior from motion-intensity thresholds (e.g. `>80% → running`, `40–60% → walking`, `<5% → resting`), derives a 5-emotion score from the classified behavior (`src/lib/emotion.ts`, Nicholson & O'Carroll 2021), and writes both to the `sensor_readings`/`behavior_events` tables and the `emotion_assessments` table via plain parameterized Postgres queries. The Cat Cam page separately proxies the ESP32's live MJPEG stream through `/api/esp32/stream` to avoid mixed-content/CORS issues, since the ESP32 only serves plain HTTP. Device pairing, GPS logging, and reminder scheduling (`/api/esp32/pair`, `/api/gps/monitor`, `/api/reminders/schedule`) are also plain async DB-backed routes — Temporal was evaluated for durable orchestration here but removed, since none of the three routes were actually being called by any dashboard page, so the added dependency (a separate worker process, a running Temporal server) wasn't earning its keep. The Vet Finder now calls out to two OpenStreetMap services at request time: Nominatim to geocode a free-text search into coordinates, and Overpass to find real veterinary clinics near those coordinates. The Android app doesn't contain separate app logic — it's a Capacitor WebView shell (`appId: app.purrdict.cat`) that loads the same deployed site at `purrdict.vercel.app`, so the web dashboard is the single source of truth for all clients. The database layer has an explicit "demo mode": if `DATABASE_URL` isn't set, API routes return safe canned/empty responses instead of failing, which is what powers the one-click Demo Mode experience.

## 6. Testing Matrix

| Feature / Flow | Steps | Expected Result | Actual Result | Pass / Fail |
|---|---|---|---|---|
| Production build | Run `npm run build` | Next.js compiles and generates all static + dynamic routes with 0 errors | Verified directly: build completed in ~20s, TypeScript check passed, 32 routes generated (12 static, 8 dynamic API, plus OAuth/well-known routes), exit code 0 | Pass |
| ESP32 behavior classification | POST `{ motionIntensity: 90 }` to `/api/esp32/data` | Behavior classified as "running" with ~0.93 confidence | Confirmed by reading the route's threshold logic (`>80 → running, 0.93`) | Pass (verified in code) |
| ESP32 behavior classification | POST `{ motionIntensity: 2 }` to `/api/esp32/data` | Behavior classified as "resting" (default), confidence 0.90 | Confirmed in code — falls through all thresholds to the default "resting" branch | Pass (verified in code) |
| Cat card CRUD | Create, edit, delete a cat card | Card persists via `/api/cats`, updates via PATCH, removes via DELETE | Confirmed in code — real DB-backed CRUD scoped to the authenticated owner | Pass (verified in code) |
| Scrapbook album + entry | Create a book, add a photo entry | Entry saved via `/api/scrapbook/entries`, visible on next load; falls back to local-only storage if DB is unreachable | Confirmed in code — optimistic local update + background DB sync with silent fallback | Pass (verified in code) |
| Live Cat Cam stream | Open Dashboard → Cam with a reachable ESP32 IP configured | MJPEG stream renders via `/api/esp32/stream` proxy, LIVE badge shown | Not run against physical hardware during this review — needs a live ESP32 on the same network to confirm end-to-end | Not yet verified |
| GPS map | Open Dashboard → Map | Cat marker moves along a realistic wandering path inside (mostly) the geofence | Improved and confirmed in code — the marker now follows a **random-waypoint walk model** (pick destination → walk at mode-dependent speed → rest/groom pause → repeat), updated every 400ms, instead of teleporting between a fixed list of points; still not live GPS from hardware | Pass (as a demo), flagged as simulated |
| GPS distance-from-home + away alert | Let the simulated path move the cat past 80m from home | Distance readout updates in meters, badge flips from "● SAFE ZONE" to "⚠ OUTSIDE" once past the geofence radius | Confirmed in code — distance is computed live via an equirectangular lat/lng-to-meters formula and compared against `GEOFENCE_RADIUS = 80`; badge and progress bar color both flip correctly at the threshold | Pass (verified in code) |
| Vet Finder live search | Search a city via the Vet Finder modal | `GET /api/vets/search` geocodes the query and returns real nearby veterinary clinics from OpenStreetMap, sorted nearest-first | Fixed and confirmed in code — route geocodes via Nominatim then queries Overpass API for `amenity=veterinary`, computes haversine distance server-side, sorts ascending; replaces the old hardcoded `WORLDWIDE_VETS` dataset entirely | Pass (verified in code, `npx next build` succeeds with 0 errors) |
| Vet Finder booking action | Open a clinic's detail view | Call and Directions buttons work | Confirmed in code — "Call Now" is a `tel:` link shown only when OpenStreetMap has a phone number for that clinic (shows "NO PHONE LISTED" otherwise), "Directions" opens Google Maps with the clinic's address; no in-app appointment scheduling exists, by design | Pass (verified in code) |
| Reminders list | Add / complete / delete a reminder | Change reflects immediately and persists after refresh | Confirmed in code — reminders currently live only in in-memory React state; the change reflects immediately but **does not persist after a page refresh**, even though a working `/api/reminders/schedule` endpoint exists for reminders elsewhere in the app | Fail — UI not yet wired to the persistence layer |
| Needs predictor / Health monitor | Open Dashboard → Needs / Health | Metrics reflect actual sensor history | Confirmed in code — Needs Predictor renders a fixed sample dataset, and Health Monitor generates random values on every page load; neither reads from the real `sensor_readings`/`behavior_events` tables yet | Pass (as a demo), flagged as simulated |
| Device pairing | POST 6-char alphanumeric PIN to `/api/esp32/pair` | Verifies the PIN against `esp32_devices` and claims the device for the owner/cat, returns `deviceId` on success | Input validation (length, alphanumeric regex) confirmed in code; route is now a plain DB-backed function (Temporal removed) with no external service dependency to exercise end-to-end | Pass (verified in code) |
| Emotion assessment pipeline | POST a sensor reading to `/api/esp32/data`, then `GET` it back | An emotion score (fear/anger/joy/contentment/interest + posture/tail/ear/eye/vocalization) is persisted to `emotion_assessments` and returned as `data.emotion` | Fixed and confirmed in code — `deriveEmotionScores()` runs for every behavior event with a linked cat, and the GET handler now selects the latest row; dashboard renders it instead of a client-side lookup | Pass (verified in code) |
| MCP tool `list_cats` scoping | Call `list_cats` as an authenticated MCP client | Returns only the calling user's cats | Fixed and confirmed in code — the tool now reads `userId` from `extra.authInfo.extra.userId` (set by `withMcpAuth`'s token validator) and the query filters `WHERE owner_id = $1` | Pass (verified in code, `npx next build` succeeds with 0 errors) |
| MCP tool `get_reminders` filter | Call `get_reminders` with `include_done: false` | Returns only reminders where `done = false` | Fixed and confirmed in code — the query now scopes to `WHERE owner_id = $1` and conditionally appends `AND done = false` only when `include_done` is false, so completed reminders are excluded by default | Pass (verified in code, `npx next build` succeeds with 0 errors) |
| `/api/debug-oauth` exposure | `GET /api/debug-oauth?client_id=<any>` with no auth header | Request is rejected or requires authentication | Fixed — the route was deleted entirely; `npx next build` output no longer lists `/api/debug-oauth` among the generated routes | Pass |
| Scrapbook entry without a cat yet | `POST /api/scrapbook/entries` for a user with no cat profile | Request is rejected with a clear error instead of a raw DB constraint failure | Fixed and confirmed in code — the route now checks for an existing cat and returns `400 "Add a cat profile before creating scrapbook entries."` if none exists | Pass (verified in code) |

*Note: "flagged as simulated" rows are working, demo-safe features (they render correctly and won't crash), but the underlying data isn't yet coming from live hardware/database — see Future Improvements for the plan to close each gap.*

## 8. Future Improvements

**Bugs fixed during this code review (previously listed here as open issues):**
- [x] Scoped the MCP `list_cats` tool query to the authenticated user's `owner_id` — it now requires a valid `userId` from the OAuth token and filters `WHERE owner_id = $1`
- [x] Fixed the `get_reminders` MCP tool's `include_done` filter — replaced the always-true `WHERE done = false ${doneFilter ? "" : "OR true"}` clause with a properly scoped, conditional filter
- [x] Removed `GET /api/debug-oauth` — it exposed OAuth client metadata with no access control and is no longer part of the build
- [x] Handled the case where a scrapbook entry is created before the user has any cat — `POST /api/scrapbook/entries` now returns a `400` instead of inserting a `null` into the `NOT NULL cat_id` column

**Changes made in this pass:**
- [x] Removed Temporal entirely — `src/temporal/`, `@temporalio/*` dependencies, and the `temporal:worker`/`temporal:dev` scripts are gone. `/api/esp32/pair`, `/api/reminders/schedule`, and `/api/gps/monitor` now do the same work as plain async DB functions with the same request/response contract, since none of the three routes were actually being called from the UI and the workflow engine wasn't earning its keep.
- [x] Removed Aikido Zen Firewall entirely — `src/instrumentation.ts` (the hook that loaded it at server startup) and the `@aikidosec/firewall` dependency are gone, along with its entry in `next.config.ts`'s `serverExternalPackages`. Application-level protections it complemented (parameterized SQL, security headers, JWT + bcrypt, input validation) are untouched.
- [x] Replaced the GPS map's fixed-waypoint teleport simulation with a random-waypoint walk model (destination picking, mode-dependent speed, rest/groom pauses, smooth 400ms-tick interpolation) — still simulated, but no longer visibly "jumping."
- [x] Built a live `/api/vets/search` route (Nominatim geocoding + Overpass API clinic lookup) and removed the hardcoded `WORLDWIDE_VETS` dataset — Vet Finder now returns real clinics for any location worldwide.
- [x] Built a real emotion-assessment pipeline (`src/lib/emotion.ts`) that scores and persists to `emotion_assessments` on every behavior event, replacing the old client-side lookup keyed off the on-screen behavior label.

**Wire up what's already built:**
- [ ] Connect the Setup wizard's "pair device" step, the Reminders page, and the Map page to their existing endpoints (`/api/esp32/pair`, `/api/reminders/schedule`, `/api/gps/monitor`) — all three work standalone, but nothing in the UI currently calls them
- [ ] Wire the Reminders dashboard UI to `/api/reminders/schedule` and the `reminders` table so tasks persist across sessions instead of resetting on refresh

**Replace simulated data with real sensors:**
- [ ] Add an actual accelerometer/gyroscope (e.g. MPU6050) and GPS module to the ESP32 firmware — the current hardware only has a camera and does frame-size motion differencing; there is no IMU or GPS chip in the firmware today despite the Setup wizard and Health page referencing them
- [ ] Replace Health Monitor's `Math.random()` metrics and the Needs Predictor's static `mockData.ts` array with real aggregates from `sensor_readings` / `behavior_events`
- [ ] Replace the GPS map's simulated coordinate generation with real ESP32 GPS readings, once that hardware exists — the random-waypoint model is a much more realistic stand-in, but it's still not live GPS
- [ ] Compute the Wellness Check panel's score from an actual 14-day rolling baseline over `behavior_events`/`emotion_assessments`, instead of the current static "Score: 0/10 — No Anomalies"

**Polish:**
- [ ] Add push notifications for geofence breaches and wellness anomaly alerts instead of requiring the dashboard to be open
- [ ] Add automated integration tests around the `/api/esp32/*` and `/api/vets/search` routes (currently verified only by manual code review and build checks)
- [ ] Cache or rate-limit `/api/vets/search` calls to stay within Nominatim/Overpass's public usage policies under heavier traffic

## 9. Tools You Used

- [x] Kiro (AI coding assistant) — used throughout development per the hackathon's tooling requirement
- [ ] _[Add any design tools, recording software, or other assistants your team used]_

*Note: Aikido Zen was used earlier in development (see Day 6 of the appendix log) but was removed from the final submission — see Future Improvements. If Aikido was a required hackathon technology for this track, confirm with organizers whether that requirement still needs to be satisfied before submitting.*

## 11. Learnings & Takeaways

Building Purrdict end-to-end in under two weeks (per the team's day-by-day log) surfaced a few concrete lessons: mapping sensor signals to cited research constrained the design in a good way — it forced concrete, falsifiable thresholds (e.g. motion-intensity bands) instead of vague "AI detects X" claims. We initially integrated Temporal for workflows that must survive restarts (device pairing, GPS monitoring, reminders), but a later review found none of those workflows were actually wired into the dashboard UI — the durability/retry machinery wasn't earning its keep against the added operational surface (a separate worker process, a running Temporal server), so we removed it and kept the same routes as plain, directly-testable async functions. The same review removed Aikido Zen Firewall for a similar reason — it added a third-party runtime dependency without us having verified it against a real threat model for this project, so we consolidated on the application-level protections we could directly reason about (parameterized SQL, CSP/HSTS headers, JWT + bcrypt, input validation). Wiring a real Leaflet/OpenStreetMap view exposed SSR and hydration pitfalls specific to Next.js that needed a direct-API workaround instead of `react-leaflet`'s declarative components. Building the demo-mode fallback into every API route early (instead of bolting it on later) made it much easier to keep shipping UI before every backend piece (real GPS hardware, live sensor feeds) was fully wired up. _[Team: expand with your own reflections — what surprised you, what you'd do differently.]_

## 12. Acknowledgments

- Research citations: 17 peer-reviewed papers underpin the behavior, emotion, and health features (see full list with DOIs in `README.md`), including Ikurior et al. 2023, Evangelista et al. 2019/2023, and Nicholson & O'Carroll 2021.
- Open-source: Next.js, React, Leaflet, OpenStreetMap/CartoDB tile data, Nominatim, Overpass API, `mcp-handler`.
- _[Add any mentors or hackathon organizers you'd like to credit.]_

---

## Submission Checklist

- [ ] Video demo (HD or at least 720p)
- [ ] README.md (prerequisites, run instructions, configuration) — already present at project root
- [x] Project report (this document, in `documentation/`)
- [ ] Source code in `src/` — already present at project root
- [ ] No unrelated files, executables, auto-generated code, or package folders (e.g. `node_modules/`, `build/`, `dist/`, `vendor/`) — confirm these are excluded from the submission zip before uploading

---

## Appendix: Development Progress Log (REPORT.md)

*The section below is the team's original day-by-day development log, kept for reference.*

# Purrdict - Development Progress Report

> Hackathon: #hackthekitty 2026
> Period: June 25 - July 7, 2026

---

*Note: this appendix is the team's original day-by-day log and is kept as-is for historical accuracy — including Day 6's Temporal and Aikido Zen integration. Both were later removed from the project (see Section 8, Future Improvements): Temporal because none of its workflows were actually being called from the dashboard UI, and Aikido Zen Firewall as an unused third-party runtime dependency.*

### System Architecture (original, as of Day 13)

```
ESP32 COLLAR              NEXT.JS 16 SERVER           POSTGRESQL
(Accelerometer,           (API Routes,                (users, cats,
 Gyroscope, GPS,    WiFi   JWT Auth,             SQL   behavior_events,
 Camera OV2640) --------> Aikido Zen Firewall ------> gps_logs, emotions,
                           Temporal Client)            reminders, scrapbook,
                                |                      esp32_devices,
                                |                      cam_clips,
                                v                      research_refs)
                          TEMPORAL SERVER
                          (pairEsp32Workflow,
                           gpsMonitorWorkflow,
                           reminderScheduler,
                           behaviorAnalysis)

FRONTEND                  LEAFLET MAP
(React 19,                (OpenStreetMap,
 Tailwind CSS 4,           CartoDB Dark Tiles,
 Auth Context,             Geofence Circle,
 LocalStorage) ---------> Trail + Markers)
```

#### Data Flow (original, as of Day 13)

```
ESP32 sensors (50Hz) --> WiFi POST --> API Route --> Aikido validates
  --> Temporal workflow --> PostgreSQL (stores with paper reference)
  --> Frontend displays (behavior + confidence + research citation)
```

See Section 5 (Technical Architecture) above for the current architecture, post-Temporal-removal and post-Aikido-removal.

---

### Day 1 - June 25 (Wed): Ideation

Attended the hackathon kick-off. Theme: cats. Must use Aikido, Temporal, Kiro.
Judging: Technical 25%, Innovation 20%, Theme 15%, Security 15%, UI 15%, Docs 10%.

Brainstormed concepts. Rejected: cat social media (exists), smart toy (limited),
litter tracker (no demo). Winner: ESP32 smart collar that monitors behavior
using published research methods, not generic AI.

Named it Purrdict. Decided on Next.js 16 + PostgreSQL + Temporal + Aikido +
Leaflet + bcrypt/JWT. Set up repo, installed deps, got skeleton running.

---

### Day 2 - June 26 (Thu): Research

Full day reading papers. Found 17 peer-reviewed publications:

BEHAVIOR CLASSIFICATION:
1. Ikurior et al. 2023 - Accelerometer + Random Forest, >86% accuracy
   https://www.mdpi.com/1424-8220/23/16/7165
2. Tattersall et al. 2021 - SOM models, >95% Kappa
   https://link.springer.com/10.1038/s41598-021-92896-4
3. Mealin et al. 2024 - 28 cats, 8 behaviors quantified
   https://pmc.ncbi.nlm.nih.gov/articles/PMC11053832/
4. Uddin et al. 2024 - CNN-LSTM on embedded collar
   https://www.mdpi.com/1424-8220/24/23/7436
5. Delgado et al. 2023 - Gyroscope adds 35% accuracy
   https://www.mdpi.com/2076-2615/13/1/120
6. Ladha et al. 2013 - ML on constrained collar tags
   https://www.researchgate.net/publication/319605380

EMOTION AND PAIN:
7. Nicholson & O'Carroll 2021 - 5 feline emotions defined
   https://pmc.ncbi.nlm.nih.gov/articles/PMC7995744/
8. Evangelista et al. 2019 - Feline Grimace Scale, 91% sensitivity
   https://www.nature.com/articles/s41598-019-55693-8
9. Evangelista et al. 2023 - Pain ethogram, 10 categories
   https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0292224
10. Kumpulainen et al. 2024 - Full domestic cat ethogram
    https://www.mdpi.com/2813-9372/1/3/21

ACTIVITY AND SLEEP:
11. Miyazaki et al. 2020 - Steps, jumps, sleep quality validated
    https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0236795
12. Piccione et al. 2013 - Crepuscular pattern (dawn/dusk peaks)
    https://pubmed.ncbi.nlm.nih.gov/3843546/
13. De Saix et al. 2025 - Light affects behavior + cortisol
    https://pmc.ncbi.nlm.nih.gov/articles/PMC12182317/

HARDWARE:
14. Chambers et al. 2022 - Open-source collar spatial tracking
    https://www.nature.com/articles/s41598-022-22167-3
15. Zhang et al. 2020 - UWB radar vital signs through fur
    https://www.mdpi.com/2076-2615/10/2/205
16. Nunes et al. 2024 - ECG vest for cat arrhythmia
    https://link.springer.com/chapter/10.1007/978-3-031-46933-6_38
17. Ding et al. 2025 - Comprehensive wearable sensor review
    https://pmc.ncbi.nlm.nih.gov/articles/PMC12300563/

Mapped each paper to a feature. Defined behavior categories and detection methods.

---

### Day 3 - June 27 (Fri): Design System + Landing Page

Created the visual identity: pixel art aesthetic with Press Start 2P font,
warm cream/cocoa/pink/mint palette. Built CSS custom properties, keyframe
animations (bob, blink, scan, twinkle, walk), and utility classes
(pixel-border, glass-card, pixel-press).

Built the PixelCat SVG component (48x40 pixel art cat).

Built 6 landing page sections: Nav, Hero (with live tracking scene),
Levels (how it works), Showcase (cam + map + scrapbook preview),
States (emotion ethogram cards with research citations), CTA + footer.

---

### Day 4 - June 28 (Sat): Dashboard Pages

Built the dashboard shell: layout with bottom nav (5 tabs), TopBar with
cat info and live badge.

Created pages:
- Live status: behavior detection feed, activity sparkline, breakdown bars
- Cam: ESP32 camera simulation with scanlines, controls (mute/rec/snap)
- Map: indoor room layout with trail and emoji pins
- Needs: prediction cards sorted by likelihood
- Health: 7-day baseline chart, stats table, alert banner

All using mock data shaped to match future API responses.

---

### Day 5 - June 29 (Sun): Auth + Database

Wrote PostgreSQL schema (sql/001_schema.sql): 11 tables including users,
cats, esp32_devices, gps_logs, behavior_events, emotion_assessments,
cam_clips, scrapbook_entries, reminders, research_references.
All with proper indexes, constraints, and auto-update triggers.

Built API routes:
- POST /api/auth/signup - validates, hashes (bcrypt cost 12), returns JWT
- POST /api/auth/login - verifies password, loads cats, returns JWT
- POST /api/cats - create cat profile
- PATCH /api/cats/[id] - update cat
- DELETE /api/cats/[id] - remove cat

Built login + signup pages. Created AuthContext with localStorage persistence
and API calls in background.

---

### Day 6 - June 30 (Mon): Temporal + Aikido

Installed Temporal SDK. Created 4 workflows:
- pairEsp32Workflow: verify PIN, claim device, retry 5x with backoff
- reminderSchedulerWorkflow: check due, mark done, create next recurrence
- gpsMonitoringWorkflow: log coords every 10s, check geofence, run for hours
- behaviorAnalysisWorkflow: classify, log, auto-clip if confidence >80%

Installed Aikido Zen Firewall via instrumentation.ts hook.
Added security headers: CSP, HSTS, X-Frame-Options, X-XSS-Protection,
Permissions-Policy. All queries parameterized. PIN validation regex.

---

### Day 7 - July 1 (Tue): Research Integration

Replaced generic mock data with research-grounded detections. Each behavior
now shows: sensor signature description, confidence %, paper citation, method.

Built Feline Grimace Scale panel (5 action units from Evangelista 2019).
Built emotion assessment using Nicholson 2021 (5 emotions + indicators).
Built circadian rhythm chart based on Piccione 2013 (crepuscular peaks).
Built scrapbook page (book-style with spine, pages, polaroids).

---

### Day 8 - July 2 (Wed): Real Map + Reminders

Replaced fake grid map with real Leaflet/OpenStreetMap. Dark CartoDB tiles,
geofence circle (dashed green, 100m), trail polyline (yellow dashed),
emoji markers with popups, pulsing current-position dot.

Fixed Leaflet SSR issue by using direct API import instead of react-leaflet.
Added invalidateSize() workaround for tile loading after React hydration.

Built reminders page: categories (feeding/health/play/grooming/vet/other),
priorities (high/med/low), recurring support, completion tracking.

---

### Day 9 - July 3 (Thu): Onboarding + Cat Cards

Built 4-step setup wizard: PIN entry -> name cat -> preview card -> done.
PIN input: 6 boxes, auto-focus, backspace navigation, connection simulation.
Cat profile: SVG icon picker, photo upload, breed, age, fur color swatches.
Card preview: trading card style with color band, stats grid, PIN display.

Built CatCardList on dashboard with EDIT modal and DELETE functionality.
Fixed critical bug: addCat failed silently when user was null. Fixed by
creating guest user on the fly if needed.

---

### Day 10 - July 4 (Fri): Landing Redesign

Redesigned Hero: dark live-tracking scene with SVG path, glass pin badges,
pulsing cat marker, status bar.

Split Showcase into two sections: Spy Cam (full-width cam + map below)
and Scrapbook (book-style preview with dot paper, polaroids, spine).

Updated nav with Login/Signup buttons. Added backdrop blur.

---

### Day 11 - July 5 (Sat): Sign Out + Observation Feed

Added sign out button to TopBar. Clears state + localStorage + JWT.

Overhauled dashboard: now shows ESP32 collar observations as a live feed.
Each detection has: behavior name, sensor description (e.g. 'Rhythmic Y-axis
pattern 0.8-1.2Hz'), confidence bar, research method citation.

Simulates new observations every 30s. 10 behavior types with detailed
accelerometer descriptions from the papers.

---

### Day 12 - July 6 (Sun): Polish + Fixes

Fixed GPS map rendering (tiles only half-loaded). Rewrote GpsMap component
using direct Leaflet API with proper mount timing.

Increased all UI sizes for desktop (was too small at max-w-md).
Layout -> max-w-2xl, bigger fonts, taller bars, more padding throughout.

Updated landing page: removed all AI language, replaced with research
citations. Levels now cite specific papers. States section shows the
actual ethogram with paper links. Footer: 'PURRDICT RESEARCH' not 'AI'.

---

### Day 13 - July 7 (Mon): Documentation + Submission

Wrote README.md: architecture, setup guide, 17 paper citations with DOIs,
security documentation, Temporal workflow descriptions.

Wrote this progress report.

Final build: 0 errors, 20 routes (12 static + 8 dynamic API).

---

### Summary (as of Day 13, before the Temporal-removal review)

- 17 research papers integrated
- 8 API routes
- 4 Temporal workflows
- 11 database tables
- 7 dashboard pages
- Real OpenStreetMap GPS tracking
- Aikido Zen Firewall runtime protection
- Full auth flow with cat card CRUD
- 0 build errors

### Post-review update

- Temporal removed — 0 workflows, same routes now plain async functions
- Aikido Zen Firewall removed — `instrumentation.ts` hook and dependency deleted
- Live `/api/vets/search` route added (Nominatim + Overpass API)
- GPS map simulation upgraded to a random-waypoint walk model
- Real, DB-backed emotion-assessment pipeline (`src/lib/emotion.ts`)
- 0 build errors (`npx next build`, verified after every change)
