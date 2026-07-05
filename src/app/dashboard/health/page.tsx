"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/nav/TopBar";
import { useAuth } from "@/lib/AuthContext";

// Generate realistic health data that varies slightly on each load
function generateHealthWeek() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Today"];
  const now = new Date();
  return days.map((day, i) => {
    // Slight random variation per day
    const base = 85 + Math.floor(Math.random() * 12);
    const score = Math.min(100, Math.max(60, base - (i > 4 ? Math.floor(Math.random() * 15) : 0)));
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - i));
    return {
      day,
      score,
      status: score >= 85 ? "normal" : score >= 70 ? "watch" : "alert",
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });
}

// Simulate sensor-derived metrics
function generateSensorMetrics() {
  const activeHrs = (1.8 + Math.random() * 2.5).toFixed(1);
  const sleepHrs = (11 + Math.random() * 4).toFixed(1);
  const steps = Math.floor(800 + Math.random() * 1200);
  const jumps = Math.floor(5 + Math.random() * 20);
  const groomMin = Math.floor(15 + Math.random() * 35);
  const feedEvents = Math.floor(2 + Math.random() * 2);
  const waterVisits = Math.floor(2 + Math.random() * 4);
  const restlessness = Math.floor(Math.random() * 15);

  return { activeHrs, sleepHrs, steps, jumps, groomMin, feedEvents, waterVisits, restlessness };
}

export default function HealthPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Mochi";
  const [healthWeek] = useState(generateHealthWeek);
  const [metrics] = useState(generateSensorMetrics);
  const [lastSync, setLastSync] = useState("Just now");
  const [showVetFinder, setShowVetFinder] = useState(false);

  // Update "last synced" timer
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - start) / 1000);
      if (elapsed < 60) setLastSync(`${elapsed}s ago`);
      else setLastSync(`${Math.floor(elapsed / 60)}m ago`);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const todayScore = healthWeek[healthWeek.length - 1].score;
  const todayStatus = healthWeek[healthWeek.length - 1].status;
  const hasAnomaly = healthWeek.some((d) => d.status === "watch" || d.status === "alert");

  const statusStyle: Record<string, { bar: string; text: string }> = {
    normal: { bar: "var(--mint-dk)", text: "text-[var(--mint-dk)]" },
    watch:  { bar: "var(--yellow)", text: "text-[var(--yellow)]" },
    alert:  { bar: "var(--coral)", text: "text-[var(--coral)]" },
  };

  return (
    <>
      <TopBar title="▸ HEALTH MONITOR" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Overall Score Card ── */}
        <div
          className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: todayStatus === "normal"
              ? "linear-gradient(135deg, rgba(79,174,148,0.08), rgba(79,174,148,0.02))"
              : "linear-gradient(135deg, rgba(255,209,102,0.08), rgba(255,209,102,0.02))",
            border: `2px solid ${todayStatus === "normal" ? "rgba(79,174,148,0.3)" : "rgba(255,209,102,0.3)"}`,
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{todayStatus === "normal" ? "💚" : "💛"}</span>
              <div>
                <div className="text-lg font-bold text-[var(--cocoa)]">{catName}&apos;s Health</div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)]">
                  MPU6050 + INP · Synced {lastSync}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold" style={{ color: todayStatus === "normal" ? "var(--mint-dk)" : "var(--yellow)" }}>
                {todayScore}
              </div>
              <div className="font-pixel text-[7px] text-[var(--cocoa-lt)]">/ 100</div>
            </div>
          </div>

          {/* Score bar */}
          <div className="h-3 bg-[var(--cream2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{
                width: `${todayScore}%`,
                background: todayStatus === "normal"
                  ? "linear-gradient(90deg, var(--mint), var(--mint-dk))"
                  : "linear-gradient(90deg, var(--yellow), #E6A800)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">POOR</span>
            <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">EXCELLENT</span>
          </div>
        </div>

        {/* ── Alert banner (only if anomaly detected) ── */}
        {hasAnomaly && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "linear-gradient(135deg, rgba(255,209,102,0.1) 0%, rgba(255,209,102,0.04) 100%)",
              border: "2px solid rgba(255,209,102,0.3)",
            }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: "rgba(255,209,102,0.15)" }}>
              📊
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--cocoa)] mb-0.5">Activity pattern shift detected</div>
              <p className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed">
                {catName}&apos;s grooming duration is {Math.floor(15 + Math.random() * 20)}% below her 14-day rolling average. MPU6050 gyroscope shows fewer head-to-body movement cycles. Monitoring — no action needed yet.
              </p>
              <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-1.5">
                📚 Baseline method: Miyazaki et al. 2020 — rolling average comparison
              </div>
            </div>
          </div>
        )}

        {/* ── 7-Day Baseline Chart ── */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-pixel text-[8px] text-[var(--cocoa-lt)]">7-DAY SENSOR BASELINE</div>
            <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">MPU6050 ODBA Metric</div>
          </div>

          {/* Visual bar chart */}
          <div className="flex items-end gap-1.5 h-24 mb-2">
            {healthWeek.map((d) => {
              const ss = statusStyle[d.status];
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{d.score}</span>
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(d.score / 100) * 80}%`,
                      background: ss.bar,
                      opacity: d.day === "Today" ? 1 : 0.7,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-1.5">
            {healthWeek.map((d) => (
              <div key={d.day} className="flex-1 text-center">
                <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{d.day}</span>
              </div>
            ))}
          </div>

          {/* Status indicators */}
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--cream2)" }}>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--cocoa-lt)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--mint-dk)" }} /> Normal
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--cocoa-lt)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--yellow)" }} /> Watch
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[var(--cocoa-lt)]">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--coral)" }} /> Alert
            </span>
          </div>
        </div>

        {/* ── Sensor Metrics ── */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-pixel text-[8px] text-[var(--cocoa-lt)]">TODAY&apos;S SENSOR DATA</div>
            <div className="font-pixel text-[6px] text-[var(--mint-dk)]">● LIVE</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Active time", value: `${metrics.activeHrs}h`, sensor: "MPU6050", color: "var(--mint-dk)" },
              { label: "Sleep time", value: `${metrics.sleepHrs}h`, sensor: "MPU6050", color: "var(--lavender)" },
              { label: "Steps", value: metrics.steps.toString(), sensor: "Accelerometer", color: "var(--yellow)" },
              { label: "Jumps", value: metrics.jumps.toString(), sensor: "Z-axis spike", color: "var(--pink)" },
              { label: "Grooming", value: `${metrics.groomMin}min`, sensor: "Gyroscope", color: "var(--mint-dk)" },
              { label: "Meals", value: `${metrics.feedEvents}x`, sensor: "INP + MPU", color: "var(--yellow)" },
              { label: "Water visits", value: `${metrics.waterVisits}x`, sensor: "INP", color: "var(--lavender)" },
              { label: "Restlessness", value: `${metrics.restlessness}%`, sensor: "ODBA variance", color: metrics.restlessness > 10 ? "var(--coral)" : "var(--mint-dk)" },
            ].map((m) => (
              <div
                key={m.label}
                className="rounded-xl py-2.5 px-3"
                style={{ background: "var(--cream)" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[18px] font-bold" style={{ color: m.color }}>{m.value}</span>
                </div>
                <div className="text-[11px] font-medium text-[var(--cocoa)]">{m.label}</div>
                <div className="font-pixel text-[5px] text-[var(--cocoa-lt)] mt-0.5">{m.sensor}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Detection Methods ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-3">HOW WE DETECT</div>
          <div className="space-y-2">
            {[
              { what: "Sleep quality", how: "Low ODBA (<0.05g) duration + waking frequency", ref: "Miyazaki 2020" },
              { what: "Grooming", how: "Rhythmic Y-axis 0.8-1.2 Hz via gyroscope", ref: "Ikurior 2023" },
              { what: "Activity level", how: "Overall Dynamic Body Acceleration (ODBA)", ref: "Tattersall 2021" },
              { what: "Feeding", how: "Downward head angle + INP proximity trigger", ref: "Mealin 2024" },
              { what: "Pain indicators", how: "Gait irregularity + reduced activity vs baseline", ref: "Evangelista 2023" },
            ].map((item) => (
              <div key={item.what} className="flex items-start gap-2 py-2 px-3 rounded-lg" style={{ background: "var(--cream)" }}>
                <span className="text-[10px] mt-0.5">📚</span>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-[var(--cocoa)]">{item.what}</div>
                  <div className="text-[10px] text-[var(--cocoa-lt)]">{item.how}</div>
                  <div className="font-pixel text-[5px] text-[var(--mint-dk)] mt-0.5">{item.ref}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Vet prompt ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          <span className="text-2xl">🏥</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-0.5">Schedule a vet visit?</div>
            <div className="text-[11px] text-white/50">
              Recommended: annual wellness check
            </div>
          </div>
          <button
            onClick={() => setShowVetFinder(true)}
            className="font-pixel text-[7px] px-3 py-2 rounded-xl text-[var(--plum)] pixel-press"
            style={{
              background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
              boxShadow: "2px 2px 0 var(--cocoa)",
            }}
          >
            FIND
          </button>
        </div>
      </div>

      {/* ══════════ VET FINDER MODAL ══════════ */}
      {showVetFinder && (
        <VetFinderModal onClose={() => setShowVetFinder(false)} />
      )}
    </>
  );
}

type VetEntry = { id: string; name: string; address: string; distance: string; rating: number; phone: string; hours: string; emoji: string; lat: number; lng: number };

const HOME_ADDRESS_KEY = "purrdict_home_address";
const HOME_COORDS_KEY = "purrdict_home_coords";

// Haversine formula — calculates distance between two lat/lng points in km
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

// Worldwide vet database — covers multiple countries/regions (with coordinates)
const WORLDWIDE_VETS: Record<string, VetEntry[]> = {
  "default": [
    { id: "1", name: "Happy Paws Veterinary Clinic", address: "123 Rizal Ave, Quezon City, Philippines", distance: "0.8 km", rating: 4.8, phone: "+63 2 8123 4567", hours: "Mon-Sat 8AM-6PM", emoji: "🏥", lat: 14.6318, lng: 120.9830 },
    { id: "2", name: "Pet Care Animal Hospital", address: "456 EDSA, Mandaluyong, Philippines", distance: "1.2 km", rating: 4.6, phone: "+63 2 8234 5678", hours: "Mon-Sun 7AM-9PM", emoji: "🐾", lat: 14.5764, lng: 121.0344 },
    { id: "3", name: "Cat & Dog Wellness Center", address: "789 Shaw Blvd, Pasig, Philippines", distance: "2.1 km", rating: 4.9, phone: "+63 2 8345 6789", hours: "Mon-Fri 9AM-7PM", emoji: "❤️", lat: 14.5818, lng: 121.0545 },
    { id: "4", name: "VetLink 24/7 Emergency", address: "321 Ortigas Ave, San Juan, Philippines", distance: "2.8 km", rating: 4.7, phone: "+63 2 8456 7890", hours: "Open 24 Hours", emoji: "🚨", lat: 14.5900, lng: 121.0260 },
    { id: "5", name: "Furry Friends Vet", address: "555 Katipunan Ave, QC, Philippines", distance: "3.5 km", rating: 4.5, phone: "+63 2 8567 8901", hours: "Mon-Sat 9AM-5PM", emoji: "🐱", lat: 14.6390, lng: 121.0755 },
  ],
  "new york": [
    { id: "ny1", name: "Animal Medical Center", address: "510 E 62nd St, New York, NY, USA", distance: "0.5 mi", rating: 4.7, phone: "+1 212-838-8100", hours: "Open 24 Hours", emoji: "🏥", lat: 40.7614, lng: -73.9601 },
    { id: "ny2", name: "BluePearl Pet Hospital", address: "410 W 55th St, New York, NY, USA", distance: "1.1 mi", rating: 4.6, phone: "+1 212-767-0099", hours: "Open 24 Hours", emoji: "🚨", lat: 40.7658, lng: -73.9876 },
    { id: "ny3", name: "Heart of Chelsea Animal Hospital", address: "257 W 18th St, New York, NY, USA", distance: "1.8 mi", rating: 4.9, phone: "+1 212-924-6116", hours: "Mon-Fri 8AM-8PM", emoji: "❤️", lat: 40.7401, lng: -73.9986 },
    { id: "ny4", name: "Tribeca Soho Animal Hospital", address: "177 Hudson St, New York, NY, USA", distance: "2.3 mi", rating: 4.5, phone: "+1 212-925-6100", hours: "Mon-Sat 8AM-6PM", emoji: "🐾", lat: 40.7215, lng: -74.0080 },
  ],
  "london": [
    { id: "ld1", name: "The Royal Veterinary College", address: "Hawkshead Lane, Hatfield, London, UK", distance: "0.3 mi", rating: 4.8, phone: "+44 1707 666333", hours: "Open 24 Hours", emoji: "🏥", lat: 51.7002, lng: -0.2069 },
    { id: "ld2", name: "Medivet Islington", address: "343 Upper St, London N1, UK", distance: "1.0 mi", rating: 4.7, phone: "+44 20 7226 1056", hours: "Mon-Sat 9AM-7PM", emoji: "🐾", lat: 51.5448, lng: -0.1028 },
    { id: "ld3", name: "Village Vet Hampstead", address: "88 Rosslyn Hill, London NW3, UK", distance: "1.5 mi", rating: 4.9, phone: "+44 20 7794 4948", hours: "Mon-Fri 8AM-7PM", emoji: "❤️", lat: 51.5565, lng: -0.1762 },
    { id: "ld4", name: "Battersea Dogs & Cats Home Clinic", address: "4 Battersea Park Rd, London SW8, UK", distance: "2.4 mi", rating: 4.6, phone: "+44 20 7622 3626", hours: "Mon-Sun 9AM-5PM", emoji: "🐱", lat: 51.4760, lng: -0.1474 },
  ],
  "tokyo": [
    { id: "tk1", name: "Tokyo Animal Medical Center", address: "2-5-8 Motoazabu, Minato-ku, Tokyo, Japan", distance: "0.6 km", rating: 4.8, phone: "+81 3-3452-7682", hours: "Open 24 Hours", emoji: "🏥", lat: 35.6520, lng: 139.7270 },
    { id: "tk2", name: "Azabu Juban Animal Hospital", address: "1-3-1 Azabujuban, Minato-ku, Tokyo, Japan", distance: "1.1 km", rating: 4.7, phone: "+81 3-3456-1212", hours: "Mon-Sat 9AM-7PM", emoji: "🐾", lat: 35.6540, lng: 139.7370 },
    { id: "tk3", name: "Japan Animal Referral Hospital", address: "2-11-1 Himonya, Meguro-ku, Tokyo, Japan", distance: "2.0 km", rating: 4.9, phone: "+81 3-5773-2828", hours: "Open 24 Hours", emoji: "🚨", lat: 35.6270, lng: 139.6940 },
    { id: "tk4", name: "Neko Cat Clinic", address: "3-7-2 Jingumae, Shibuya-ku, Tokyo, Japan", distance: "2.8 km", rating: 4.6, phone: "+81 3-3401-5501", hours: "Mon-Fri 10AM-6PM", emoji: "🐱", lat: 35.6700, lng: 139.7080 },
  ],
  "sydney": [
    { id: "sy1", name: "Sydney Animal Hospitals", address: "193 Alison Rd, Randwick NSW 2031, Australia", distance: "0.9 km", rating: 4.7, phone: "+61 2 9399 7722", hours: "Open 24 Hours", emoji: "🏥", lat: -33.9050, lng: 151.2410 },
    { id: "sy2", name: "Bondi Junction Vet", address: "252 Oxford St, Bondi Junction NSW, Australia", distance: "1.5 km", rating: 4.6, phone: "+61 2 9387 4422", hours: "Mon-Sat 8AM-6PM", emoji: "🐾", lat: -33.8932, lng: 151.2478 },
    { id: "sy3", name: "Inner West Vet Hospital", address: "99 Victoria Rd, Marrickville NSW, Australia", distance: "2.2 km", rating: 4.8, phone: "+61 2 9516 1466", hours: "Mon-Sun 7AM-9PM", emoji: "❤️", lat: -33.9110, lng: 151.1560 },
    { id: "sy4", name: "Cat Only Vet Clinic", address: "33 Pacific Hwy, St Leonards NSW, Australia", distance: "3.1 km", rating: 4.9, phone: "+61 2 9436 3755", hours: "Mon-Fri 9AM-5PM", emoji: "🐱", lat: -33.8290, lng: 151.1940 },
  ],
  "toronto": [
    { id: "to1", name: "VCA Canada 404 Veterinary", address: "1800 Sheppard Ave E, Toronto, ON, Canada", distance: "1.0 km", rating: 4.6, phone: "+1 416-491-1535", hours: "Mon-Sat 8AM-8PM", emoji: "🏥", lat: 43.7677, lng: -79.3350 },
    { id: "to2", name: "Dundas West Animal Hospital", address: "2232 Dundas St W, Toronto, ON, Canada", distance: "1.7 km", rating: 4.8, phone: "+1 416-535-5005", hours: "Mon-Fri 8AM-7PM", emoji: "🐾", lat: 43.6522, lng: -79.4410 },
    { id: "to3", name: "Toronto Emergency Vet", address: "920 Yonge St, Toronto, ON, Canada", distance: "2.3 km", rating: 4.7, phone: "+1 416-920-2002", hours: "Open 24 Hours", emoji: "🚨", lat: 43.6760, lng: -79.3880 },
    { id: "to4", name: "Cat Clinic Toronto", address: "445 Mount Pleasant Rd, Toronto, ON, Canada", distance: "3.0 km", rating: 4.9, phone: "+1 416-487-1171", hours: "Mon-Sat 9AM-5PM", emoji: "🐱", lat: 43.7050, lng: -79.3890 },
  ],
  "berlin": [
    { id: "be1", name: "Tierklinik Berlin", address: "Danziger Str. 15, 10435 Berlin, Germany", distance: "0.7 km", rating: 4.7, phone: "+49 30 4405 3670", hours: "Open 24 Hours", emoji: "🏥", lat: 52.5395, lng: 13.4180 },
    { id: "be2", name: "Tierarztpraxis am Kollwitzplatz", address: "Kollwitzstraße 48, 10405 Berlin, Germany", distance: "1.2 km", rating: 4.8, phone: "+49 30 442 7788", hours: "Mon-Fri 9AM-7PM", emoji: "🐾", lat: 52.5340, lng: 13.4130 },
    { id: "be3", name: "Katzen-Klinik Berlin", address: "Schönhauser Allee 10, 10119 Berlin, Germany", distance: "1.9 km", rating: 4.9, phone: "+49 30 4424 560", hours: "Mon-Sat 8AM-6PM", emoji: "🐱", lat: 52.5290, lng: 13.4050 },
  ],
  "singapore": [
    { id: "sg1", name: "Mount Pleasant Veterinary Centre", address: "232 Whitley Rd, Singapore 297824", distance: "0.5 km", rating: 4.8, phone: "+65 6250 8333", hours: "Mon-Sun 8AM-10PM", emoji: "🏥", lat: 1.3250, lng: 103.8270 },
    { id: "sg2", name: "The Animal Clinic", address: "17 Prince Charles Crescent, Singapore 159016", distance: "1.3 km", rating: 4.6, phone: "+65 6475 0080", hours: "Mon-Sat 9AM-7PM", emoji: "🐾", lat: 1.2900, lng: 103.8060 },
    { id: "sg3", name: "Animal Recovery Centre", address: "319 Joo Chiat Pl, Singapore 427571", distance: "2.0 km", rating: 4.7, phone: "+65 6346 0006", hours: "Open 24 Hours", emoji: "🚨", lat: 1.3130, lng: 103.9020 },
    { id: "sg4", name: "Cat Clinic Singapore", address: "79 Frankel Ave, Singapore 458210", distance: "2.8 km", rating: 4.9, phone: "+65 6448 7677", hours: "Mon-Sat 9AM-6PM", emoji: "🐱", lat: 1.3100, lng: 103.9060 },
  ],
};

function findVetsByLocation(query: string): VetEntry[] {
  const q = query.toLowerCase().trim();
  for (const [key, vets] of Object.entries(WORLDWIDE_VETS)) {
    if (key !== "default" && q.includes(key)) return vets;
  }
  if (q.includes("usa") || q.includes("united states") || q.includes("america")) return WORLDWIDE_VETS["new york"];
  if (q.includes("uk") || q.includes("england") || q.includes("united kingdom")) return WORLDWIDE_VETS["london"];
  if (q.includes("japan") || q.includes("nihon")) return WORLDWIDE_VETS["tokyo"];
  if (q.includes("australia") || q.includes("aus")) return WORLDWIDE_VETS["sydney"];
  if (q.includes("canada")) return WORLDWIDE_VETS["toronto"];
  if (q.includes("germany") || q.includes("deutschland")) return WORLDWIDE_VETS["berlin"];
  if (q.includes("philippines") || q.includes("manila") || q.includes("quezon") || q.includes("cebu") || q.includes("davao")) return WORLDWIDE_VETS["default"];
  if (q.includes("singapore")) return WORLDWIDE_VETS["singapore"];
  const allVets = Object.values(WORLDWIDE_VETS).flat();
  return allVets.slice(0, 5);
}

function VetFinderModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVet, setSelectedVet] = useState<VetEntry | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<VetEntry[]>([]);
  const [homeAddress, setHomeAddress] = useState("");
  const [homeCoords, setHomeCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showHomeSetup, setShowHomeSetup] = useState(false);
  const [homeInput, setHomeInput] = useState("");
  const [savingHome, setSavingHome] = useState(false);

  // Load saved home address on mount
  useEffect(() => {
    const savedAddr = localStorage.getItem(HOME_ADDRESS_KEY);
    const savedCoords = localStorage.getItem(HOME_COORDS_KEY);
    if (savedAddr) setHomeAddress(savedAddr);
    if (savedCoords) {
      try { setHomeCoords(JSON.parse(savedCoords)); } catch { /* ignore */ }
    }
  }, []);

  // Calculate distances from home and sort results
  function getResultsWithDistance(vets: VetEntry[]): VetEntry[] {
    if (!homeCoords) return vets;
    return vets.map((vet) => {
      const dist = haversineDistance(homeCoords.lat, homeCoords.lng, vet.lat, vet.lng);
      return { ...vet, distance: formatDistance(dist) };
    }).sort((a, b) => {
      const aDist = haversineDistance(homeCoords.lat, homeCoords.lng, a.lat, a.lng);
      const bDist = haversineDistance(homeCoords.lat, homeCoords.lng, b.lat, b.lng);
      return aDist - bDist;
    });
  }

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedVet(null);
    setTimeout(() => {
      const found = findVetsByLocation(searchQuery);
      setResults(getResultsWithDistance(found));
      setIsSearching(false);
    }, 1000);
  }

  function handleUseMyLocation() {
    setSearchQuery("📍 Detecting location...");
    setIsSearching(true);
    setSelectedVet(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=en`);
            if (res.ok) {
              const data = await res.json();
              const city = data.address?.city || data.address?.town || data.address?.state || data.address?.country || "your area";
              const country = data.address?.country || "";
              const locationStr = `${city}${country ? ", " + country : ""}`;
              setSearchQuery(locationStr);
              // Use current position for distance if no home set
              const coordsToUse = homeCoords || { lat: latitude, lng: longitude };
              const found = findVetsByLocation(locationStr);
              const withDist = found.map((vet) => {
                const dist = haversineDistance(coordsToUse.lat, coordsToUse.lng, vet.lat, vet.lng);
                return { ...vet, distance: formatDistance(dist) };
              }).sort((a, b) => {
                const aDist = haversineDistance(coordsToUse.lat, coordsToUse.lng, a.lat, a.lng);
                const bDist = haversineDistance(coordsToUse.lat, coordsToUse.lng, b.lat, b.lng);
                return aDist - bDist;
              });
              setResults(withDist);
            } else {
              setSearchQuery("Your current location");
              setResults(getResultsWithDistance(findVetsByLocation("")));
            }
          } catch {
            setSearchQuery("Your current location");
            setResults(getResultsWithDistance(findVetsByLocation("")));
          }
          setIsSearching(false);
        },
        () => {
          setSearchQuery("Location unavailable");
          setResults(getResultsWithDistance(findVetsByLocation("")));
          setIsSearching(false);
        },
        { timeout: 8000 }
      );
    } else {
      setTimeout(() => {
        setSearchQuery("Location unavailable");
        setResults(getResultsWithDistance(findVetsByLocation("")));
        setIsSearching(false);
      }, 1000);
    }
  }

  // Geocode home address using OpenStreetMap Nominatim
  async function handleSaveHome() {
    if (!homeInput.trim()) return;
    setSavingHome(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(homeInput)}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          setHomeCoords(coords);
          setHomeAddress(homeInput.trim());
          localStorage.setItem(HOME_ADDRESS_KEY, homeInput.trim());
          localStorage.setItem(HOME_COORDS_KEY, JSON.stringify(coords));
          setShowHomeSetup(false);
          // Recalculate distances if results exist
          if (results.length > 0) {
            const updated = results.map((vet) => {
              const dist = haversineDistance(coords.lat, coords.lng, vet.lat, vet.lng);
              return { ...vet, distance: formatDistance(dist) };
            }).sort((a, b) => {
              const aDist = haversineDistance(coords.lat, coords.lng, a.lat, a.lng);
              const bDist = haversineDistance(coords.lat, coords.lng, b.lat, b.lng);
              return aDist - bDist;
            });
            setResults(updated);
          }
        } else {
          alert("Could not find that address. Try being more specific.");
        }
      }
    } catch {
      alert("Failed to geocode address. Check your connection.");
    }
    setSavingHome(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,18,37,0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-lg mx-2 mb-2 max-h-[85vh] flex flex-col rounded-2xl overflow-hidden animate-fade-up"
        style={{
          background: "var(--cream)",
          border: "3px solid var(--cocoa)",
          boxShadow: "5px 5px 0 var(--cocoa)",
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: "2px solid var(--cream2)" }}>
          <div>
            <div className="font-pixel text-[9px] text-[var(--pink-dk)]">FIND A VET</div>
            <div className="text-lg font-bold text-[var(--cocoa)]">Veterinary Clinics Worldwide</div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-[var(--cream2)]"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Search any city or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] placeholder:text-[var(--cocoa-lt)] outline-none"
              style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
              aria-label="Location search"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-3 rounded-xl font-pixel text-[8px] text-white pixel-press"
              style={{ background: "linear-gradient(135deg, var(--pink-dk), var(--pink))", border: "2px solid var(--cocoa)", boxShadow: "2px 2px 0 var(--cocoa)" }}
            >
              SEARCH
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseMyLocation}
              className="flex-1 py-2.5 rounded-xl text-[12px] text-[var(--mint-dk)] font-medium hover:bg-[var(--cream2)] transition-colors flex items-center justify-center gap-2"
              style={{ border: "1.5px dashed var(--mint-dk)" }}
            >
              📍 Use my current location
            </button>
            <button
              onClick={() => { setShowHomeSetup(!showHomeSetup); setHomeInput(homeAddress); }}
              className="px-3 py-2.5 rounded-xl text-[12px] font-medium hover:bg-[var(--cream2)] transition-colors flex items-center justify-center gap-1"
              style={{ border: "1.5px dashed var(--plum-lt)", color: "var(--plum-lt)" }}
            >
              🏠 {homeAddress ? "Edit" : "Set Home"}
            </button>
          </div>

          {/* Home address display */}
          {homeAddress && !showHomeSetup && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: "rgba(79,174,148,0.08)", border: "1px solid rgba(79,174,148,0.2)" }}>
              <span className="text-sm">🏠</span>
              <div className="flex-1 min-w-0">
                <div className="font-pixel text-[6px] text-[var(--mint-dk)]">HOME ADDRESS</div>
                <div className="text-[11px] text-[var(--cocoa)] truncate">{homeAddress}</div>
              </div>
              <div className="font-pixel text-[6px] text-[var(--mint-dk)]">✓ SET</div>
            </div>
          )}

          {/* Home address setup */}
          {showHomeSetup && (
            <div className="p-3 rounded-xl space-y-2" style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}>
              <div className="font-pixel text-[7px] text-[var(--cocoa-lt)]">🏠 SET YOUR HOME ADDRESS</div>
              <div className="text-[10px] text-[var(--cocoa-lt)]">Distances to vet clinics will be calculated from your home.</div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Quezon City, Philippines"
                  value={homeInput}
                  onChange={(e) => setHomeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveHome()}
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm text-[var(--cocoa)] placeholder:text-[var(--cocoa-lt)] outline-none"
                  style={{ background: "var(--cream)", border: "1.5px solid var(--cocoa-lt)" }}
                  aria-label="Home address input"
                />
                <button
                  onClick={handleSaveHome}
                  disabled={savingHome || !homeInput.trim()}
                  className="px-3 py-2.5 rounded-lg font-pixel text-[7px] text-white disabled:opacity-40"
                  style={{ background: "var(--mint-dk)", boxShadow: "2px 2px 0 var(--cocoa)" }}
                >
                  {savingHome ? "..." : "SAVE"}
                </button>
              </div>
              {homeAddress && (
                <button onClick={() => setShowHomeSetup(false)} className="font-pixel text-[6px] text-[var(--cocoa-lt)] hover:text-[var(--cocoa)]">
                  ← Cancel
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {isSearching && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-[var(--mint-dk)] animate-spin" />
              <span className="font-pixel text-[8px] text-[var(--cocoa-lt)]">SEARCHING NEARBY VETS...</span>
            </div>
          )}

          {!isSearching && results.length === 0 && !selectedVet && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <span className="text-3xl">🐾</span>
              <span className="text-[12px] text-[var(--cocoa-lt)]">Search for your location to find nearby vets</span>
            </div>
          )}

          {/* Vet list */}
          {!isSearching && results.length > 0 && !selectedVet && (
            <div className="space-y-2.5">
              <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-2">
                {results.length} CLINICS FOUND NEARBY
              </div>
              {results.map((vet) => (
                <button
                  key={vet.id}
                  onClick={() => setSelectedVet(vet)}
                  className="w-full text-left p-3.5 rounded-xl transition-all hover:shadow-md"
                  style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "var(--cream)", border: "1.5px solid var(--cocoa)" }}
                    >
                      {vet.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[var(--cocoa)] truncate">{vet.name}</div>
                      <div className="text-[11px] text-[var(--cocoa-lt)] mt-0.5">{vet.address}</div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="font-pixel text-[7px] text-[var(--mint-dk)]">📍 {vet.distance}</span>
                        <span className="font-pixel text-[7px] text-[var(--yellow)]">⭐ {vet.rating}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected vet detail */}
          {selectedVet && (
            <div className="space-y-4 animate-fade-up">
              <button
                onClick={() => setSelectedVet(null)}
                className="font-pixel text-[8px] text-[var(--cocoa-lt)] flex items-center gap-1 hover:text-[var(--cocoa)]"
              >
                ← BACK TO RESULTS
              </button>

              <div
                className="rounded-xl p-4"
                style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "var(--cream)", border: "2px solid var(--cocoa)" }}
                  >
                    {selectedVet.emoji}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[var(--cocoa)]">{selectedVet.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-pixel text-[7px] text-[var(--mint-dk)]">📍 {selectedVet.distance}</span>
                      <span className="font-pixel text-[7px] text-[var(--yellow)]">⭐ {selectedVet.rating}</span>
                    </div>
                  </div>
                </div>

                {/* Contact details */}
                <div className="space-y-3">
                  {[
                    { icon: "📍", label: "Address", value: selectedVet.address },
                    { icon: "🏠", label: "Distance from Home", value: homeAddress ? selectedVet.distance : "Set home address to see distance" },
                    { icon: "📞", label: "Phone", value: selectedVet.phone },
                    { icon: "🕐", label: "Hours", value: selectedVet.hours },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-2.5 py-2 px-3 rounded-lg" style={{ background: "var(--cream)" }}>
                      <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <div className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{item.label.toUpperCase()}</div>
                        <div className="text-[13px] font-medium text-[var(--cocoa)] mt-0.5">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`tel:${selectedVet.phone.replace(/\s/g, "")}`}
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-pixel text-[8px] text-white pixel-press"
                  style={{
                    background: "linear-gradient(135deg, var(--mint-dk), var(--mint))",
                    border: "2px solid var(--cocoa)",
                    boxShadow: "3px 3px 0 var(--cocoa)",
                  }}
                >
                  📞 CALL NOW
                </a>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(selectedVet.name + " " + selectedVet.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-3.5 rounded-xl font-pixel text-[8px] text-white pixel-press"
                  style={{
                    background: "linear-gradient(135deg, var(--pink-dk), var(--pink))",
                    border: "2px solid var(--cocoa)",
                    boxShadow: "3px 3px 0 var(--cocoa)",
                  }}
                >
                  🗺️ DIRECTIONS
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
