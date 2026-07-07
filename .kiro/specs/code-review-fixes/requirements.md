# Requirements — Code Review & Hardening Pass

## Context

Ahead of #hackthekitty 2026 submission, Purrdict underwent a review pass to fix real security
bugs, remove dependencies that weren't earning their keep, and replace client-side stand-ins
with server-backed implementations where feasible before the deadline.

## Requirements

### Requirement 1 — MCP tool authorization scoping

**User Story:** As a cat owner using an AI agent (e.g. Claude) through the MCP connector, I want
the agent to only ever see my own cats and reminders, not other users' data.

**Acceptance Criteria:**
1. WHEN the `list_cats` MCP tool is called by an authenticated client THEN the system SHALL
   return only cats where `owner_id` matches the authenticated user's id.
2. WHEN the `get_reminders` MCP tool is called with `include_done: false` THEN the system SHALL
   exclude completed reminders and SHALL scope results to the authenticated user's `owner_id`.
3. WHEN any MCP tool needs the current user THEN the system SHALL read it from
   `extra.authInfo.extra.userId`, as set by `withMcpAuth`'s token validator.

### Requirement 2 — Remove unauthenticated OAuth metadata leak

**User Story:** As a platform operator, I don't want debug endpoints exposing OAuth client
metadata without authentication.

**Acceptance Criteria:**
1. WHEN a request is made to `GET /api/debug-oauth` THEN the system SHALL NOT serve it — the
   route SHALL be removed from the build entirely.

### Requirement 3 — Scrapbook entry creation without a cat profile

**User Story:** As a new user who hasn't created a cat profile yet, I want a clear error instead
of a silent failure if I try to add a scrapbook entry.

**Acceptance Criteria:**
1. WHEN `POST /api/scrapbook/entries` is called by a user with no cat profile THEN the system
   SHALL return `400` with a clear message instead of inserting `NULL` into the `NOT NULL
   cat_id` column.

### Requirement 4 — Live vet search

**User Story:** As a cat owner anywhere in the world, I want to search for real nearby
veterinary clinics instead of a fixed list of 8 pre-seeded regions.

**Acceptance Criteria:**
1. WHEN a user searches a location in the Vet Finder THEN the system SHALL geocode the query via
   OpenStreetMap Nominatim and SHALL query the Overpass API for `amenity=veterinary` points
   within a configurable radius (default 15km, max 50km).
2. WHEN results are returned THEN the system SHALL sort them nearest-first using a server-side
   haversine distance calculation.
3. WHEN this route ships THEN the system SHALL remove the hardcoded `WORLDWIDE_VETS` client-side
   dataset entirely.

### Requirement 5 — Server-side, persisted emotion assessment

**User Story:** As a cat owner, I want the emotion panel to reflect a real, persisted assessment
tied to each behavior event, not a label recomputed from whatever's currently on screen.

**Acceptance Criteria:**
1. WHEN `POST /api/esp32/data` logs a behavior event THEN the system SHALL derive a 5-emotion
   score (fear/anger/joy/contentment/interest per Nicholson & O'Carroll 2021) plus
   posture/tail/ear/eye/vocalization fields and SHALL persist it to `emotion_assessments`.
2. WHEN the dashboard renders the Emotion Assessment panel THEN it SHALL fetch and display the
   latest persisted row, falling back to a client-computed estimate (same scoring function) only
   when no row exists yet (e.g. a fresh Demo Mode session).

### Requirement 6 — More realistic GPS simulation

**User Story:** As a demo viewer, I want the simulated cat movement on the map to look like
actual wandering instead of teleporting between fixed points, while real GPS hardware is
pending.

**Acceptance Criteria:**
1. WHEN no real GPS hardware is present THEN the system SHALL simulate movement using a
   random-waypoint walk model (destination picking, mode-dependent speed, rest/groom pauses,
   ~400ms-tick interpolation) instead of teleporting between fixed waypoints every 3 seconds.
2. WHEN the simulated path crosses the geofence boundary THEN the existing geofence math,
   distance display, and safe/outside alert states SHALL remain unchanged and correct.
