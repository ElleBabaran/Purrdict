# Purrdict - Development Progress Report

> Hackathon: #hackthekitty 2026
> Period: June 25 - July 7, 2026

---

## System Architecture

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

### Data Flow

```
ESP32 sensors (50Hz) --> WiFi POST --> API Route --> Aikido validates
  --> Temporal workflow --> PostgreSQL (stores with paper reference)
  --> Frontend displays (behavior + confidence + research citation)
```

---

## Day 1 - June 25 (Wed): Ideation

Attended the hackathon kick-off. Theme: cats. Must use Aikido, Temporal, Kiro.
Judging: Technical 25%, Innovation 20%, Theme 15%, Security 15%, UI 15%, Docs 10%.

Brainstormed concepts. Rejected: cat social media (exists), smart toy (limited),
litter tracker (no demo). Winner: ESP32 smart collar that monitors behavior
using published research methods, not generic AI.

Named it Purrdict. Decided on Next.js 16 + PostgreSQL + Temporal + Aikido +
Leaflet + bcrypt/JWT. Set up repo, installed deps, got skeleton running.

---

## Day 2 - June 26 (Thu): Research

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

## Day 3 - June 27 (Fri): Design System + Landing Page

Created the visual identity: pixel art aesthetic with Press Start 2P font,
warm cream/cocoa/pink/mint palette. Built CSS custom properties, keyframe
animations (bob, blink, scan, twinkle, walk), and utility classes
(pixel-border, glass-card, pixel-press).

Built the PixelCat SVG component (48x40 pixel art cat).

Built 6 landing page sections: Nav, Hero (with live tracking scene),
Levels (how it works), Showcase (cam + map + scrapbook preview),
States (emotion ethogram cards with research citations), CTA + footer.

---

## Day 4 - June 28 (Sat): Dashboard Pages

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

## Day 5 - June 29 (Sun): Auth + Database

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

## Day 6 - June 30 (Mon): Temporal + Aikido

Installed Temporal SDK. Created 4 workflows:
- pairEsp32Workflow: verify PIN, claim device, retry 5x with backoff
- reminderSchedulerWorkflow: check due, mark done, create next recurrence
- gpsMonitoringWorkflow: log coords every 10s, check geofence, run for hours
- behaviorAnalysisWorkflow: classify, log, auto-clip if confidence >80%

Installed Aikido Zen Firewall via instrumentation.ts hook.
Added security headers: CSP, HSTS, X-Frame-Options, X-XSS-Protection,
Permissions-Policy. All queries parameterized. PIN validation regex.
---

## Day 7 - July 1 (Tue): Research Integration

Replaced generic mock data with research-grounded detections. Each behavior
now shows: sensor signature description, confidence %, paper citation, method.

Built Feline Grimace Scale panel (5 action units from Evangelista 2019).
Built emotion assessment using Nicholson 2021 (5 emotions + indicators).
Built circadian rhythm chart based on Piccione 2013 (crepuscular peaks).
Built scrapbook page (book-style with spine, pages, polaroids).

---

## Day 8 - July 2 (Wed): Real Map + Reminders

Replaced fake grid map with real Leaflet/OpenStreetMap. Dark CartoDB tiles,
geofence circle (dashed green, 100m), trail polyline (yellow dashed),
emoji markers with popups, pulsing current-position dot.

Fixed Leaflet SSR issue by using direct API import instead of react-leaflet.
Added invalidateSize() workaround for tile loading after React hydration.

Built reminders page: categories (feeding/health/play/grooming/vet/other),
priorities (high/med/low), recurring support, completion tracking.

---

## Day 9 - July 3 (Thu): Onboarding + Cat Cards

Built 4-step setup wizard: PIN entry -> name cat -> preview card -> done.
PIN input: 6 boxes, auto-focus, backspace navigation, connection simulation.
Cat profile: SVG icon picker, photo upload, breed, age, fur color swatches.
Card preview: trading card style with color band, stats grid, PIN display.

Built CatCardList on dashboard with EDIT modal and DELETE functionality.
Fixed critical bug: addCat failed silently when user was null. Fixed by
creating guest user on the fly if needed.

---

## Day 10 - July 4 (Fri): Landing Redesign

Redesigned Hero: dark live-tracking scene with SVG path, glass pin badges,
pulsing cat marker, status bar.

Split Showcase into two sections: Spy Cam (full-width cam + map below)
and Scrapbook (book-style preview with dot paper, polaroids, spine).

Updated nav with Login/Signup buttons. Added backdrop blur.

---

## Day 11 - July 5 (Sat): Sign Out + Observation Feed

Added sign out button to TopBar. Clears state + localStorage + JWT.

Overhauled dashboard: now shows ESP32 collar observations as a live feed.
Each detection has: behavior name, sensor description (e.g. 'Rhythmic Y-axis
pattern 0.8-1.2Hz'), confidence bar, research method citation.

Simulates new observations every 30s. 10 behavior types with detailed
accelerometer descriptions from the papers.

---

## Day 12 - July 6 (Sun): Polish + Fixes

Fixed GPS map rendering (tiles only half-loaded). Rewrote GpsMap component
using direct Leaflet API with proper mount timing.

Increased all UI sizes for desktop (was too small at max-w-md).
Layout -> max-w-2xl, bigger fonts, taller bars, more padding throughout.

Updated landing page: removed all AI language, replaced with research
citations. Levels now cite specific papers. States section shows the
actual ethogram with paper links. Footer: 'PURRDICT RESEARCH' not 'AI'.

---

## Day 13 - July 7 (Mon): Documentation + Submission

Wrote README.md: architecture, setup guide, 17 paper citations with DOIs,
security documentation, Temporal workflow descriptions.

Wrote this progress report.

Final build: 0 errors, 20 routes (12 static + 8 dynamic API).

---

## Summary

- 17 research papers integrated
- 8 API routes
- 4 Temporal workflows
- 11 database tables
- 7 dashboard pages
- Real OpenStreetMap GPS tracking
- Aikido Zen Firewall runtime protection
- Full auth flow with cat card CRUD
- 0 build errors