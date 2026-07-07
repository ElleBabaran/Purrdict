# 🐾 Purrdict — Research-Backed Cat Behavior Intelligence

> **#hackthekitty 2026** | Built with Next.js 16, PostgreSQL

**Purrdict** is an IoT-powered cat monitoring platform that uses an ESP32 smart leash to track your cat's behavior, emotions, location, and health — grounded in peer-reviewed veterinary and ethology research.

No guesswork. No "AI magic." Every detection method traces back to a published paper.

---

## 🎬 Demo Video

> 📹 [Watch the demo →](https://youtu.be/YOUR_DEMO_LINK)

---

## 🐱 Theme Relevance — "Coding for Kitties"

Purrdict is built entirely around cat welfare:

- **ESP32 smart leash** streams real-time accelerometer, gyroscope, proximity, and camera data
- **Behavior classification** identifies sleeping, eating, grooming, playing, walking, scratching, running, drinking, jumping, sitting/alert — based on validated sensor patterns
- **Emotion assessment** detects contentment, excitement, relaxation, curiosity, alertness using observable motion-behavior correlates
- **Pain detection** via behavior-based wellness check (motion anomalies vs 14-day baseline, adapted from Evangelista 2023 pain behavior ethogram)
- **GPS tracking** with home address geocoding, geofence alerts, and trail visualization on a real OpenStreetMap
- **Health monitoring** with 7-day baselines, sensor-derived metrics, and anomaly detection
- **Needs predictor** estimates cat's current needs (hungry, thirsty, play, rest, attention, vet) with confidence percentages
- **Scrapbook** to capture memories in a book-style album with multiple albums, photos, videos, and notes
- **Reminders** for feeding, vet visits, play sessions, grooming, and more
- **Cat cards** — create profile cards for each cat paired with a leash
- **Live camera** — MJPEG stream from ESP32-CAM with snapshot capture
- **Vet finder** — search real veterinary clinics nearby using OpenStreetMap Overpass API

Every feature exists to answer one question: *"What is my cat up to, and is she okay?"*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 16 + React 19 + Tailwind CSS 4         │
│  Pages: Dashboard, Cam, GPS Map, Needs,         │
│         Scrapbook, Reminders, Health,            │
│         Login/Signup/Setup                       │
├─────────────────────────────────────────────────┤
│                  DATABASE                         │
│  PostgreSQL / Neon (raw pg, no ORM)              │
│  Tables: users, cats, esp32_devices, gps_logs,  │
│  behavior_events, sensor_readings,              │
│  emotion_assessments, scrapbook_books,          │
│  scrapbook_entries, reminders,                  │
│  oauth_clients, oauth_codes, oauth_tokens,      │
│  research_references                            │
├─────────────────────────────────────────────────┤
│              OAUTH 2.0 / MCP                     │
│  RFC 6749 Authorization Code + PKCE (S256)       │
│  RFC 7591 Dynamic Client Registration           │
│  RFC 9728 Protected Resource Metadata           │
│  Claude Connector / MCP server support          │
├─────────────────────────────────────────────────┤
│                  SECURITY                        │
│  CSP headers, HSTS, XSS protection              │
│  Parameterized queries (SQL injection safe)     │
│  JWT auth with bcrypt (cost 12)                 │
│  Input validation on all API routes             │
└─────────────────────────────────────────────────┘
```

---

## 🔬 Research Foundation — 17 Peer-Reviewed Papers

Every detection algorithm in Purrdict is grounded in published research:

### Behavior Classification (Accelerometer + ML)

| Paper | Method | Result |
|-------|--------|--------|
| [Ikurior et al. 2023](https://www.mdpi.com/1424-8220/23/16/7165) | Triaxial accelerometer + Random Forest + SOM | >95% accuracy, 8 behaviors |
| [Tattersall et al. 2021](https://link.springer.com/10.1038/s41598-021-92896-4) | Self-Organising Maps on free-roaming cats | >95% Kappa for fine-scale behavior |
| [Mealin et al. 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11053832/) | Validated ML on 28 pet cats | 8 behaviors quantified, 62-78% inactive |
| [Uddin et al. 2024](https://www.mdpi.com/1424-8220/24/23/7436) | CNN-LSTM deep learning pipeline | Real-time on embedded devices |
| [Delgado et al. 2023](https://www.mdpi.com/2076-2615/13/1/120) | Collar IMU with gyroscope analysis | 35% accuracy boost with gyroscope |
| [Ladha et al. 2013](https://www.researchgate.net/publication/319605380) | Multitask learning on collar tags | Resource-constrained embedded ML |

### Emotion & Welfare Assessment

| Paper | Method | Result |
|-------|--------|--------|
| [Nicholson & O'Carroll 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC7995744/) | Feline emotions ethogram | 5 primary emotions defined |
| [Evangelista et al. 2019](https://www.nature.com/articles/s41598-019-55693-8) | Feline Grimace Scale (FGS) | 91% sensitivity, 89% specificity |
| [Evangelista et al. 2023](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0292224) | Pain behavior ethogram | Expert consensus, 10 categories |
| [Kumpulainen et al. 2024](https://www.mdpi.com/2813-9372/1/3/21) | Complete domestic cat ethogram | Species-appropriate vs pain/stress |

### Activity, Sleep & Circadian Patterns

| Paper | Method | Result |
|-------|--------|--------|
| [Miyazaki et al. 2020](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0236795) | Plus Cycle activity monitor | Steps, jumps, sleep quality validated |
| [Piccione et al. 2013](https://pubmed.ncbi.nlm.nih.gov/3843546/) | Circadian rhythm study | Crepuscular peaks at dawn/dusk |
| [De Saix et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12182317/) | Light-behavior-cortisol | Environmental stress quantified |

### Hardware & Spatial Tracking

| Paper | Method | Result |
|-------|--------|--------|
| [Chambers et al. 2022](https://www.nature.com/articles/s41598-022-22167-3) | BeRSTID real-time spatial tracking | Open-source, fiducial markers |
| [Zhang et al. 2020](https://www.mdpi.com/2076-2615/10/2/205) | UWB radar vital signs | Non-contact heart/respiratory rate |
| [Nunes et al. 2024](https://link.springer.com/chapter/10.1007/978-3-031-46933-6_38) | ECG monitoring vest | Arrhythmia detection in cats |
| [Ding et al. 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12300563/) | Comprehensive wearable sensor review | State-of-art 2025 overview |

---

## 🔒 Security

- ✅ SQL injection protection (all queries parameterized, no string-concatenated SQL)
- ✅ XSS protection via CSP headers
- ✅ SSRF prevention on the ESP32 stream proxy (only private/local IP ranges accepted)
- ✅ HSTS + secure headers
- ✅ Input validation on all API routes
- ✅ JWT with bcrypt (cost 12) for auth
- ✅ PIN sanitization (alphanumeric only)

### Security Headers (next.config.ts)

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: [strict policy]
Permissions-Policy: camera=(self), microphone=(self), geolocation=(self)
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Neon serverless)
- (Optional) ESP32-CAM + MPU6050 + GPS module hardware

### Setup

```bash
# Clone
git clone https://github.com/YOUR_USER/purrdict.git
cd purrdict

# Install
npm install

# Environment
cp .env.local.example .env.local
# Edit .env.local with your DATABASE_URL, JWT_SECRET, etc.

# Database
psql -d purrdict -f sql/001_schema.sql

# Run
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgres://purrdict:password@localhost:5432/purrdict
JWT_SECRET=your-long-random-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/                      — Backend route handlers (auth, cats, esp32, gps, reminders, scrapbook, vets, mcp)
│   ├── dashboard/
│   │   ├── page.tsx              — Live behavior + emotion + wellness
│   │   ├── cam/                  — ESP32-CAM live MJPEG stream
│   │   ├── map/                  — GPS tracker + geofence map
│   │   ├── health/               — Health monitor + vet finder
│   │   ├── needs/                — Needs predictor
│   │   ├── reminders/            — Todo/reminders
│   │   └── scrapbook/            — Photo album (book style)
│   ├── login/                    — Login page
│   ├── signup/                   — Registration page
│   └── setup/                    — Onboarding (IP connect → name → card)
├── components/
│   ├── cards/CatCardList.tsx     — Cat profile cards with edit
│   ├── CatRoom.tsx               — Cat room visualization
│   ├── GpsMap.tsx                — Real Leaflet/OSM map
│   ├── PixelCat.tsx              — Pixel art cat animation
│   ├── TutorialOverlay.tsx       — First-time user tutorial
│   ├── nav/                      — TopBar + BottomNav
│   └── landing/                  — Landing page sections
├── lib/
│   ├── AuthContext.tsx           — Auth state + cat CRUD
│   ├── db.ts                     — PostgreSQL pool (pg)
│   ├── emotion.ts                — Emotion scoring (Nicholson 2021 ethogram)
│   ├── mockData.ts               — Demo data for needs predictor
│   └── oauth.ts                  — OAuth 2.0 Authorization Server
sql/
└── 001_schema.sql                — Full PostgreSQL schema + research refs
esp32/
└── README.md                     — ESP32 firmware docs
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Auth | bcryptjs + jsonwebtoken (JWT) |
| Database | PostgreSQL / Neon + `pg` (raw SQL, parameterized) |
| Maps | Leaflet.js + OpenStreetMap (CartoDB dark tiles) |
| Vet Search | OpenStreetMap Nominatim (geocoding) + Overpass API (live clinic search) |
| Security | CSP/HSTS security headers, parameterized SQL, JWT + bcrypt |
| MCP | OAuth 2.0 (RFC 6749/7591/7636/9728) + MCP transport |
| Deployment | Vercel / any Node.js host |
| Mobile | Capacitor (Android ready) |
| Hardware | ESP32-CAM, MPU6050, GPS module, INP sensor |

---

## 📱 Features

- 🔐 **Auth** — Login, signup, JWT sessions, sign out
- 🐱 **Cat Cards** — Create, edit, delete cat profiles with photo upload
- 📡 **ESP32 Pairing** — IP-based connection to smart leash on same Wi-Fi
- 📊 **Live Behavior Detection** — 10 behaviors classified from leash sensors in real-time (sleeping, grooming, eating, playing, walking, sitting/alert, scratching, running, drinking, jumping)
- 😌 **Emotion Assessment** — 5 feline emotion states (Nicholson 2021 framework) scored server-side from each behavior reading and persisted to `emotion_assessments`, not recomputed from whatever's on screen
- 🩺 **Wellness Check** — Pain/discomfort detection via motion anomalies against 14-day baseline (Evangelista 2023)
- 🌙 **Circadian Awareness** — Activity predictions based on crepuscular dawn/dusk patterns (Piccione 2013)
- 📷 **Cat Cam** — Live MJPEG stream from ESP32-CAM with snapshot capture
- 🗺️ **GPS Tracker** — Real OpenStreetMap with home geocoding, geofence alerts, trail visualization, and a realistic random-waypoint movement simulation (walk/rest cycles at mode-dependent speeds) until real GPS hardware is wired up
- 🔮 **Needs Predictor** — Estimates hunger, thirst, play, rest, attention needs with confidence %
- 📖 **Scrapbook** — Book-style albums with customizable covers, photos, videos, notes, and tags
- 🔔 **Reminders** — Categorized tasks (feeding/health/play/grooming/vet) with priority and recurring schedules
- ❤️ **Health Monitor** — 7-day sensor baseline, activity metrics (steps, jumps, grooming, meals), anomaly alerts
- 🏥 **Vet Finder** — Search real veterinary clinics nearby using OpenStreetMap Overpass API + geocoding
- 🤖 **MCP Server** — OAuth 2.0 protected API for Claude Connector / AI agent integration

---

## 👥 Team

Built for **#hackthekitty 2026** 🐾

---

## 📄 License

MIT
