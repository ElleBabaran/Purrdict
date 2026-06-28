"use client";
import { useState, useEffect } from "react";
import TopBar from "@/components/nav/TopBar";
import PixelCat from "@/components/PixelCat";
import { useAuth } from "@/lib/AuthContext";
import { camEvents, mapPins } from "@/lib/mockData";

type ConnStatus = "idle" | "connecting" | "connected" | "error";
type ViewMode = "room" | "cam";

// Room zones for the floor plan
const ROOMS = [
  { id: "bedroom", label: "Bedroom", x: 5, y: 5, w: 40, h: 40 },
  { id: "kitchen", label: "Kitchen", x: 55, y: 5, w: 40, h: 40 },
  { id: "living", label: "Living Room", x: 5, y: 55, w: 90, h: 40 },
];

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [status, setStatus] = useState<ConnStatus>("idle");
  const [viewMode, setViewMode] = useState<ViewMode>("room");
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const [catPosition, setCatPosition] = useState({ x: 25, y: 82 });
  const [mood, setMood] = useState("Calm");
  const [activeStops, setActiveStops] = useState(mapPins.length);

  // Live clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Simulate cat movement
  useEffect(() => {
    const interval = setInterval(() => {
      setCatPosition(prev => ({
        x: Math.max(10, Math.min(85, prev.x + (Math.random() - 0.5) * 6)),
        y: Math.max(10, Math.min(88, prev.y + (Math.random() - 0.5) * 6)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleConnect() {
    setStatus("connecting");
    setTimeout(() => setStatus("connected"), 1800);
  }

  function handleDisconnect() {
    setStatus("idle");
    setIsRecording(false);
  }

  return (
    <>
      <TopBar title="▸ SPY MODE" />
      <div className="px-4 py-5 space-y-4">

        {/* ── View Toggle ── */}
        <div className="flex items-center gap-2 p-1 rounded-xl" style={{ background: "var(--cream2)" }}>
          <button
            onClick={() => setViewMode("room")}
            className={`flex-1 py-2.5 rounded-lg font-pixel text-[8px] transition-all ${
              viewMode === "room" ? "text-white" : "text-[var(--cocoa-lt)]"
            }`}
            style={{
              background: viewMode === "room" ? "linear-gradient(135deg, var(--plum), var(--plum-xl))" : "transparent",
              boxShadow: viewMode === "room" ? "2px 2px 0 var(--cocoa)" : "none",
            }}
          >
            🏠 ROOM MAP
          </button>
          <button
            onClick={() => setViewMode("cam")}
            className={`flex-1 py-2.5 rounded-lg font-pixel text-[8px] transition-all ${
              viewMode === "cam" ? "text-white" : "text-[var(--cocoa-lt)]"
            }`}
            style={{
              background: viewMode === "cam" ? "linear-gradient(135deg, var(--plum), var(--plum-xl))" : "transparent",
              boxShadow: viewMode === "cam" ? "2px 2px 0 var(--cocoa)" : "none",
            }}
          >
            📷 LIVE CAM
          </button>
        </div>

        {/* ── ROOM MAP VIEW ── */}
        {viewMode === "room" && (
          <div className="space-y-4 animate-fade-up">
            {/* Room floor plan */}
            <div
              className="rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(160deg, #1E1833 0%, #0E0B14 100%)",
                border: "2.5px solid var(--plum-lt)",
                boxShadow: "5px 5px 0 var(--cocoa)",
                aspectRatio: "4/3",
              }}
            >
              {/* Grid background */}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: "linear-gradient(rgba(127,216,190,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(127,216,190,0.5) 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Header */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-blink" />
                  <span className="font-pixel text-[8px] text-[var(--mint)]">LIVE TRACKING</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,92,92,0.3)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)] animate-blink" />
                  <span className="font-pixel text-[7px] text-white/80">{currentTime}</span>
                </div>
              </div>

              {/* Room outlines */}
              {ROOMS.map((room) => (
                <div
                  key={room.id}
                  className="absolute"
                  style={{
                    left: `${room.x}%`,
                    top: `${room.y}%`,
                    width: `${room.w}%`,
                    height: `${room.h}%`,
                  }}
                >
                  <div
                    className="w-full h-full rounded-lg"
                    style={{
                      border: "1.5px dashed rgba(127,216,190,0.15)",
                      background: "rgba(127,216,190,0.02)",
                    }}
                  />
                  <span className="absolute top-2 left-2.5 font-pixel text-[6px] text-white/20 uppercase">
                    {room.label}
                  </span>
                </div>
              ))}

              {/* Trail line (dashed path connecting stops) */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none">
                <polyline
                  points={mapPins.map(p => `${p.xPct}%,${p.yPct}%`).join(" ")}
                  fill="none"
                  stroke="rgba(255,209,102,0.3)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  strokeLinecap="round"
                />
                {/* Trail to cat current position */}
                {mapPins.length > 0 && (
                  <line
                    x1={`${mapPins[mapPins.length - 1].xPct}%`}
                    y1={`${mapPins[mapPins.length - 1].yPct}%`}
                    x2={`${catPosition.x}%`}
                    y2={`${catPosition.y}%`}
                    stroke="rgba(255,143,163,0.4)"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {/* Activity stops */}
              {mapPins.map((pin, i) => (
                <div
                  key={pin.id}
                  className="absolute z-10 animate-pin-pop flex flex-col items-center"
                  style={{
                    left: `${pin.xPct}%`,
                    top: `${pin.yPct}%`,
                    transform: "translate(-50%, -50%)",
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
                    style={{
                      background: "rgba(74,59,50,0.85)",
                      border: "2px solid rgba(74,59,50,0.95)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                    }}
                  >
                    {pin.emoji}
                  </div>
                  <span className="font-pixel text-[5px] text-white/40 mt-1 whitespace-nowrap">{pin.label}</span>
                </div>
              ))}

              {/* Cat current position */}
              <div
                className="absolute z-20 transition-all duration-[3000ms] ease-in-out"
                style={{
                  left: `${catPosition.x}%`,
                  top: `${catPosition.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="relative">
                  <div className="animate-bob">
                    <PixelCat size={44} variant="orange" bounce />
                  </div>
                  {/* Pulse ring around cat */}
                  <div
                    className="absolute inset-0 -m-2 rounded-full animate-pulse-ring"
                    style={{ border: "2px solid rgba(255,143,163,0.4)" }}
                  />
                </div>
              </div>
            </div>

            {/* Stats bar */}
            <div
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🐾</span>
                <span className="text-[12px] font-medium text-[var(--cocoa)]">
                  {activeStops} stops today · 2.1 hrs active
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--yellow)]" />
                <span className="font-pixel text-[8px] text-[var(--cocoa)]">{mood.toUpperCase()}</span>
              </div>
            </div>

            {/* Activity timeline (horizontal scroll) */}
            <div>
              <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-2.5 px-1">TODAY&apos;S JOURNEY</div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {mapPins.map((pin) => (
                  <div
                    key={pin.id}
                    className="flex-shrink-0 w-28 rounded-xl p-3"
                    style={{
                      background: "linear-gradient(145deg, var(--cream), var(--cream2))",
                      border: "2px solid var(--cream2)",
                    }}
                  >
                    <div className="text-2xl mb-1.5">{pin.emoji}</div>
                    <div className="text-[11px] font-bold text-[var(--cocoa)] leading-tight">{pin.label}</div>
                    <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-1">{pin.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LIVE CAM VIEW ── */}
        {viewMode === "cam" && (
          <div className="space-y-4 animate-fade-up">
            {/* Camera feed */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "linear-gradient(160deg, #1E1833 0%, #0E0B14 100%)",
                border: "2.5px solid var(--plum-lt)",
                boxShadow: "5px 5px 0 var(--cocoa)",
              }}
            >
              {/* Feed area */}
              <div className="relative aspect-video overflow-hidden">
                {/* Scanline overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none" style={{
                  backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px)",
                }} />

                {status === "connected" ? (
                  <>
                    {/* Simulated feed bg */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: "repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 4px), linear-gradient(160deg, #2A2040 0%, #0E0B14 100%)",
                      }}
                    />
                    {/* Scan line animation */}
                    <div
                      className="absolute inset-0 animate-scan z-[5]"
                      style={{ background: "linear-gradient(transparent 0%, rgba(127,216,190,0.04) 50%, transparent 100%)" }}
                    />

                    {/* Header overlay */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
                      <span className="font-pixel text-[6px] text-white/40">CH1 · 480p · 30fps</span>
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                        {isRecording && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />}
                        <span className="font-pixel text-[7px] text-white/80">{currentTime}</span>
                      </div>
                    </div>

                    {/* Cat in center */}
                    <div className="absolute inset-0 flex items-center justify-center z-[5]">
                      <div className="animate-cam-idle">
                        <PixelCat size={80} variant="night" />
                      </div>
                    </div>

                    {/* Bottom bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 py-3 z-20 flex items-center gap-2"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
                    >
                      <span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-blink" />
                      <span className="font-pixel text-[7px] text-[var(--yellow)]">
                        Currently: {camEvents[0]?.caption || "hanging out"}
                      </span>
                    </div>
                  </>
                ) : status === "connecting" ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-[#0E0B14]">
                    <div className="w-12 h-12 rounded-full border-2 border-t-transparent border-[var(--mint)] animate-spin" style={{ animationDuration: "0.9s" }} />
                    <span className="font-pixel text-[8px] text-[var(--mint)]">CONNECTING…</span>
                    <span className="text-[11px] text-white/30">Looking for ESP32 on your network</span>
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20 bg-[#0E0B14]">
                    <div className="relative">
                      <PixelCat size={64} variant="orange" />
                      <div className="absolute -bottom-1 -right-1 text-xl">💤</div>
                    </div>
                    <div className="text-center">
                      <div className="font-pixel text-[9px] text-white/50 mb-1">CAMERA OFFLINE</div>
                      <div className="text-[12px] text-white/30">Connect to see {catName} live</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div
                className="flex items-center justify-center gap-3 px-4 py-3"
                style={{ borderTop: "1.5px solid rgba(255,255,255,0.06)" }}
              >
                {status === "connected" ? (
                  <>
                    <CamButton icon="📸" label="SNAP" onClick={() => {}} />
                    <CamButton
                      icon={isRecording ? "⏹️" : "⏺️"}
                      label={isRecording ? "STOP" : "REC"}
                      active={isRecording}
                      danger={isRecording}
                      onClick={() => setIsRecording(!isRecording)}
                    />
                    <CamButton icon="🔌" label="END" danger onClick={handleDisconnect} />
                  </>
                ) : (
                  <button
                    onClick={handleConnect}
                    disabled={status === "connecting"}
                    className="flex-1 py-3.5 rounded-xl font-pixel text-[9px] text-[var(--plum)] transition-all pixel-press max-w-xs"
                    style={{
                      background: status === "connecting"
                        ? "var(--cocoa-lt)"
                        : "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
                      boxShadow: status === "connecting" ? "none" : "3px 3px 0 var(--cocoa)",
                    }}
                  >
                    {status === "connecting" ? "CONNECTING…" : "▶ CONNECT CAM"}
                  </button>
                )}
              </div>
            </div>

            {/* Activity feed */}
            <div className="glass-card p-4">
              <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-3">CAUGHT ON CAMERA</div>
              <div className="space-y-2.5">
                {camEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
                    style={{ background: "var(--cream)" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "var(--cream2)", border: "1.5px solid var(--cocoa)" }}
                    >
                      {event.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-bold text-[var(--cocoa)] truncate">{event.caption}</div>
                      <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">{event.time}</div>
                    </div>
                    <button
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 transition-transform hover:scale-110"
                      style={{
                        background: "linear-gradient(135deg, var(--pink), var(--pink-dk))",
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

            {/* Quick tip */}
            <div
              className="rounded-xl px-4 py-3 flex items-start gap-2.5"
              style={{ background: "var(--cream2)", border: "1.5px solid var(--cream2)" }}
            >
              <span className="text-base flex-shrink-0 mt-0.5">💡</span>
              <span className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed">
                Make sure your ESP32-CAM is on the same Wi-Fi network. The collar streams at 480p for best battery life.
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* Small cam control button */
function CamButton({
  icon,
  label,
  onClick,
  active = false,
  danger = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl transition-all"
      style={{
        background: active
          ? danger ? "rgba(255,92,92,0.15)" : "rgba(79,174,148,0.15)"
          : "rgba(255,255,255,0.05)",
        border: `1.5px solid ${
          active
            ? danger ? "rgba(255,92,92,0.4)" : "rgba(79,174,148,0.4)"
            : "rgba(255,255,255,0.08)"
        }`,
      }}
    >
      <span className="text-lg">{icon}</span>
      <span className={`font-pixel text-[6px] ${danger ? "text-[var(--coral)]" : "text-white/50"}`}>{label}</span>
    </button>
  );
}
