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

const MOCK_VETS = [
  { id: "1", name: "Happy Paws Veterinary Clinic", address: "123 Rizal Ave, Quezon City", distance: "0.8 km", rating: 4.8, phone: "+63 2 8123 4567", hours: "Mon-Sat 8AM-6PM", emoji: "🏥" },
  { id: "2", name: "Pet Care Animal Hospital", address: "456 EDSA, Mandaluyong", distance: "1.2 km", rating: 4.6, phone: "+63 2 8234 5678", hours: "Mon-Sun 7AM-9PM", emoji: "🐾" },
  { id: "3", name: "Cat & Dog Wellness Center", address: "789 Shaw Blvd, Pasig", distance: "2.1 km", rating: 4.9, phone: "+63 2 8345 6789", hours: "Mon-Fri 9AM-7PM", emoji: "❤️" },
  { id: "4", name: "VetLink 24/7 Emergency", address: "321 Ortigas Ave, San Juan", distance: "2.8 km", rating: 4.7, phone: "+63 2 8456 7890", hours: "Open 24 Hours", emoji: "🚨" },
  { id: "5", name: "Furry Friends Vet", address: "555 Katipunan Ave, QC", distance: "3.5 km", rating: 4.5, phone: "+63 2 8567 8901", hours: "Mon-Sat 9AM-5PM", emoji: "🐱" },
];

function VetFinderModal({ onClose }: { onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVet, setSelectedVet] = useState<typeof MOCK_VETS[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof MOCK_VETS>([]);

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedVet(null);
    setTimeout(() => {
      setResults(MOCK_VETS);
      setIsSearching(false);
    }, 1000);
  }

  function handleUseMyLocation() {
    setSearchQuery("📍 Using current location...");
    setIsSearching(true);
    setSelectedVet(null);
    setTimeout(() => {
      setSearchQuery("Quezon City, Metro Manila");
      setResults(MOCK_VETS);
      setIsSearching(false);
    }, 1500);
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
            <div className="text-lg font-bold text-[var(--cocoa)]">Nearby Veterinary Clinics</div>
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
              placeholder="Enter your location or area..."
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
          <button
            onClick={handleUseMyLocation}
            className="w-full py-2.5 rounded-xl text-[12px] text-[var(--mint-dk)] font-medium hover:bg-[var(--cream2)] transition-colors flex items-center justify-center gap-2"
            style={{ border: "1.5px dashed var(--mint-dk)" }}
          >
            📍 Use my current location
          </button>
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
