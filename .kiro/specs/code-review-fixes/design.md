# Design — Code Review & Hardening Pass

## Overview

This pass touches authorization on the MCP surface and upgrades three previously-simulated or
hardcoded features to real server-backed implementations. No new services are introduced;
everything lands as plain async functions inside existing Next.js API routes.

## Architecture

No new services, workers, or infrastructure are introduced. Every change lands inside the
existing Next.js App Router request path:

- **MCP surface** (`src/app/api/mcp/`) — tool handlers gain an `owner_id`-scoped query pattern,
  sourcing `userId` from the already-authenticated `extra.authInfo.extra.userId`.
- **API routes** (`src/app/api/**/route.ts`) — `debug-oauth` is removed, `scrapbook/entries`
  gains a pre-insert guard, and a new `vets/search` route is added following the same
  parameterized-SQL / input-validation conventions as the rest of the routes.
- **Server-side library code** (`src/lib/`) — a new `emotion.ts` module is added and called
  synchronously from `POST /api/esp32/data`; no queueing or background processing is introduced.
- **Client-side simulation** (`dashboard/map/page.tsx`) — the GPS walk model changes are
  contained entirely to the client; no new network calls or server state are added by this item.

## Components and Interfaces

### 1. MCP authorization scoping

- `withMcpAuth`'s token validator already resolves the authenticated principal; the fix is to
  thread that `userId` through to `extra.authInfo.extra.userId` and use it in every tool handler.
- `list_cats`: add `WHERE owner_id = $1` bound to the resolved `userId`. Previously this clause
  was missing entirely, so any authenticated MCP client could enumerate every user's cats.
- `get_reminders`: previous query built the filter as
  `WHERE done = false ${doneFilter ? "" : "OR true"}`, which evaluates to `OR true` whenever
  `include_done` is anything other than a value that makes `doneFilter` truthy — in practice this
  always matched all rows regardless of the flag. Fix: scope to `WHERE owner_id = $1` and only
  append `AND done = false` when `include_done === false`.

### 2. Debug route removal

`GET /api/debug-oauth` is deleted outright (it was already marked in its own source comment as
temporary). No replacement route — OAuth metadata is served through the standard RFC 9728
`.well-known` endpoints only.

### 3. Scrapbook null cat_id guard

`POST /api/scrapbook/entries` currently does
`SELECT id FROM cats WHERE owner_id = $1 LIMIT 1` and passes the result (possibly `null`) as
`cat_id` into an insert against a `NOT NULL` column. Fix: check for a missing cat before the
insert and return `400 { error: "Add a cat profile before creating scrapbook entries." }`. The
scrapbook's local-first behavior on the client is unaffected — the entry still appears in
`localStorage` immediately; only the background DB sync gets a clean error instead of an
unhandled constraint violation.

### 4. Live vet search

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

### 5. Server-side emotion pipeline

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

### 6. GPS simulation upgrade

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

## Data Models

No schema migrations are required; every change reads or writes existing tables from
`sql/001_schema.sql`:

- **`cats`** (`owner_id`) — read by `list_cats` and the scrapbook guard, both now correctly
  scoped/checked against the authenticated user.
- **`reminders`** (`owner_id`, `done`) — read by `get_reminders` with the corrected
  `WHERE owner_id = $1 [AND done = false]` clause.
- **`scrapbook_entries`** (`cat_id NOT NULL`) — insert now guarded by an existence check on
  `cats` before the write.
- **`emotion_assessments`** (fear, anger, joy, contentment, interest, posture, tail, ear, eye,
  vocalization, `cat_id`, `created_at`) — new rows inserted by `deriveEmotionScores()` on every
  `POST /api/esp32/data` call that has a linked cat; `GET` reads the latest row per cat.
- **`behavior_events`** — unchanged read/write pattern, still the trigger for emotion derivation.
- No table backs the vet search response (`/api/vets/search` proxies Nominatim/Overpass directly
  and returns a mapped, non-persisted shape) or the GPS simulation (client-only state).

## Correctness Properties

### Property 1: Ownership scoping

Every MCP tool query must include `WHERE owner_id = $1` bound to
`extra.authInfo.extra.userId`; no query may return rows belonging to a different user.

**Validates: Requirements 1.1, 1.3**

### Property 2: `include_done` semantics

`get_reminders` must exclude completed reminders if and only if `include_done === false`; it
must never fall back to returning all rows regardless of the flag.

**Validates: Requirements 1.2**

### Property 3: No orphaned scrapbook entries

`POST /api/scrapbook/entries` must never attempt an insert with a `null` `cat_id`; the existence
check must run before the insert, not rely on the DB constraint to fail.

**Validates: Requirements 3.1**

### Property 4: Distance sorting

`/api/vets/search` results must be sorted ascending by the server-computed haversine distance
from the resolved search origin, not by whatever order Overpass returns.

**Validates: Requirements 4.2**

### Property 5: Geofence invariance

The GPS simulation upgrade must not change the equirectangular distance-to-meters formula or the
80m radius comparison — only the simulated coordinate feed changes; a point that would have been
"inside"/"outside" under the old waypoint model must still be classified the same way given the
same coordinates.

**Validates: Requirements 6.2**

### Property 6: Emotion/behavior consistency

The client-side `deriveEmotion()` fallback must use the same scoring function as the server-side
`deriveEmotionScores()`, so the two paths never disagree when both are available.

**Validates: Requirements 5.2**

## Error Handling

- `/api/scrapbook/entries`: returns `400 { error: "Add a cat profile before creating scrapbook
  entries." }` when no cat exists for the owner, instead of letting a `NOT NULL` constraint
  violation surface as an unhandled `500`.
- `/api/debug-oauth`: removed entirely — requests to this path now 404 rather than leaking OAuth
  client metadata without authentication.
- `/api/vets/search`: Nominatim/Overpass failures (no geocode match, upstream timeout/error) are
  caught and returned as a clean `4xx`/`5xx` JSON error rather than propagating an unhandled
  exception; `radius` is clamped server-side (max 50000m) rather than trusting client input.
- MCP tools: an unauthenticated or malformed `extra.authInfo.extra.userId` must cause the tool to
  return an authorization error rather than executing an unscoped query.
- Existing Demo Mode fallback (`isDbAvailable()` check returning canned/empty responses when
  `DATABASE_URL` is unset) is preserved unchanged by every route touched in this pass.

## Testing Strategy

Given no physical ESP32/GPS hardware is available in this environment, verification is:
1. `npx next build` — must complete with 0 errors after each change (this is the project's
   standing bar for "verified" per the testing matrix in the PROJECT_REPORT).
2. Direct code reading of threshold/branch logic (e.g. behavior classification bands, geofence
   comparison, MCP query WHERE clauses) to confirm correctness where hardware-in-the-loop testing
   isn't possible.
3. For routes with no UI caller yet (`/api/esp32/pair`, `/api/reminders/schedule`,
   `/api/gps/monitor`), confirm the request/response contract is preserved by comparing against
   its pre-change behavior, since wiring the UI to call them is tracked separately (see tasks.md).
