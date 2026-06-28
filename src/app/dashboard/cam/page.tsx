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
                    {/* Pixel art room scene background */}
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Night sky gradient */}
                      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0E0820 0%, #1A1040 30%, #2A1850 60%, #1E1235 100%)" }} />

                      {/* Stars */}
                      <div className="absolute top-[12%] left-[20%] w-1 h-1 bg-white/60 animate-twinkle" />
                      <div className="absolute top-[8%] left-[55%] w-1.5 h-1.5 bg-white/40 animate-twinkle" style={{ animationDelay: "1s" }} />
                      <div className="absolute top-[15%] left-[75%] w-1 h-1 bg-white/50 animate-twinkle" style={{ animationDelay: "2s" }} />
                      <div className="absolute top-[20%] left-[40%] w-0.5 h-0.5 bg-white/30 animate-twinkle" style={{ animationDelay: "0.5s" }} />
                      <div className="absolute top-[6%] left-[85%] w-1 h-1 bg-white/40 animate-twinkle" style={{ animationDelay: "1.5s" }} />

                      {/* Moon */}
                      <div
                        className="absolute top-[8%] left-[15%] w-10 h-10 rounded-full"
                        style={{ background: "radial-gradient(circle, #C8B8E8 0%, #9080B0 60%, #6050A0 100%)", boxShadow: "0 0 20px rgba(200,184,232,0.3)" }}
                      />

                      {/* Pixel clouds */}
                      <div className="absolute top-[18%] left-[30%] flex gap-0">
                        {[1,1,1,1,1,1].map((_, i) => (
                          <div key={`c1-${i}`} className="w-2.5 h-2 rounded-sm" style={{ background: "rgba(80,70,120,0.6)" }} />
                        ))}
                      </div>
                      <div className="absolute top-[14%] left-[65%] flex gap-0">
                        {[1,1,1,1].map((_, i) => (
                          <div key={`c2-${i}`} className="w-2 h-1.5 rounded-sm" style={{ background: "rgba(80,70,120,0.4)" }} />
                        ))}
                      </div>

                      {/* Window frame (pixel style) */}
                      <div
                        className="absolute bottom-[25%] left-[10%] right-[10%] top-[35%]"
                        style={{ border: "3px solid #3A3050", background: "rgba(20,15,40,0.3)" }}
                      >
                        {/* Window dividers */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] bg-[#3A3050]" />
                        <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-[#3A3050]" />

                        {/* City skyline silhouette through window */}
                        <div className="absolute bottom-0 left-0 right-0 h-[40%] flex items-end justify-center gap-[1px]">
                          {[18,30,22,35,28,15,40,20,32,25,18,36,22,28,15,20,38,24,30,16,22,35].map((h, i) => (
                            <div
                              key={`bld-${i}`}
                              className="flex-1"
                              style={{
                                height: `${h + 20}%`,
                                background: `linear-gradient(180deg, #2A2050 0%, #1A1030 100%)`,
                                borderTop: "1px solid #3A3060",
                              }}
                            >
                              {/* Building windows */}
                              {h > 25 && (
                                <div className="flex flex-wrap gap-[1px] p-[1px] mt-1">
                                  {Array.from({ length: Math.floor(h / 12) }).map((_, j) => (
                                    <div
                                      key={j}
                                      className="w-[2px] h-[2px]"
                                      style={{ background: Math.random() > 0.5 ? "#FFE4A0" : "transparent", opacity: 0.7 }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Floor / windowsill */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-[25%]"
                        style={{ background: "linear-gradient(180deg, #1A1030 0%, #0E0820 100%)" }}
                      />
                      <div
                        className="absolute bottom-[24%] left-0 right-0 h-[3px]"
                        style={{ background: "#3A3050" }}
                      />

                      {/* Cat silhouette sitting on windowsill */}
                      <div className="absolute bottom-[25%] left-1/2 -translate-x-1/2 z-[6]">
                        <PixelCat size={72} variant="night" />
                      </div>

                      {/* Tail shadow on floor */}
                      <div
                        className="absolute bottom-[18%] left-[52%] w-8 h-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.3)" }}
                      />
                    </div>

                    {/* Scan line animation overlay */}
                    <div
                      className="absolute inset-0 animate-scan z-[8] pointer-events-none"
                      style={{ background: "linear-gradient(transparent 0%, rgba(127,216,190,0.03) 50%, transparent 100%)" }}
                    />

                    {/* Scanlines texture */}
                    <div className="absolute inset-0 z-[9] pointer-events-none" style={{
                      backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0 1px, transparent 1px 3px)",
                    }} />

                    {/* Header overlay */}
                    <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-20">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">📷</span>
                        <span className="font-pixel text-[7px] text-white/70">ESP32 COLLAR CAM</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isRecording && (
                          <div className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />
                            <span className="font-pixel text-[6px] text-[#FF5C5C]">REC</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.5)" }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--coral)] animate-blink" />
                          <span className="font-pixel text-[7px] text-white/80">{currentTime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tech info */}
                    <div className="absolute top-10 left-4 z-20">
                      <span className="font-pixel text-[5px] text-white/30">CH1 · 480p · 30fps</span>
                    </div>

                    {/* Bottom status bar */}
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 py-3 z-20 flex items-center gap-2"
                      style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}
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
