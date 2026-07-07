---
inclusion: always
---

# Project Structure

```
src/
├── app/
│   ├── api/                — Route handlers: auth, cats, esp32, gps, geocode,
│   │                          reminders, scrapbook, vets, mcp, oauth
│   ├── dashboard/
│   │   ├── page.tsx        — Live behavior + emotion + wellness feed
│   │   ├── cam/             — ESP32-CAM live MJPEG stream
│   │   ├── map/              — GPS tracker + geofence map
│   │   ├── health/           — Health monitor + vet finder
│   │   ├── needs/            — Needs predictor
│   │   ├── reminders/        — Todo/reminders
│   │   └── scrapbook/        — Photo album (book style)
│   ├── login/, signup/, setup/  — Auth + onboarding wizard
│   ├── oauth/, .well-known/     — OAuth 2.0 authorization server endpoints
│   └── demo/                    — Demo Mode entry
├── components/
│   ├── cards/CatCardList.tsx    — Cat profile cards with edit
│   ├── CatRoom.tsx               — Cat room visualization
│   ├── GpsMap.tsx                — Leaflet/OSM map (direct API, not react-leaflet)
│   ├── PixelCat.tsx               — Pixel art cat animation
│   ├── TutorialOverlay.tsx        — First-time user tutorial
│   ├── nav/                        — TopBar + BottomNav
│   └── landing/                    — Landing page sections
├── lib/
│   ├── AuthContext.tsx      — Auth state + cat CRUD (client)
│   ├── db.ts                 — PostgreSQL pool (pg / Neon)
│   ├── emotion.ts             — Server-side emotion scoring (Nicholson & O'Carroll 2021)
│   ├── mockData.ts            — Demo/static data (Needs Predictor, Demo Mode)
│   └── oauth.ts                — OAuth 2.0 authorization server logic
sql/
└── 001_schema.sql           — Full PostgreSQL schema (users, cats, esp32_devices, gps_logs,
                                 behavior_events, sensor_readings, emotion_assessments,
                                 scrapbook_books, scrapbook_entries, reminders, oauth_*,
                                 research_references)
esp32/
└── README.md                — ESP32 firmware docs (Arduino/C++)
android/                      — Capacitor Android shell
documentation/
├── PROJECT_REPORT.md/.pdf    — Hackathon submission report
REPORT.md                     — Original day-by-day development log (also appended as an
                                 appendix inside PROJECT_REPORT.md)
```

## Where things live

- New API routes go under `src/app/api/<resource>/route.ts` (or `[id]/route.ts` for item-level
  operations), following the existing pattern in `cats/`, `esp32/`, `gps/`.
- New dashboard pages go under `src/app/dashboard/<feature>/page.tsx` and get a nav entry in
  `src/components/nav/BottomNav.tsx`.
- Research citations backing a new detection rule belong in `research_references` (schema) and
  should be reflected in the README's paper table and `documentation/PROJECT_REPORT.md`'s
  feature list if user-facing.
- MCP tools live alongside the MCP route under `src/app/api/mcp/` — new tools must follow the
  `owner_id`-scoped query pattern described in `tech.md`.
