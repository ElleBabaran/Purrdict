---
inclusion: always
---

# Tech Stack & Conventions

## Stack

- **Frontend:** Next.js 16.2.9 (App Router), React 19.2.4, Tailwind CSS 4
- **Backend:** Next.js API Route Handlers (`src/app/api/**/route.ts`)
- **Database:** PostgreSQL / Neon serverless (`@neondatabase/serverless` + `pg`), raw
  parameterized SQL — **no ORM**. Schema lives in `sql/001_schema.sql`.
- **Auth:** `bcryptjs` (cost factor 12) + `jsonwebtoken` (custom JWT), no NextAuth/Clerk/etc.
- **Maps/Geo:** Leaflet.js via direct API (not `react-leaflet` — SSR/hydration issues required a
  direct-API workaround), OpenStreetMap CartoDB dark tiles, Nominatim (geocoding), Overpass API
  (vet search).
- **AI-agent integration:** `mcp-handler` behind a custom OAuth 2.0 authorization server
  (`src/lib/oauth.ts`) implementing RFC 6749 (Authorization Code + PKCE S256), RFC 7591 (Dynamic
  Client Registration), RFC 9728 (Protected Resource Metadata).
- **Mobile:** Capacitor 8 — Android app is a WebView shell (`appId: app.purrdict.cat`) loading
  the deployed web app; no separate native logic.
- **Hardware/Firmware:** ESP32-CAM (AI-Thinker, OV2640), Arduino/C++, currently camera +
  frame-diff motion sensing only (no accelerometer/gyroscope/GPS chip yet).
- **Deployment:** Vercel (`purrdict.vercel.app`).

## Conventions

- All SQL queries must be parameterized — never string-concatenate user input into SQL.
- Every API route must validate its inputs (see PIN validation regex, signup/login validation
  as reference patterns).
- MCP tools must derive `userId` from `extra.authInfo.extra.userId` (set by `withMcpAuth`'s
  token validator) and scope every query with `WHERE owner_id = $1`. Do not write an MCP tool
  query without an owner/user scope — this was a real vulnerability that got fixed
  (see `list_cats` in the code-review-fixes spec).
- Security headers (CSP, HSTS, X-Frame-Options, X-XSS-Protection, Permissions-Policy) are set in
  `next.config.ts` and must stay on every response — don't relax them when debugging.
- The ESP32 stream proxy (`/api/esp32/stream`) only accepts private/local IP ranges — this is an
  intentional SSRF guard, not a bug.
- Demo Mode: if `DATABASE_URL` is unset, API routes should return safe canned/empty responses
  instead of throwing. Preserve this fallback when touching any API route.
- Build/verify with `npx next build` (or `npm run build`) after backend changes — the project's
  standard of evidence for "this works" throughout the report is "0 errors on `next build`" plus
  reading the route logic, since hardware-dependent flows (ESP32 stream, real GPS) can't be
  exercised without physical devices.

## Commands

```
npm install
npm run dev
npm run build
psql -d purrdict -f sql/001_schema.sql
```
