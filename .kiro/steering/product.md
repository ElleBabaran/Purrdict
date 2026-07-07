---
inclusion: always
---

# Purrdict

Purrdict is an IoT-powered cat monitoring platform built for #hackthekitty 2026. An ESP32-CAM
smart collar/leash streams camera and motion data to a Next.js web app (also shipped as an
Android app via Capacitor) so owners can track their cat's behavior, emotional state, health,
and location in real time.

## Core principle

Every detection rule must trace back to a published veterinary/ethology paper. No opaque
"AI-powered" claims — sensor signatures (motion intensity, frame-diff, activity timing) map
directly onto behavior/welfare categories defined in the 17 cited papers (see `README.md` for
the full list with DOIs). When adding or changing a detection method, cite the paper and method
it's based on, the same way existing code does (e.g. Ikurior et al. 2023 ODBA thresholds,
Evangelista et al. 2019 Feline Grimace Scale, Nicholson & O'Carroll 2021 emotion ethogram).

## Feature areas

- **Auth & onboarding** — signup/login (JWT + bcrypt), 4-step device pairing/cat setup wizard,
  one-click Demo Mode for judges/users without hardware.
- **Live behavior & wellness** — 10 behaviors classified from ESP32 motion data, 5-emotion
  scoring persisted server-side (`src/lib/emotion.ts`), pain/wellness panel, circadian context.
- **Cat Cam** — MJPEG live stream proxied server-side with SSRF protection (private/local IP
  ranges only), snapshot capture.
- **GPS tracking** — home geofencing, live distance-from-home, safe/outside alerts. Coordinate
  source is currently a random-waypoint walk simulation until real GPS hardware exists.
- **Vet Finder** — live search against OpenStreetMap Nominatim (geocoding) + Overpass
  (`amenity=veterinary`), call/directions actions instead of in-app booking.
- **Needs predictor & Health monitor** — needs currently render static sample data; health
  currently renders randomized demo metrics. Both are flagged as simulated pending real sensor
  aggregates from `sensor_readings`/`behavior_events`.
- **Scrapbook** — book-style photo/video/note albums, local-first with background DB sync.
- **Reminders** — categorized recurring care tasks; UI currently uses local state only (not yet
  wired to the working `/api/reminders/schedule` endpoint).
- **MCP server** — OAuth 2.0 protected (RFC 6749/7591/7636/9728) tools for AI agents (e.g. Claude)
  to query a cat's data. All MCP tools must scope queries to the authenticated `owner_id` — see
  the `list_cats` cross-user exposure fix in the code-review-fixes spec for the pattern to follow.

## Known simulated/incomplete areas (be explicit about these, don't paper over them)

- GPS coordinates: simulated random-waypoint walk, not real hardware.
- Needs Predictor: static array in `src/lib/mockData.ts`.
- Health Monitor: `Math.random()` generated metrics, sensor names (MPU6050, INP) don't match
  actual firmware (camera + frame-diff only, no IMU/GPS chip yet).
- Wellness Check score: static placeholder, not yet computed from a real 14-day baseline.
- Reminders: not persisted across refresh despite a working backend route.

When working on these areas, don't silently make them look "done" — either wire them to real
data/endpoints or keep the limitation visible, consistent with how the project report tracks
this in "Future Improvements."
