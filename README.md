# 🐾 Purrdict — Research-Backed Cat Behavior Intelligence

> **#hackthekitty 2026** | Built with Next.js 16, PostgreSQL, Temporal, Aikido Zen

**Purrdict** is an IoT-powered cat monitoring platform that uses an ESP32 collar to track your cat's behavior, emotions, location, and health — grounded in peer-reviewed veterinary and ethology research.

No guesswork. No "AI magic." Every detection method traces back to a published paper.

---

## 🎬 Demo Video

> 📹 [Watch the demo →](https://youtu.be/YOUR_DEMO_LINK)

---

## 🐱 Theme Relevance — "Coding for Kitties"

Purrdict is built entirely around cat welfare:

- **ESP32 smart collar** streams real-time accelerometer + GPS data
- **Behavior classification** identifies sleeping, eating, grooming, playing, walking, scratching, running, drinking, jumping — based on validated sensor patterns
- **Emotion assessment** detects fear, anger, joy, contentment, interest using observable body language indicators
- **Pain detection** via the Feline Grimace Scale (5 facial action units)
- **GPS tracking** with geofence alerts on a real OpenStreetMap
- **Health monitoring** with 7-day baselines and anomaly detection
- **Scrapbook** to capture memories in a book-style album
- **Reminders** for feeding, vet visits, play sessions
- **Cat cards** — create profile cards for each cat paired with a collar

Every feature exists to answer one question: *"What is my cat up to, and is she okay?"*

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  Next.js 16 + React 19 + Tailwind CSS 4         │
│  Pages: Dashboard, Cam+GPS, Scrapbook,          │
│         Reminders, Health, Login/Signup/Setup    │
├─────────────────────────────────────────────────┤
│                   API LAYER                      │
│  /api/auth/* — JWT auth (bcrypt + jsonwebtoken)  │
│  /api/cats — CRUD for cat profiles              │
│  /api/esp32/pair — Temporal workflow trigger     │
│  /api/gps/monitor — Start GPS session           │
│  /api/reminders/schedule — Durable reminders    │
├─────────────────────────────────────────────────┤
│              TEMPORAL WORKFLOWS                   │
│  pairEsp32Workflow — Device pairing with retry   │
│  reminderSchedulerWorkflow — Durable scheduling  │
│  gpsMonitoringWorkflow — Geofence + logging      │
│  behaviorAnalysisWorkflow — Classify + clip      │
├─────────────────────────────────────────────────┤
│                  DATABASE                         │
│  PostgreSQL (raw pg, no ORM)                     │
│  Tables: users, cats, esp32_devices, gps_logs,  │
│  behavior_events, emotion_assessments,          │
│  cam_clips, scrapbook_entries, reminders,       │
│  research_references                            │
├─────────────────────────────────────────────────┤
│                  SECURITY                        │
│  Aikido Zen Firewall — runtime protection        │
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

## 🔒 Security — Aikido Zen Firewall

Purrdict uses **Aikido Zen Firewall** for runtime application security:

- ✅ SQL injection protection (all queries parameterized)
- ✅ XSS protection via CSP headers
- ✅ SSRF prevention
- ✅ Path traversal blocking
- ✅ Rate limiting on auth endpoints
- ✅ HSTS + secure headers
- ✅ Bot blocking capability
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

### Running Aikido Scan

```bash
# Set your Aikido token
export AIKIDO_TOKEN=AIK_RUNTIME_xxx

# Start in detection mode (recommended first)
AIKIDO_BLOCK=false npm start

# After validation, enable blocking
AIKIDO_BLOCK=true npm start
```

> 📊 Include your Aikido scan report screenshot in your submission.

---

## ⏳ Temporal — Durable Execution

Purrdict uses **Temporal** for workflows that must not fail:

| Workflow | Purpose | Durability |
|----------|---------|-----------|
| `pairEsp32Workflow` | Verify PIN → claim device → link to cat | Retries 5x with backoff |
| `reminderSchedulerWorkflow` | Check due → notify → create next recurrence | Survives server restarts |
| `gpsMonitoringWorkflow` | Log GPS every 10s → check geofence → alert | Runs for hours continuously |
| `behaviorAnalysisWorkflow` | Classify behavior → log → auto-save clip | Exactly-once processing |

```bash
# Start Temporal server (dev)
temporal server start-dev

# Start the worker
npm run temporal:worker
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- (Optional) Temporal CLI
- (Optional) Aikido account

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
AIKIDO_TOKEN=AIK_RUNTIME_xxx
AIKIDO_BLOCK=false
TEMPORAL_ADDRESS=localhost:7233
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/login/       — JWT login
│   │   ├── auth/signup/      — User registration
│   │   ├── cats/             — Cat CRUD
│   │   ├── cats/[id]/        — Update/delete cat
│   │   ├── esp32/pair/       — Temporal pairing workflow
│   │   ├── gps/monitor/      — GPS monitoring workflow
│   │   └── reminders/schedule/ — Reminder scheduling
│   ├── dashboard/
│   │   ├── page.tsx          — Behavior observations (research-backed)
│   │   ├── cam/              — ESP32 camera + GPS map
│   │   ├── health/           — Health monitor
│   │   ├── reminders/        — Todo/reminders
│   │   └── scrapbook/        — Photo album (book style)
│   ├── login/                — Login page
│   ├── signup/               — Registration page
│   └── setup/                — Onboarding (PIN → name → card)
├── components/
│   ├── cards/CatCardList.tsx — Cat profile cards with edit
│   ├── GpsMap.tsx            — Real Leaflet/OSM map
│   ├── nav/                  — TopBar + BottomNav
│   └── landing/              — Landing page sections
├── lib/
│   ├── AuthContext.tsx       — Auth state + cat CRUD
│   ├── db.ts                 — PostgreSQL pool (pg)
│   └── mockData.ts           — Demo data
├── temporal/
│   ├── activities.ts         — DB operations
│   ├── workflows.ts          — Durable orchestrations
│   ├── client.ts             — Temporal client helper
│   └── worker.ts             — Temporal worker process
└── instrumentation.ts        — Aikido Zen loader
sql/
└── 001_schema.sql            — Full PostgreSQL schema + research refs
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Auth | bcryptjs + jsonwebtoken (JWT) |
| Database | PostgreSQL + `pg` (raw SQL, parameterized) |
| Maps | Leaflet + OpenStreetMap (CartoDB dark tiles) |
| Workflows | Temporal TypeScript SDK |
| Security | Aikido Zen Firewall |
| Deployment | Vercel / any Node.js host |
| Mobile | Capacitor (Android ready) |

---

## 📱 Features

- 🔐 **Auth** — Login, signup, JWT sessions, sign out
- 🐱 **Cat Cards** — Create, edit, delete cat profiles with photo upload
- 📡 **ESP32 Pairing** — 6-digit PIN connection with retry logic
- 📊 **Live Observations** — Behavior detection feed from collar sensors
- 😌 **Emotion Assessment** — 5 primary feline emotions with indicators
- 😺 **Feline Grimace Scale** — Pain detection via 5 action units
- 🌙 **Circadian Awareness** — Activity predictions based on dawn/dusk patterns
- 📷 **Spy Cam** — ESP32 camera with recording, snapshots, audio
- 🗺️ **GPS Tracker** — Real OpenStreetMap with geofence alerts
- 📖 **Scrapbook** — Book-style album with pages, photos, videos, notes
- 🔔 **Reminders** — Categorized tasks with recurring schedules
- ❤️ **Health Monitor** — 7-day baselines, anomaly alerts

---

## 👥 Team

Built for **#hackthekitty 2026** 🐾

---

## 📄 License

MIT
