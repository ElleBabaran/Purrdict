"use client";
import { useState } from "react";
import TopBar from "@/components/nav/TopBar";
import { healthAlert, healthWeek, healthStats } from "@/lib/mockData";

const statusStyle: Record<string, { bar: string; text: string; bg: string }> = {
  normal: { bar: "var(--mint-dk)",  text: "text-[var(--mint-dk)]",  bg: "rgba(79,174,148,0.12)"  },
  watch:  { bar: "var(--yellow)",   text: "text-[var(--yellow)]",   bg: "rgba(255,209,102,0.12)" },
  alert:  { bar: "var(--coral)",    text: "text-[var(--coral)]",    bg: "rgba(255,107,107,0.12)" },
};

const toneColor: Record<string, string> = {
  good:    "text-[var(--mint-dk)]",
  warn:    "text-[var(--pink-dk)]",
  neutral: "text-[var(--cocoa)]",
};

// Mock vet data — in production this would come from Google Places API or similar
const MOCK_VETS = [
  { id: "1", name: "Happy Paws Veterinary Clinic", address: "123 Rizal Ave, Quezon City", distance: "0.8 km", rating: 4.8, phone: "+63 2 8123 4567", hours: "Mon-Sat 8AM-6PM", emoji: "🏥" },
  { id: "2", name: "Pet Care Animal Hospital", address: "456 EDSA, Mandaluyong", distance: "1.2 km", rating: 4.6, phone: "+63 2 8234 5678", hours: "Mon-Sun 7AM-9PM", emoji: "🐾" },
  { id: "3", name: "Cat & Dog Wellness Center", address: "789 Shaw Blvd, Pasig", distance: "2.1 km", rating: 4.9, phone: "+63 2 8345 6789", hours: "Mon-Fri 9AM-7PM", emoji: "❤️" },
  { id: "4", name: "VetLink 24/7 Emergency", address: "321 Ortigas Ave, San Juan", distance: "2.8 km", rating: 4.7, phone: "+63 2 8456 7890", hours: "Open 24 Hours", emoji: "🚨" },
  { id: "5", name: "Furry Friends Vet", address: "555 Katipunan Ave, QC", distance: "3.5 km", rating: 4.5, phone: "+63 2 8567 8901", hours: "Mon-Sat 9AM-5PM", emoji: "🐱" },
];

export default function HealthPage() {
  const [showVetFinder, setShowVetFinder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVet, setSelectedVet] = useState<typeof MOCK_VETS[0] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<typeof MOCK_VETS>([]);

  function handleSearch() {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSelectedVet(null);
    // Simulate search delay
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
    <>
      <TopBar title="▸ HEALTH MONITOR" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Alert banner ── */}
        {healthAlert.active && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3 animate-fade-up"
            style={{
              background: "linear-gradient(135deg, rgba(255,107,107,0.12) 0%, rgba(255,107,107,0.06) 100%)",
              border: "2px solid rgba(255,107,107,0.35)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,107,107,0.15)", border: "1.5px solid rgba(255,107,107,0.3)" }}
            >
              ⚠️
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--coral)] mb-1">{healthAlert.title}</div>
              <p className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed">{healthAlert.desc}</p>
            </div>
          </div>
        )}

        {/* ── 7-day baseline ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-4">7-DAY BASELINE</div>
          <div className="space-y-3">
            {healthWeek.map((d) => {
              const ss = statusStyle[d.status];
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="font-pixel text-[9px] text-[var(--cocoa-lt)] w-10">{d.day}</span>
                  <div className="flex-1 h-2.5 bg-[var(--cream2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${d.score}%`, background: ss.bar }}
                    />
                  </div>
                  <span className={`font-pixel text-[8px] w-14 text-right ${ss.text}`}>
                    {d.status === "normal" ? "OK ✓" : d.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Health stats ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-3">HEALTH STATS</div>
          <div className="space-y-0">
            {healthStats.map((s, i) => (
              <div
                key={s.k}
                className="flex justify-between items-center py-2.5"
                style={{ borderBottom: i < healthStats.length - 1 ? "1px solid var(--cream2)" : "none" }}
              >
                <span className="text-[12px] text-[var(--cocoa-lt)]">{s.k}</span>
                <span className={`text-[12px] font-bold ${toneColor[s.tone]}`}>{s.v}</span>
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
              Last check-up was 3 months ago. Due for annual wellness.
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
            BOOK
          </button>
        </div>
      </div>

      {/* ══════════ VET FINDER MODAL ══════════ */}
      {showVetFinder && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(26,18,37,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => { setShowVetFinder(false); setSelectedVet(null); setResults([]); setSearchQuery(""); }}
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
                onClick={() => { setShowVetFinder(false); setSelectedVet(null); setResults([]); setSearchQuery(""); }}
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
      )}
    </>
  );
}
