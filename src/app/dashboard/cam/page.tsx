"use client";
import { useState } from "react";
import TopBar from "@/components/nav/TopBar";
import PixelCat from "@/components/PixelCat";
import GpsMap from "@/components/GpsMap";
import { camEvents } from "@/lib/mockData";
import { useAuth } from "@/lib/AuthContext";

type ConnStatus = "idle" | "connecting" | "connected" | "error";

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [camUrl, setCamUrl] = useState("http://192.168.1.42");
  const [editingUrl, setEditingUrl] = useState(false);
  const [draftUrl, setDraftUrl] = useState(camUrl);
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gpsExpanded, setGpsExpanded] = useState(true);

  function handleConnect() {
    setStatus("connecting");
    setTimeout(() => setStatus("connected"), 1800);
  }

  function handleDisconnect() {
    setStatus("idle");
    setIsRecording(false);
  }

  function handleSaveUrl() {
    setCamUrl(draftUrl);
    setEditingUrl(false);
    setStatus("idle");
  }

  const statusMeta: Record<ConnStatus, { label: string; color: string; dot: string }> = {
    idle:       { label: "NOT CONNECTED", color: "text-white/40",        dot: "bg-white/30" },
    connecting: { label: "CONNECTING…",   color: "text-[var(--yellow)]", dot: "bg-[var(--yellow)] animate-blink" },
    connected:  { label: "LIVE",          color: "text-[var(--mint)]",   dot: "bg-[var(--mint)] animate-blink" },
    error:      { label: "CONN. ERROR",   color: "text-[var(--coral)]",  dot: "bg-[var(--coral)]" },
  };
  const sm = statusMeta[status];

  // Mock GPS data
  const gpsData = {
    lat: "14.5995",
    lng: "120.9842",
    accuracy: "3m",
    lastUpdate: "12s ago",
    speed: "0.2 km/h",
    altitude: "15m",
    battery: "82%",
    zone: "Home — Living Room",
  };

  return (
    <>
      <TopBar title="▸ SPY CAM + GPS" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Live feed card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--plum-xl)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "4px 4px 0 var(--cocoa)",
          }}
        >
          {/* header bar */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-[var(--yellow)]">📷 ESP32 CAM</span>
              <span
                className="font-pixel text-[6px] px-2 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {camUrl}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
              <span className={`font-pixel text-[7px] ${sm.color}`}>{sm.label}</span>
            </div>
          </div>

          {/* feed area */}
          <div className="relative h-56 overflow-hidden bg-[#0E0B14]">
            <div className="absolute inset-0 cam-scanlines z-10" />
            <div className="absolute inset-0 cam-vignette z-10" />

            {status === "connected" ? (
              <>
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 4px), linear-gradient(160deg, #3A3050 0%, #1A1225 100%)",
                  }}
                />
                <div
                  className="absolute inset-0 animate-scan z-[5]"
                  style={{
                    background: "linear-gradient(transparent 0%, rgba(127,216,190,0.05) 50%, transparent 100%)",
                  }}
                />
                <span className="absolute top-3 right-3 font-pixel text-[7px] text-white/80 bg-black/50 px-2 py-1 rounded z-20 flex items-center gap-1.5">
                  {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />}
                  2:41 PM
                </span>
                <span className="absolute top-3 left-3 font-pixel text-[6px] text-white/40 z-20">
                  CH1 · 480p · 30fps
                </span>
                {/* GPS overlay on feed */}
                <div
                  className="absolute bottom-12 left-3 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg"
                  style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(127,216,190,0.3)" }}
                >
                  <span className="text-xs">📍</span>
                  <span className="font-pixel text-[6px] text-[var(--mint)]">{gpsData.zone}</span>
                </div>
                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-cam-idle z-[5]">
                  <PixelCat size={72} variant="night" />
                </div>
                <div
                  className="absolute bottom-0 left-0 right-0 px-3 py-3 z-20 flex items-center gap-2"
                  style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
                >
                  <span className="text-base">🐟</span>
                  <span className="font-pixel text-[7px] text-[var(--yellow)]">
                    Currently: investigating the snack drawer
                  </span>
                </div>
              </>
            ) : status === "connecting" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
                <div
                  className="w-12 h-12 rounded-full border-2 border-t-transparent border-[var(--mint)] animate-spin"
                  style={{ animationDuration: "0.9s" }}
                />
                <span className="font-pixel text-[7px] text-[var(--mint)]">CONNECTING TO ESP32…</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20">
                <span className="text-4xl opacity-40">📡</span>
                <div className="text-center">
                  <div className="font-pixel text-[8px] text-white/50 mb-1">NOT CONNECTED</div>
                  <div className="text-[11px] text-white/30">Tap Connect to view the live feed</div>
                </div>
              </div>
            )}
          </div>

          {/* controls bar */}
          <div
            className="flex items-center justify-between px-4 py-3 gap-2"
            style={{ borderTop: "1.5px solid rgba(255,255,255,0.06)" }}
          >
            {status === "connected" ? (
              <>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg transition-colors"
                  style={{
                    background: isMuted ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isMuted ? "rgba(255,107,107,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  <span className="text-base">{isMuted ? "🔇" : "🔊"}</span>
                  <span className="font-pixel text-[5.5px] text-white/50">{isMuted ? "MUTED" : "AUDIO"}</span>
                </button>

                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg transition-colors"
                  style={{
                    background: isRecording ? "rgba(255,92,92,0.2)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isRecording ? "rgba(255,92,92,0.5)" : "rgba(255,255,255,0.08)"}`,
                  }}
                  aria-label={isRecording ? "Stop recording" : "Start recording"}
                >
                  <span className="text-base">{isRecording ? "⏹️" : "⏺️"}</span>
                  <span className={`font-pixel text-[5.5px] ${isRecording ? "text-[#FF5C5C]" : "text-white/50"}`}>
                    {isRecording ? "STOP" : "REC"}
                  </span>
                </button>

                <button
                  className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                  aria-label="Take snapshot"
                >
                  <span className="text-base">📸</span>
                  <span className="font-pixel text-[5.5px] text-white/50">SNAP</span>
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg transition-colors"
                  style={{
                    background: showSettings ? "rgba(196,181,253,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${showSettings ? "rgba(196,181,253,0.4)" : "rgba(255,255,255,0.08)"}`,
                  }}
                  aria-label="Camera settings"
                >
                  <span className="text-base">⚙️</span>
                  <span className="font-pixel text-[5.5px] text-white/50">SETUP</span>
                </button>

                <button
                  onClick={handleDisconnect}
                  className="flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg transition-colors"
                  style={{ background: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)" }}
                  aria-label="Disconnect camera"
                >
                  <span className="text-base">🔌</span>
                  <span className="font-pixel text-[5.5px] text-[var(--coral)]">DISC.</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleConnect}
                disabled={status === "connecting"}
                className="flex-1 py-3 rounded-xl font-pixel text-[9px] text-[var(--plum)] transition-all pixel-press"
                style={{
                  background: status === "connecting"
                    ? "var(--cocoa-lt)"
                    : "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
                  boxShadow: status === "connecting" ? "none" : "3px 3px 0 var(--cocoa)",
                }}
              >
                {status === "connecting" ? "CONNECTING…" : "▶ CONNECT TO ESP32"}
              </button>
            )}
          </div>
        </div>

        {/* ── GPS TRACKER CARD ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--plum-xl)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "4px 4px 0 var(--cocoa)",
          }}
        >
          {/* gps header */}
          <button
            onClick={() => setGpsExpanded(!gpsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3"
            style={{ borderBottom: gpsExpanded ? "1.5px solid rgba(255,255,255,0.06)" : "none" }}
          >
            <div className="flex items-center gap-2">
              <span className="font-pixel text-[8px] text-[var(--yellow)]">📍 GPS TRACKER</span>
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "rgba(79,174,148,0.12)", border: "1px solid rgba(79,174,148,0.25)" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--mint)] animate-blink" />
                <span className="font-pixel text-[6px] text-[var(--mint)]">ACTIVE</span>
              </span>
            </div>
            <span className="font-pixel text-[7px] text-white/40">
              {gpsExpanded ? "▲" : "▼"}
            </span>
          </button>

          {gpsExpanded && (
            <div className="px-4 py-4 space-y-4">
              {/* Real map */}
              <GpsMap
                catName={catName}
                homePosition={[parseFloat(gpsData.lat), parseFloat(gpsData.lng)]}
                geofenceRadius={100}
                trail={[
                  { lat: 14.5992, lng: 120.9839, label: "Nap spot", time: "9:10 AM", emoji: "😴" },
                  { lat: 14.5994, lng: 120.9841, label: "Breakfast", time: "10:00 AM", emoji: "🍽️" },
                  { lat: 14.5996, lng: 120.9843, label: "Play time", time: "11:20 AM", emoji: "🧶" },
                  { lat: 14.5995, lng: 120.9845, label: "Sunbath", time: "1:15 PM", emoji: "☀️" },
                  { lat: 14.5995, lng: 120.9842, label: "Now", time: "2:41 PM", emoji: "🐱" },
                ]}
                currentPosition={[parseFloat(gpsData.lat), parseFloat(gpsData.lng)]}
              />

              {/* GPS stats grid */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "LOCATION", value: gpsData.zone, icon: "📍", color: "var(--mint)" },
                  { label: "ACCURACY", value: gpsData.accuracy, icon: "🎯", color: "var(--yellow)" },
                  { label: "SPEED", value: gpsData.speed, icon: "💨", color: "var(--pink)" },
                  { label: "LAST UPDATE", value: gpsData.lastUpdate, icon: "🔄", color: "var(--lavender)" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="px-3 py-2.5 rounded-xl"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">{stat.icon}</span>
                      <span className="font-pixel text-[5.5px] text-white/40">{stat.label}</span>
                    </div>
                    <div className="text-[12px] font-bold" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Battery + altitude */}
              <div className="flex items-center gap-3">
                <div className="flex-1 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs">🔋</span>
                  <span className="font-pixel text-[6px] text-white/40">BATTERY</span>
                  <span className="text-[12px] font-bold text-[var(--mint)] ml-auto">{gpsData.battery}</span>
                </div>
                <div className="flex-1 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs">🏔️</span>
                  <span className="font-pixel text-[6px] text-white/40">ALTITUDE</span>
                  <span className="text-[12px] font-bold text-[var(--yellow)] ml-auto">{gpsData.altitude}</span>
                </div>
              </div>

              {/* Geofence status */}
              <div className="px-3 py-3 rounded-xl flex items-center gap-3" style={{ background: "rgba(79,174,148,0.08)", border: "1.5px solid rgba(79,174,148,0.2)" }}>
                <span className="text-lg">🏠</span>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-[var(--mint)]">Inside geofence</div>
                  <div className="text-[10px] text-white/40">{catName} is within the safe zone. You&apos;ll be alerted if she leaves.</div>
                </div>
                <div className="w-2 h-2 rounded-full bg-[var(--mint)]" style={{ boxShadow: "0 0 6px var(--mint)" }} />
              </div>

              {/* Coordinates */}
              <div className="text-center font-pixel text-[7px] text-white/30">
                {gpsData.lat}° N, {gpsData.lng}° E · Geofence: 100m radius
              </div>
            </div>
          )}
        </div>

        {/* ── ESP32 settings panel ── */}
        {showSettings && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "var(--plum)",
              border: "2px solid var(--plum-lt)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <span className="font-pixel text-[8px] text-[var(--yellow)]">⚙️ ESP32 SETTINGS</span>
            </div>
            <div className="px-4 py-4 space-y-4">
              <div>
                <label className="font-pixel text-[7px] text-white/50 block mb-2">CAMERA STREAM URL</label>
                {editingUrl ? (
                  <div className="flex gap-2">
                    <input
                      className="flex-1 bg-[var(--plum-xl)] text-white text-sm px-3 py-2 rounded-lg border border-white/20 outline-none focus:border-[var(--mint-dk)]"
                      value={draftUrl}
                      onChange={(e) => setDraftUrl(e.target.value)}
                      placeholder="http://192.168.1.42"
                      aria-label="Camera stream URL"
                    />
                    <button onClick={handleSaveUrl} className="px-3 py-2 rounded-lg font-pixel text-[7px] text-[var(--plum)]" style={{ background: "var(--mint-dk)" }}>SAVE</button>
                    <button onClick={() => setEditingUrl(false)} className="px-3 py-2 rounded-lg font-pixel text-[7px] text-white/50" style={{ background: "rgba(255,255,255,0.05)" }}>✕</button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setDraftUrl(camUrl); setEditingUrl(true); }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <span className="text-sm text-white/70 font-mono">{camUrl}</span>
                    <span className="font-pixel text-[7px] text-[var(--mint)]">EDIT</span>
                  </button>
                )}
              </div>
              <div>
                <div className="font-pixel text-[7px] text-white/50 mb-2">QUICK PRESETS</div>
                <div className="grid grid-cols-2 gap-2">
                  {["192.168.1.42", "192.168.1.100", "10.0.0.42", "esp32cam.local"].map((label) => (
                    <button
                      key={label}
                      onClick={() => { setCamUrl(`http://${label}`); setStatus("idle"); }}
                      className="px-3 py-2 rounded-lg text-left text-[11px] text-white/60 font-mono transition-colors"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-3 py-3 rounded-xl text-[11px] text-white/50 leading-relaxed" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                💡 Make sure your ESP32-CAM is on the same Wi-Fi network. Default MJPEG port: <span className="text-white/70">:81/stream</span>.
              </div>
            </div>
          </div>
        )}

        {/* ── Today's highlights ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-3">TODAY&apos;S HIGHLIGHTS</div>
          <div className="space-y-3">
            {camEvents.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{
                    background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-lt) 100%)",
                    border: "2px solid var(--plum-lt)",
                  }}
                >
                  {c.emoji}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-[var(--cocoa)]">{c.caption}</div>
                  <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mt-0.5">{c.time}</div>
                </div>
                <button
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all hover:scale-110"
                  style={{
                    background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
                    boxShadow: "2px 2px 0 var(--cocoa)",
                  }}
                  aria-label="Play clip"
                >
                  ▶
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── Info tip ── */}
        <div
          className="rounded-xl px-4 py-3 text-[11px] text-[var(--cocoa-lt)] leading-relaxed"
          style={{
            background: "linear-gradient(135deg, var(--cream2) 0%, var(--cream) 100%)",
            border: "2px solid var(--cream2)",
          }}
        >
          📍 GPS updates every 10 seconds via the ESP32 collar module. Set up a geofence in settings to get alerts when your cat leaves the safe zone.
        </div>
      </div>
    </>
  );
}
