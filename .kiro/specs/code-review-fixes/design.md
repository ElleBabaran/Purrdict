# Design — Code Review & Hardening Pass

## Overview

This pass touches authorization on the MCP surface, removes two dependencies (Temporal, Aikido
Zen Firewall) that were present but unused/unvalidated, and upgrades three previously-simulated
or hardcoded features to real server-backed implementations. No new services are introduced;
everything lands as plain async functions inside existing Next.js API routes.

## 1. MCP authorization scoping

- `withMcpAuth`'s token validator already resolves the authenticated principal; the fix is to
  thread that `userId` through to `extra.authInfo.extra.userId` and use it in every tool handler.
- `list_cats`: add `WHERE owner_id = $1` bound to the resolved `userId`. Previously this clause
  was missing entirely, so any authenticated MCP client could enumerate every user's cats.
- `get_reminders`: previous query built the filter as
  `WHERE done = false ${doneFilter ? "" : "OR true"}`, which evaluates to `OR true` whenever
  `include_done` is anything other than a value that makes `doneFilter` truthy — in practice this
  always matched all rows regardless of the flag. Fix: scope to `WHERE owner_id = $1` and only
  append `AND done = false` when `include_done === false`.

## 2. Debug route removal

`GET /api/debug-oauth` is deleted outright (it was already marked in its own source comment as
temporary). No replacement route — OAuth metadata is served through the standard RFC 9728
`.well-known` endpoints only.

## 3. Scrapbook null cat_id guard

`POST /api/scrapbook/entries` currently does
`SELECT id FROM cats WHERE owner_id = $1 LIMIT 1` and passes the result (possibly `null`) as
`cat_id` into an insert against a `NOT NULL` column. Fix: check for a missing cat before the
insert and return `400 { error: "Add a cat profile before creating scrapbook entries." }`. The
scrapbook's local-first behavior on the client is unaffected — the entry still appears in
`localStorage` immediately; only the background DB sync gets a clean error instead of an
unhandled constraint violation.

## 4. Temporal & Aikido removal

**Temporal:** delete `src/temporal/` and the four workflow definitions
(`pairEsp32Workflow`, `reminderSchedulerWorkflow`, `gpsMonitoringWorkflow`,
`behaviorAnalysisWorkflow`). Remove `@temporalio/*` from `package.json` along with the
`temporal:worker` / `temporal:dev` scripts. The three routes that used to start a workflow
(`/api/esp32/pair`, `/api/reminders/schedule`, `/api/gps/monitor`) keep their existing
request/response contract but perform the DB write directly instead of dispatching a workflow.
Rationale: none of the four workflows were invoked from any dashboard page, so the
retry/durability machinery added a worker process and a running Temporal server without being
exercised in the live request path.

**Aikido Zen Firewall:** delete `src/instrumentation.ts` (the Next.js instrumentation hook that
loaded it at startup) and remove `@aikidosec/firewall` from `package.json` and from
`next.config.ts`'s `serverExternalPackages`. Application-level protections (parameterized SQL,
CSP/HSTS/X-Frame-Options headers, JWT + bcrypt, PIN input validation) are untouched — this
removal only drops the third-party runtime firewall layer.

## 5. Live vet search

New route `GET /api/vets/search`:
1. Accept either a free-text `location` query param or direct `lat`/`lng`.
2. If free-text, geocode via Nominatim (`https://nominatim.openstreetmap.org/search`).
3. Query Overpass API for nodes/ways tagged `amenity=veterinary` within `radius` (default
   15000m, clamped to a max of 50000m) of the resolved coordinates.
4. Compute haversine distance server-side from the search origin to each result, sort ascending.
5. Map OSM tags (`name`, `addr:*`, `phone`, `opening_hours`, `website`) into the response shape
   the existing `health/page.tsx` UI expects.
6. Delete the `WORLDWIDE_VETS` hardcoded object and its lookup function from `health/page.tsx`;
   the Vet Finder modal calls this route for every search instead.

No API key is required for Nominatim/Overpass, but both have public usage policies — this is
tracked as a follow-up to add caching/rate-limiting (see tasks.md and the Future Improvements
section of `documentation/PROJECT_REPORT.md`), not part of this pass's scope.

## 6. Server-side emotion pipeline

New module `src/lib/emotion.ts` exporting `deriveEmotionScores(behavior, motionIntensity, ...)`
implementing the Nicholson & O'Carroll 2021 five-emotion ethogram (fear, anger, joy,
contentment, interest) plus derived posture/tail/ear/eye/vocalization indicators. Wire this into
`POST /api/esp32/data`: after classifying and logging a `behavior_events` row for a cat, call
`deriveEmotionScores` and insert the result into `emotion_assessments` in the same request.

`GET` side: the endpoint (or a new lightweight `GET` on the same resource) selects the latest
`emotion_assessments` row for the cat instead of the dashboard recomputing anything from the
currently-displayed behavior label. `dashboard/page.tsx`'s old `deriveEmotion()` client lookup is
kept only as a fallback for the case where no row exists yet (e.g. brand-new Demo Mode session),
using the same scoring function so the fallback and the real path never disagree.

## 7. GPS simulation upgrade

Replace the fixed-waypoint teleport (jump between a hardcoded list every 3s) with a
random-waypoint walk model in the map page's client-side simulation:
- Pick a random destination, mostly within the geofence radius, with an occasional longer
  excursion so the "outside geofence" alert path still gets exercised in the demo.
- Walk toward it at a mode-dependent speed: 0.3–0.6 m/s exploring, 0.5–1.0 m/s walking,
  1.2–2.2 m/s playing.
- On arrival, pause 4–16s (rest/groom), then pick a new destination.
- Interpolate position every ~400ms for smooth motion instead of discrete jumps.

The geofence math (equirectangular lat/lng-to-meters approximation, 80m radius check),
distance-from-home readout, and safe/outside badge logic are unchanged — only the coordinate
source feeding into them is upgraded. This remains an explicitly simulated stand-in until real
GPS hardware exists in the ESP32 firmware.

## Testing / verification approach

Given no physical ESP32/GPS hardware is available in this environment, verification is:
1. `npx next build` — must complete with 0 errors after each change (this is the project's
   standing bar for "verified" per the testing matrix in the PROJECT_REPORT).
2. Direct code reading of threshold/branch logic (e.g. behavior classification bands, geofence
   comparison, MCP query WHERE clauses) to confirm correctness where hardware-in-the-loop testing
   isn't possible.
3. For routes with no UI caller yet (`/api/esp32/pair`, `/api/reminders/schedule`,
   `/api/gps/monitor`), confirm the request/response contract is preserved by comparing against
   its pre-change behavior, since wiring the UI to call them is tracked separately (see tasks.md).
