"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import TopBar from "@/components/nav/TopBar";
import GpsMap from "@/components/GpsMap";
import { useAuth } from "@/lib/AuthContext";
import AddressAutocomplete, { AddressSuggestion } from "@/components/AddressAutocomplete";

// Separate keys from the Vet Finder's home address (health/page.tsx) —
// they used to share "purrdict_home_address"/"purrdict_home_coords",
// which meant setting a home address in Vet Finder (just to compute
// clinic distance) silently set up GPS tracking too, with an address
// the owner never intended for that purpose. Now each feature keeps its
// own home location.
const HOME_ADDRESS_KEY = "purrdict_gps_home_address";
const HOME_COORDS_KEY = "purrdict_gps_home_coords";
const GEOFENCE_RADIUS = 80; // meters
const METERS_PER_DEG_LAT = 111320;

// ── Realistic movement simulation ──
// Instead of teleporting between fixed waypoints, the cat picks a random
// destination within roaming range, walks toward it at a mode-dependent
// speed, then pauses to rest/groom before picking a new destination —
// the same "random waypoint" model used to simulate animal movement.
type WalkMode = "resting" | "grooming" | "exploring" | "walking" | "playing";

const MODE_LABELS: Record<WalkMode, string> = {
  resting: "Napping",
  grooming: "Grooming",
  exploring: "Exploring",
  walking: "Walking around",
  playing: "Playing",
};

// [min, max] speed in meters/second per activity mode
const MODE_SPEEDS: Record<WalkMode, [number, number]> = {
  resting: [0, 0],
  grooming: [0, 0],
  exploring: [0.3, 0.6],
  walking: [0.5, 1.0],
  playing: [1.2, 2.2],
};

function metersToLatLng(home: [number, number], dLatM: number, dLngM: number): [number, number] {
  const lat = home[0] + dLatM / METERS_PER_DEG_LAT;
  const lng = home[1] + dLngM / (METERS_PER_DEG_LAT * Math.cos((home[0] * Math.PI) / 180));
  return [lat, lng];
}

function latLngToMeters(home: [number, number], point: [number, number]): [number, number] {
  const dLatM = (point[0] - home[0]) * METERS_PER_DEG_LAT;
  const dLngM = (point[1] - home[1]) * METERS_PER_DEG_LAT * Math.cos((home[0] * Math.PI) / 180);
  return [dLatM, dLngM];
}

interface WalkTarget {
  lat: number;
  lng: number;
  mode: WalkMode;
  speedMps: number;
}

// Pick a new destination — mostly within the geofence, with an occasional
// (~12%) longer excursion so the "outside geofence" alert can still trigger.
function pickNewTarget(home: [number, number], radius: number): WalkTarget {
  const goOutside = Math.random() < 0.12;
  const maxR = goOutside ? radius * 1.35 : radius * 0.9;
  const r = maxR * Math.sqrt(Math.random()); // uniform sampling within a disk
  const angle = Math.random() * Math.PI * 2;
  const dLatM = r * Math.sin(angle);
  const dLngM = r * Math.cos(angle);
  const [lat, lng] = metersToLatLng(home, dLatM, dLngM);

  const activeModes: WalkMode[] = ["exploring", "walking", "playing"];
  const mode = activeModes[Math.floor(Math.random() * activeModes.length)];
  const [minS, maxS] = MODE_SPEEDS[mode];
  const speedMps = minS + Math.random() * (maxS - minS);

  return { lat, lng, mode, speedMps };
}

function pickRestBreak(): { mode: WalkMode; pauseMs: number } {
  const restModes: WalkMode[] = ["resting", "grooming"];
  const mode = restModes[Math.floor(Math.random() * restModes.length)];
  const pauseMs = 4000 + Math.random() * 12000; // 4-16s pause
  return { mode, pauseMs };
}

// Generate trail stops around home
function generateTrailStops(home: [number, number]) {
  const [lat, lng] = home;
  return [
    { lat: lat + 0.0005, lng: lng + 0.0004, label: "Resting", time: "9:15 AM", emoji: "☀️" },
    { lat: lat + 0.0008, lng: lng + 0.0001, label: "Exploring", time: "10:02 AM", emoji: "🐾" },
    { lat: lat + 0.0009, lng: lng - 0.0002, label: "Nap spot", time: "11:30 AM", emoji: "😴" },
    { lat: lat + 0.0004, lng: lng - 0.0004, label: "Playing", time: "1:45 PM", emoji: "🎯" },
    { lat: lat + 0.0001, lng: lng - 0.0001, label: "Grooming", time: "2:20 PM", emoji: "✨" },
  ];
}

export default function MapPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Mochi";

  const [homeAddress, setHomeAddress] = useState("");
  const [homeCoords, setHomeCoords] = useState<[number, number] | null>(null);
  const [addressInput, setAddressInput] = useState("");
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  // Confirmation step
  const [pendingCoords, setPendingCoords] = useState<[number, number] | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState("");

  const [currentPos, setCurrentPos] = useState<[number, number] | null>(null);
  const [status, setStatus] = useState("At home");
  const [distance, setDistance] = useState(0);
  const [currentTime, setCurrentTime] = useState("");
  const walkStateRef = useRef<{
    target: WalkTarget | null;
    pausedUntil: number;
    pauseMode: WalkMode;
  }>({ target: null, pausedUntil: 0, pauseMode: "resting" });

  // Load saved home address
  useEffect(() => {
    const savedAddr = localStorage.getItem(HOME_ADDRESS_KEY);
    const savedCoords = localStorage.getItem(HOME_COORDS_KEY);
    if (savedAddr && savedCoords) {
      setHomeAddress(savedAddr);
      try {
        const coords = JSON.parse(savedCoords);
        setHomeCoords([coords.lat, coords.lng]);
        setCurrentPos([coords.lat, coords.lng]);
      } catch { /* ignore */ }
    }
  }, []);

  // Clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate realistic GPS movement once home is set.
  // Model: the cat walks in a straight line toward a randomly chosen
  // destination at a mode-dependent speed (tick-based, ~1.2m per 400ms
  // at "walking" pace), then pauses to rest/groom before choosing a new
  // destination — smooth continuous motion instead of teleporting
  // between fixed waypoints.
  useEffect(() => {
    if (!homeCoords) return;
    const TICK_MS = 400;

    let pos: [number, number] = currentPos || homeCoords;

    const tick = () => {
      const now = Date.now();
      const state = walkStateRef.current;

      // Currently paused (resting/grooming) — just hold position.
      if (now < state.pausedUntil) {
        setStatus(MODE_LABELS[state.pauseMode]);
        return;
      }

      // No active target — either just finished pausing or first run.
      if (!state.target) {
        state.target = pickNewTarget(homeCoords, GEOFENCE_RADIUS);
      }

      const target = state.target;
      const [dLatM, dLngM] = latLngToMeters(pos, [target.lat, target.lng]);
      const remainingM = Math.sqrt(dLatM * dLatM + dLngM * dLngM);
      const stepM = target.speedMps * (TICK_MS / 1000);

      if (remainingM <= stepM || remainingM < 0.5) {
        // Arrived — snap to target, then take a rest break before the next leg.
        pos = [target.lat, target.lng];
        const rest = pickRestBreak();
        state.target = null;
        state.pausedUntil = now + rest.pauseMs;
        state.pauseMode = rest.mode;
        setStatus(MODE_LABELS[target.mode]);
      } else {
        // Move a step toward the target (linear interpolation).
        const ratio = stepM / remainingM;
        const [curDLatM, curDLngM] = latLngToMeters(homeCoords, pos);
        const nextDLatM = curDLatM + (dLatM * ratio);
        const nextDLngM = curDLngM + (dLngM * ratio);
        pos = metersToLatLng(homeCoords, nextDLatM, nextDLngM);
        setStatus(MODE_LABELS[target.mode]);
      }

      setCurrentPos(pos);
      const [distLatM, distLngM] = latLngToMeters(homeCoords, pos);
      setDistance(Math.round(Math.sqrt(distLatM * distLatM + distLngM * distLngM)));
    };

    const interval = setInterval(tick, TICK_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeCoords]);

  // Geocode address — step 1: resolve and show for confirmation
  const handleSearchAddress = useCallback(async () => {
    if (!addressInput.trim()) {
      setAddressError("Enter your home address.");
      return;
    }
    setSavingAddress(true);
    setAddressError("");
    setPendingCoords(null);
    setResolvedAddress("");

    try {
      const res = await fetch(`/api/geocode/resolve?query=${encodeURIComponent(addressInput.trim())}`);
      const data = await res.json();
      if (res.ok && data.result) {
        if (!data.result.isSpecific) {
          setAddressError("Address too vague. Please include street name or more details.");
          setSavingAddress(false);
          return;
        }
        setPendingCoords([data.result.lat, data.result.lng]);
        setResolvedAddress(data.result.label);
      } else {
        setAddressError("Address not found. Make sure the address exists and try including city/country.");
      }
    } catch {
      setAddressError("Network error. Try again.");
    }
    setSavingAddress(false);
  }, [addressInput]);

  // Picking a suggestion from the dropdown already has coordinates —
  // skip re-geocoding and go straight to the confirmation step.
  function handleSelectAddressSuggestion(suggestion: AddressSuggestion) {
    setAddressInput(suggestion.label);
    setAddressError("");
    setPendingCoords([suggestion.lat, suggestion.lng]);
    setResolvedAddress(suggestion.label);
  }

  // Step 2: User confirms the resolved address
  function handleConfirmAddress() {
    if (!pendingCoords) return;
    setHomeCoords(pendingCoords);
    setCurrentPos(pendingCoords);
    setHomeAddress(resolvedAddress || addressInput.trim());
    localStorage.setItem(HOME_ADDRESS_KEY, resolvedAddress || addressInput.trim());
    localStorage.setItem(HOME_COORDS_KEY, JSON.stringify({ lat: pendingCoords[0], lng: pendingCoords[1] }));
    setPendingCoords(null);
    setResolvedAddress("");
  }

  function handleRejectAddress() {
    setPendingCoords(null);
    setResolvedAddress("");
    setAddressError("");
  }

  const isInsideGeofence = distance <= GEOFENCE_RADIUS;
  const trailStops = homeCoords ? generateTrailStops(homeCoords) : [];

  // ─── No address set yet ───
  if (!homeCoords) {
    return (
      <>
        <TopBar title="▸ GPS TRACKER" />
        <div className="px-4 py-5 space-y-5">
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-4xl"
              style={{
                background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
                border: "3px solid var(--cocoa)",
                boxShadow: "4px 4px 0 var(--cocoa)",
              }}
            >
              🗺️
            </div>
            <h2 className="text-xl font-bold text-[var(--cocoa)] mb-1">Set Your Home Location</h2>
            <p className="text-sm text-[var(--cocoa-lt)]">
              Enter your home address to see the GPS map and track your cat&apos;s location relative to home.
            </p>
          </div>

          <div
            className="rounded-2xl p-5"
            style={{ background: "white", border: "3px solid var(--cocoa)", boxShadow: "5px 5px 0 var(--cocoa)" }}
          >
            {/* Confirmation step — show resolved address */}
            {pendingCoords && resolvedAddress ? (
              <div className="space-y-4">
                <div className="font-pixel text-[7px] text-[var(--mint-dk)] mb-1">✓ ADDRESS FOUND</div>
                <div className="px-3 py-3 rounded-xl text-[12px] text-[var(--cocoa)] leading-relaxed" style={{ background: "var(--cream)", border: "2px solid var(--mint-dk)" }}>
                  📍 {resolvedAddress}
                </div>
                <div className="text-[10px] text-[var(--cocoa-lt)] text-center">
                  Is this the correct location?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleRejectAddress}
                    className="py-3 rounded-xl font-pixel text-[8px] text-[var(--cocoa)] transition-all"
                    style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
                  >
                    ✕ NO, TRY AGAIN
                  </button>
                  <button
                    onClick={handleConfirmAddress}
                    className="py-3 rounded-xl font-pixel text-[8px] text-white transition-all pixel-press"
                    style={{ background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)", boxShadow: "3px 3px 0 var(--cocoa)" }}
                  >
                    ✓ YES, SET HOME
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-2">🏠 HOME ADDRESS</div>
                <div className="mb-3">
                  <AddressAutocomplete
                    placeholder="e.g. 123 Main St, Quezon City, Philippines"
                    value={addressInput}
                    onChange={(v) => { setAddressInput(v); setAddressError(""); }}
                    onSelect={handleSelectAddressSuggestion}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchAddress()}
                    inputClassName="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] placeholder:text-[var(--cocoa-lt)] outline-none focus:ring-2 focus:ring-[var(--mint-dk)]"
                    inputStyle={{ background: "var(--cream)", border: "2.5px solid var(--cream2)" }}
                    aria-label="Home address"
                  />
                </div>

                {addressError && (
                  <div className="text-[11px] text-[var(--coral)] mb-3 font-medium">{addressError}</div>
                )}

                <button
                  onClick={handleSearchAddress}
                  disabled={savingAddress || !addressInput.trim()}
                  className="w-full py-3.5 rounded-xl font-pixel text-[9px] transition-all pixel-press disabled:opacity-40"
                  style={{
                    background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
                    color: "var(--plum)",
                    boxShadow: "4px 4px 0 var(--cocoa)",
                  }}
                >
                  {savingAddress ? "📍 SEARCHING..." : "📍 FIND ADDRESS"}
                </button>

                <div className="text-[9px] text-[var(--cocoa-lt)] mt-3 text-center leading-relaxed">
                  Enter your full home address including street, city, and country for accurate results.
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ─── Map view (address is set) ───
  return (
    <>
      <TopBar title="▸ GPS TRACKER" />
      <div className="px-4 py-5 space-y-4">

        {/* ── GPS Map ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: "2px solid var(--plum-lt)",
            boxShadow: "4px 4px 0 var(--cocoa)",
            background: "var(--plum-xl)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#7FD8BE] animate-blink" />
              <span className="font-pixel text-[8px] text-[var(--mint)]">GPS LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[7px] text-white/40">{currentTime}</span>
              <span className="font-pixel text-[7px] text-white/40">·</span>
              <span className="font-pixel text-[7px] text-white/40">ESP32</span>
            </div>
          </div>

          {/* Map */}
          <GpsMap
            catName={catName}
            homePosition={homeCoords}
            geofenceRadius={GEOFENCE_RADIUS}
            trail={trailStops}
            currentPosition={currentPos || homeCoords}
          />

          {/* Legend */}
          <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: "1.5px solid rgba(255,255,255,0.06)" }}>
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF8FA3]" /> {catName}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <span className="w-2.5 h-2.5 rounded-full" style={{ border: "1.5px dashed #4FAE94" }} /> Safe zone
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/60">
              <span className="w-4 h-0.5 bg-[#FFD166] rounded" /> Trail
            </span>
          </div>
        </div>

        {/* ── Home Address Info ── */}
        <div className="glass-card p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">🏠</span>
            <div className="min-w-0">
              <div className="font-pixel text-[6px] text-[var(--mint-dk)]">HOME</div>
              <div className="text-[11px] text-[var(--cocoa)] truncate">{homeAddress}</div>
            </div>
          </div>
          <button
            onClick={() => { setHomeCoords(null); setHomeAddress(""); setAddressInput(""); localStorage.removeItem(HOME_ADDRESS_KEY); localStorage.removeItem(HOME_COORDS_KEY); }}
            className="font-pixel text-[6px] text-[var(--cocoa-lt)] hover:text-[var(--coral)] px-2 py-1 rounded-lg transition-colors"
          >
            CHANGE
          </button>
        </div>

        {/* ── Status Card ── */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <div>
                <div className="text-[14px] font-bold text-[var(--cocoa)]">{status}</div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">
                  {distance}m from home · Updated live
                </div>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full font-pixel text-[7px]"
              style={{
                background: isInsideGeofence ? "rgba(79,174,148,0.12)" : "rgba(255,107,107,0.12)",
                border: `1.5px solid ${isInsideGeofence ? "rgba(79,174,148,0.4)" : "rgba(255,107,107,0.4)"}`,
                color: isInsideGeofence ? "var(--mint-dk)" : "var(--coral)",
              }}
            >
              {isInsideGeofence ? "● SAFE ZONE" : "⚠ OUTSIDE"}
            </div>
          </div>

          {/* Distance bar */}
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "var(--cream2)" }}>
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min((distance / GEOFENCE_RADIUS) * 100, 100)}%`,
                background: isInsideGeofence
                  ? "linear-gradient(90deg, var(--mint), var(--mint-dk))"
                  : "linear-gradient(90deg, var(--coral), #FF4444)",
              }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">HOME</span>
            <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{GEOFENCE_RADIUS}M LIMIT</span>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "DISTANCE", value: `${distance}m`, color: "var(--mint-dk)" },
            { label: "STOPS", value: `${trailStops.length}`, color: "var(--yellow)" },
            { label: "TIME OUT", value: "2.4h", color: "var(--pink)" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center py-3 rounded-xl"
              style={{ background: "var(--cream2)" }}
            >
              <div className="text-[16px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="font-pixel text-[6px] text-[var(--cocoa-lt)] mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
