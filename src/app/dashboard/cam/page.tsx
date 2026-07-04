"use client";
import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/nav/TopBar";
import { useAuth } from "@/lib/AuthContext";
import { camEvents } from "@/lib/mockData";

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [currentTime, setCurrentTime] = useState("");
  const [connecting, setConnecting] = useState(true);
  const [connected, setConnected] = useState(false);
  const [dots, setDots] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clock — updates every 30s
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fake connecting sequence
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);

    const connectTimeout = setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      clearInterval(dotInterval);
    }, 2800);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(connectTimeout);
    };
  }, []);

  // Auto-play video once "connected"
  useEffect(() => {
    if (connected && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [connected]);

  return (
    <>
      <TopBar title="▸ CAT CAM" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Video Feed ── */}
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{
            border: "3px solid var(--cocoa)",
            boxShadow: "5px 5px 0 var(--cocoa)",
            aspectRatio: "16/10",
            background: "#0E0B14",
          }}
        >
          {/* Scan-line overlay for cam effect */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
              mixBlendMode: "multiply",
            }}
          />

          {/* Slight vignette */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* Connecting state */}
          {connecting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--mint)] border-t-transparent animate-spin" />
              <div className="font-pixel text-[9px] text-[var(--mint)]">
                CONNECTING TO ESP32-CAM{dots}
              </div>
              <div className="font-pixel text-[6px] text-white/30 mt-1">
                192.168.1.42:81
              </div>
            </div>
          )}

          {/* Video — pre-loaded from public folder */}
          <video
            ref={videoRef}
            src="/catfeed.mp4"
            className="w-full h-full object-cover"
            style={{
              opacity: connected ? 1 : 0,
              transition: "opacity 0.8s ease-in",
            }}
            autoPlay
            loop
            muted
            playsInline
          />

          {/* HUD overlay */}
          {connected && (
            <>
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(127,216,190,0.3)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#FF4444] animate-blink" />
                  <span className="font-pixel text-[7px] text-[#FF6B6B]">● REC</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="font-pixel text-[7px] text-white/70">{catName}</span>
                  <span className="font-pixel text-[7px] text-[#FFD166]">🐱</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-30 flex items-center justify-between" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                <span className="font-pixel text-[7px] text-white/80">{currentTime}</span>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[6px] text-white/40">ESP32-CAM</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FD8BE]" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Connection Info ── */}
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">📡</span>
              <div>
                <div className="text-[14px] font-bold text-[var(--cocoa)]">
                  {connected ? "Live Feed Active" : "Connecting..."}
                </div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">
                  {currentTime} · ESP32-CAM · 192.168.1.42
                </div>
              </div>
            </div>
            <div
              className="px-3 py-1.5 rounded-full font-pixel text-[7px]"
              style={{
                background: connected ? "rgba(79,174,148,0.12)" : "rgba(255,209,102,0.12)",
                border: `1.5px solid ${connected ? "rgba(79,174,148,0.4)" : "rgba(255,209,102,0.4)"}`,
                color: connected ? "var(--mint-dk)" : "var(--yellow)",
              }}
            >
              {connected ? "● CONNECTED" : "○ PAIRING"}
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { emoji: "📸", label: "Snap" },
            { emoji: "🎥", label: "Record" },
            { emoji: "🔔", label: "Alert" },
            { emoji: "🌙", label: "Night" },
          ].map((action) => (
            <button
              key={action.label}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all pixel-press"
              style={{
                background: "var(--cream2)",
                border: "2px solid var(--cream2)",
              }}
            >
              <span className="text-xl">{action.emoji}</span>
              <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">{action.label.toUpperCase()}</span>
            </button>
          ))}
        </div>

        {/* ── Today's Activity Log ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mb-3">TODAY&apos;S MOMENTS</div>
          <div className="space-y-2.5">
            {camEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: "var(--cream)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: "var(--cream2)", border: "1.5px solid var(--cocoa)" }}
                >
                  {event.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-[var(--cocoa)] truncate">{event.caption}</div>
                  <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Stats Summary ── */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "ACTIVE", value: "2.1h", color: "var(--mint-dk)" },
            { label: "SLEEP", value: "8.4h", color: "var(--lavender)" },
            { label: "MEALS", value: "3x", color: "var(--yellow)" },
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
