"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/nav/TopBar";
import GpsMap from "@/components/GpsMap";
import { useAuth } from "@/lib/AuthContext";

// Simulated GPS path — cat wandering around a neighborhood
// These coordinates form a realistic walking path near a home
// Center: 14.5995, 120.9842 (Manila area — change to your actual location if you want)
const HOME: [number, number] = [14.5995, 120.9842];
const GEOFENCE_RADIUS = 80; // meters

const GPS_PATH: { lat: number; lng: number; label: string }[] = [
  { lat: 14.5995, lng: 120.9842, label: "Home" },
  { lat: 14.5996, lng: 120.9844, label: "Front yard" },
  { lat: 14.5998, lng: 120.9845, label: "Sidewalk" },
  { lat: 14.6000, lng: 120.9846, label: "Neighbor's fence" },
  { lat: 14.6002, lng: 120.9845, label: "Under the car" },
  { lat: 14.6003, lng: 120.9843, label: "Garden" },
  { lat: 14.6004, lng: 120.9840, label: "Tree spot" },
  { lat: 14.6003, lng: 120.9838, label: "Wall corner" },
  { lat: 14.6001, lng: 120.9837, label: "Alley" },
  { lat: 14.5999, lng: 120.9838, label: "Drain pipe" },
  { lat: 14.5997, lng: 120.9839, label: "Back gate" },
  { lat: 14.5996, lng: 120.9841, label: "Backyard" },
  { lat: 14.5995, lng: 120.9842, label: "Home" },
];

// Trail stops — these are the static markers showing where the cat rested
const TRAIL_STOPS = [
  { lat: 14.6000, lng: 120.9846, label: "Sunbathing", time: "9:15 AM", emoji: "☀️" },
  { lat: 14.6003, lng: 120.9843, label: "Bird watching", time: "10:02 AM", emoji: "🐦" },
  { lat: 14.6004, lng: 120.9840, label: "Nap under tree", time: "11:30 AM", emoji: "😴" },
  { lat: 14.5999, lng: 120.9838, label: "Hunting lizard", time: "1:45 PM", emoji: "🦎" },
  { lat: 14.5996, lng: 120.9841, label: "Grooming", time: "2:20 PM", emoji: "✨" },
];

export default function MapPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Mochi";

  const [currentPos, setCurrentPos] = useState<[number, number]>(HOME);
  const [pathIndex, setPathIndex] = useState(0);
  const [status, setStatus] = useState("At home");
  const [distance, setDistance] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

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

  // Simulate GPS movement — cat moves every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPathIndex((prev) => {
        const next = (prev + 1) % GPS_PATH.length;
        const point = GPS_PATH[next];
        setCurrentPos([point.lat, point.lng]);
        setStatus(point.label);

        // Calculate distance from home (rough meters)
        const dLat = (point.lat - HOME[0]) * 111320;
        const dLng = (point.lng - HOME[1]) * 111320 * Math.cos(HOME[0] * Math.PI / 180);
        setDistance(Math.round(Math.sqrt(dLat * dLat + dLng * dLng)));

        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const isInsideGeofence = distance <= GEOFENCE_RADIUS;

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
            homePosition={HOME}
            geofenceRadius={GEOFENCE_RADIUS}
            trail={TRAIL_STOPS}
            currentPosition={currentPos}
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

        {/* ── Today's Stops ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-3">TODAY&apos;S STOPS</div>
          <div className="space-y-2">
            {TRAIL_STOPS.map((stop, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--cream)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--cream2)", border: "1.5px solid var(--cocoa)" }}
                >
                  {stop.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-[var(--cocoa)] truncate">{stop.label}</div>
                  <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">{stop.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "DISTANCE", value: `${distance}m`, color: "var(--mint-dk)" },
            { label: "STOPS", value: `${TRAIL_STOPS.length}`, color: "var(--yellow)" },
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
