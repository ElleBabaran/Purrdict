# Tasks — Code Review & Hardening Pass

- [x] 1. Fix MCP tool authorization scoping
  - [x] 1.1 Thread authenticated `userId` into `extra.authInfo.extra.userId` via `withMcpAuth`
  - [x] 1.2 Scope `list_cats` query with `WHERE owner_id = $1`
  - [x] 1.3 Fix `get_reminders` `include_done` clause and scope to `owner_id`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Remove unauthenticated OAuth debug route
  - [x] 2.1 Delete `GET /api/debug-oauth` route file
  - [x] 2.2 Confirm `npx next build` no longer lists it among generated routes
  - _Requirements: 2.1_

- [x] 3. Guard scrapbook entry creation against missing cat profile
  - [x] 3.1 Add existence check before insert in `POST /api/scrapbook/entries`
  - [x] 3.2 Return `400` with clear message when no cat profile exists
  - _Requirements: 3.1_

- [x] 4. Build live vet search
  - [x] 4.1 Implement `GET /api/vets/search` (Nominatim geocode + Overpass `amenity=veterinary`
        query, configurable radius default 15km/max 50km)
  - [x] 4.2 Compute server-side haversine distance, sort nearest-first
  - [x] 4.3 Remove hardcoded `WORLDWIDE_VETS` dataset and lookup function from
        `health/page.tsx`; wire Vet Finder modal to the new route
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 5. Build server-side emotion assessment pipeline
  - [x] 5.1 Implement `deriveEmotionScores()` in `src/lib/emotion.ts` (Nicholson & O'Carroll 2021)
  - [x] 5.2 Persist emotion scores to `emotion_assessments` on every `POST /api/esp32/data` call
        that has a linked cat
  - [x] 5.3 Update `GET` path to return the latest persisted row
  - [x] 5.4 Update dashboard to render the fetched row, falling back to client-side estimate only
        when no row exists
  - _Requirements: 5.1, 5.2_

- [x] 6. Upgrade GPS simulation to random-waypoint walk model
  - [x] 6.1 Implement destination picking with occasional geofence-breaching excursions
  - [x] 6.2 Implement mode-dependent speeds and rest/groom pauses
  - [x] 6.3 Interpolate position on a ~400ms tick
  - [x] 6.4 Confirm geofence math/distance/badge logic unchanged and still correct at the
        boundary
  - _Requirements: 6.1, 6.2_

- [ ] 7. Follow-up (not yet done — tracked in Future Improvements)
  - [ ] 7.1 Wire Setup wizard "pair device" step, Reminders page, Map page to their existing
        endpoints (`/api/esp32/pair`, `/api/reminders/schedule`, `/api/gps/monitor`)
  - [ ] 7.2 Persist reminders to the `reminders` table instead of local-only React state
  - [ ] 7.3 Add real accelerometer/gyroscope/GPS hardware to ESP32 firmware
  - [ ] 7.4 Replace Health Monitor / Needs Predictor mock data with real
        `sensor_readings`/`behavior_events` aggregates
  - [ ] 7.5 Compute Wellness Check score from a real 14-day rolling baseline
  - [ ] 7.6 Add push notifications for geofence breaches / wellness anomalies
  - [ ] 7.7 Add automated integration tests for `/api/esp32/*` and `/api/vets/search`
  - [ ] 7.8 Add caching/rate-limiting for `/api/vets/search` against Nominatim/Overpass usage
        policies
