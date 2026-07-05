"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/nav/TopBar";
import GpsMap from "@/components/GpsMap";
import { useAuth } from "@/lib/AuthContext";

const HOME_ADDRESS_KEY = "purrdict_home_address";
const HOME_COORDS_KEY = "purrdict_home_coords";
const GEOFENCE_RADIUS = 80; // meters

// Generate a realistic GPS path around a home point
function generateGpsPath(home: [number, number]) {
  const [lat, lng] = home;
  // Small offsets to simulate cat wandering (roughly 50-80m radius)
  const offsets = [
    { dlat: 0, dlng: 0, label: "Home" },
    { dlat: 0.0001, dlng: 0.0002, label: "Front yard" },
    { dlat: 0.0003, dlng: 0.0003, label: "Sidewalk" },
    { dlat: 0.0005, dlng: 0.0004, label: "Neighbor's fence" },
    { dlat: 0.0007, dlng: 0.0003, label: "Under the car" },
    { dlat: 0.0008, dlng: 0.0001, label: "Garden" },
    { dlat: 0.0009, dlng: -0.0002, label: "Tree spot" },
    { dlat: 0.0008, dlng: -0.0004, label: "Wall corner" },
    { dlat: 0.0006, dlng: -0.0005, label: "Alley" },
    { dlat: 0.0004, dlng: -0.0004, label: "Drain pipe" },
    { dlat: 0.0002, dlng: -0.0003, label: "Back gate" },
    { dlat: 0.0001, dlng: -0.0001, label: "Backyard" },
    { dlat: 0, dlng: 0, label: "Home" },
  ];
  return offsets.map((o) => ({
    lat: lat + o.dlat,
    lng: lng + o.dlng,
    label: o.label,
  }));
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
  const [pathIndex, setPathIndex] = useState(0);
  const [status, setStatus] = useState("At home");
  const [distance, setDistance] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

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

  // Simulate GPS movement once home is set
  useEffect(() => {
    if (!homeCoords) return;
    const gpsPath = generateGpsPath(homeCoords);

    const interval = setInterval(() => {
      setPathIndex((prev) => {
        const next = (prev + 1) % gpsPath.length;
        const point = gpsPath[next];
        setCurrentPos([point.lat, point.lng]);
        setStatus(point.label);

        // Calculate distance from home
        const dLat = (point.lat - homeCoords[0]) * 111320;
        const dLng = (point.lng - homeCoords[1]) * 111320 * Math.cos(homeCoords[0] * Math.PI / 180);
        setDistance(Math.round(Math.sqrt(dLat * dLat + dLng * dLng)));

        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
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
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressInput.trim())}&format=json&limit=1&addressdetails=1`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const displayName = data[0].display_name || addressInput.trim();
          
          // Check if it's a real specific address (has house number or road)
          const addr = data[0].address || {};
          const hasSpecificLocation = addr.house_number || addr.road || addr.building || addr.neighbourhood || addr.suburb;
          
          if (!hasSpecificLocation && !addr.city && !addr.town && !addr.village) {
            setAddressError("Address too vague. Please include street name or more details.");
            setSavingAddress(false);
            return;
          }

          setPendingCoords([lat, lng]);
          setResolvedAddress(displayName);
        } else {
          setAddressError("Address not found. Make sure the address exists and try including city/country.");
        }
      } else {
        setAddressError("Geocoding failed. Check your connection.");
      }
    } catch {
      setAddressError("Network error. Try again.");
    }
    setSavingAddress(false);
  }, [addressInput]);

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
                <input
                  type="text"
                  placeholder="e.g. 123 Main St, Quezon City, Philippines"
                  value={addressInput}
                  onChange={(e) => { setAddressInput(e.target.value); setAddressError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchAddress()}
                  className="w-full px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] placeholder:text-[var(--cocoa-lt)] outline-none focus:ring-2 focus:ring-[var(--mint-dk)] mb-3"
                  style={{ background: "var(--cream)", border: "2.5px solid var(--cream2)" }}
                  aria-label="Home address"
                />

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
