"use client";
import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/nav/TopBar";
import { useAuth } from "@/lib/AuthContext";

const STORAGE_KEY = "purrdict_esp32_ip";
const DEFAULT_IP = "192.168.1.10";
const DEFAULT_PORT = "81";

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [currentTime, setCurrentTime] = useState("");
  const [camIp, setCamIp] = useState("");
  const [inputIp, setInputIp] = useState("");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [dots, setDots] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const imgRef = useRef<HTMLImageElement>(null);

  // Load saved IP on mount and auto-connect
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const ip = saved || DEFAULT_IP;
    setCamIp(ip);
    setInputIp(ip);
    // Save default if not already saved
    if (!saved) localStorage.setItem(STORAGE_KEY, DEFAULT_IP);
  }, []);

  // Clock
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

  // Animated dots for connecting state
  useEffect(() => {
    if (status !== "connecting") return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  // Auto-connect when camIp changes
  useEffect(() => {
    if (camIp) {
      connectToCamera(camIp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camIp]);

  function connectToCamera(ip: string) {
    if (!ip.trim()) return;

    setStatus("connecting");
    setErrorMsg("");

    // ESP32-CAM: MJPEG stream is typically at :81/stream (CameraWebServer default)
    // Some firmwares serve it at :80/stream or just /stream
    const cleanIp = ip.replace(/^https?:\/\//, "").replace(/\/+$/, "").replace(/:.*/, "");
    
    // Try port 81 first (default CameraWebServer stream port)
    const url = `http://${cleanIp}:${DEFAULT_PORT}/stream`;
    setStreamUrl(url);

    // Mark as connected after 3s — MJPEG streams via <img> don't always fire onLoad
    // but the browser will render frames as they arrive
    const timeout = setTimeout(() => {
      setStatus("connected");
    }, 3000);

    return () => clearTimeout(timeout);
  }

  function handleSaveIp() {
    const ip = inputIp.trim();
    if (!ip) return;
    localStorage.setItem(STORAGE_KEY, ip);
    setCamIp(ip);
    setShowSettings(false);
  }

  function handleDisconnect() {
    setStreamUrl("");
    setStatus("idle");
    setCamIp("");
    localStorage.removeItem(STORAGE_KEY);
    setShowSettings(true);
  }

  function handleRetry() {
    if (camIp) connectToCamera(camIp);
  }

  // Snapshot — captures current frame from MJPEG stream
  function handleSnapshot() {
    if (!streamUrl) return;
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 640;
    canvas.height = img.naturalHeight || img.height || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${catName}-snapshot-${Date.now()}.jpg`;
    link.click();
  }

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
          {/* Scan-line overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
              mixBlendMode: "multiply",
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* Idle — no IP configured */}
          {status === "idle" && !camIp && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <span className="text-4xl">📷</span>
              <div className="font-pixel text-[9px] text-white/60">NO CAMERA CONFIGURED</div>
              <button
                onClick={() => setShowSettings(true)}
                className="font-pixel text-[8px] px-4 py-2 rounded-lg text-[var(--plum)] mt-2"
                style={{ background: "var(--mint)", boxShadow: "2px 2px 0 var(--cocoa)" }}
              >
                + SETUP CAM
              </button>
            </div>
          )}

          {/* Connecting state */}
          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--mint)] border-t-transparent animate-spin" />
              <div className="font-pixel text-[9px] text-[var(--mint)]">
                CONNECTING TO ESP32-CAM{dots}
              </div>
              <div className="font-pixel text-[6px] text-white/30 mt-1">
                {camIp}:{DEFAULT_PORT}
              </div>
            </div>
          )}

          {/* Error state */}
          {status === "error" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 px-6">
              <span className="text-3xl">⚠️</span>
              <div className="font-pixel text-[8px] text-[#FF6B6B] text-center">CONNECTION FAILED</div>
              <div className="text-[10px] text-white/40 text-center leading-relaxed max-w-[260px]">
                {errorMsg}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleRetry}
                  className="font-pixel text-[7px] px-3 py-2 rounded-lg text-white"
                  style={{ background: "var(--mint-dk)", boxShadow: "2px 2px 0 var(--cocoa)" }}
                >
                  RETRY
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="font-pixel text-[7px] px-3 py-2 rounded-lg text-white"
                  style={{ background: "var(--plum)", boxShadow: "2px 2px 0 var(--cocoa)" }}
                >
                  SETTINGS
                </button>
              </div>
            </div>
          )}

          {/* MJPEG Stream — <img> tag handles multipart JPEG natively */}
          {streamUrl && (
            <img
              ref={imgRef}
              src={streamUrl}
              alt="ESP32-CAM Live Feed"
              className="w-full h-full object-cover"
              style={{
                opacity: status === "connected" ? 1 : 0.5,
                transition: "opacity 0.5s ease-in",
              }}
              onLoad={() => setStatus("connected")}
              onError={() => {
                if (status !== "error") {
                  setStatus("error");
                  setErrorMsg(`Cannot reach ${camIp}. Check that the ESP32-CAM is powered on and connected to the same WiFi network.`);
                }
              }}
            />
          )}

          {/* HUD overlay when connected */}
          {status === "connected" && (
            <>
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(127,216,190,0.3)" }}>
                  <span className="w-2 h-2 rounded-full bg-[#FF4444] animate-blink" />
                  <span className="font-pixel text-[7px] text-[#FF6B6B]">● LIVE</span>
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
                  {status === "connected" ? "Live Feed Active" : status === "connecting" ? "Connecting..." : status === "error" ? "Disconnected" : "No Camera"}
                </div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mt-0.5">
                  {camIp ? `${currentTime} · ESP32-CAM · ${camIp}` : "Tap settings to configure"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-[var(--cream2)] transition-colors"
                aria-label="Camera settings"
              >
                ⚙️
              </button>
              <div
                className="px-3 py-1.5 rounded-full font-pixel text-[7px]"
                style={{
                  background: status === "connected" ? "rgba(79,174,148,0.12)" : status === "error" ? "rgba(255,107,107,0.12)" : "rgba(255,209,102,0.12)",
                  border: `1.5px solid ${status === "connected" ? "rgba(79,174,148,0.4)" : status === "error" ? "rgba(255,107,107,0.4)" : "rgba(255,209,102,0.4)"}`,
                  color: status === "connected" ? "var(--mint-dk)" : status === "error" ? "#FF6B6B" : "var(--yellow)",
                }}
              >
                {status === "connected" ? "● CONNECTED" : status === "error" ? "● ERROR" : status === "connecting" ? "○ PAIRING" : "○ OFFLINE"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { emoji: "📸", label: "Snap", action: handleSnapshot, disabled: status !== "connected" },
            { emoji: "🔄", label: "Retry", action: handleRetry, disabled: !camIp },
            { emoji: "🔔", label: "Alert", action: () => {}, disabled: status !== "connected" },
            { emoji: "⚙️", label: "Setup", action: () => setShowSettings(true), disabled: false },
          ].map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              disabled={action.disabled}
              className="flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all pixel-press disabled:opacity-40"
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

        {/* ── Setup Help (only if no cam configured) ── */}
        {!camIp && (
          <div className="glass-card p-4 space-y-3">
            <div className="font-pixel text-[8px] text-[var(--pink-dk)]">📋 HOW TO CONNECT</div>
            <div className="space-y-2 text-[11px] text-[var(--cocoa-lt)] leading-relaxed">
              <p><strong>1.</strong> Flash your ESP32-CAM with the CameraWebServer sketch from Arduino IDE.</p>
              <p><strong>2.</strong> Connect the ESP32-CAM to your WiFi network.</p>
              <p><strong>3.</strong> Note the IP address shown in the Serial Monitor (e.g., 192.168.1.42).</p>
              <p><strong>4.</strong> Enter that IP in settings. The MJPEG stream connects automatically.</p>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ SETTINGS MODAL ══════════ */}
      {showSettings && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(26,18,37,0.7)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowSettings(false)}
          />
          <div
            className="relative z-10 w-full max-w-lg mx-2 mb-2 rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: "var(--cream)",
              border: "3px solid var(--cocoa)",
              boxShadow: "5px 5px 0 var(--cocoa)",
            }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: "2px solid var(--cream2)" }}>
              <div>
                <div className="font-pixel text-[9px] text-[var(--pink-dk)]">ESP32-CAM</div>
                <div className="text-lg font-bold text-[var(--cocoa)]">Camera Settings</div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-[var(--cream2)]">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-2">ESP32-CAM IP ADDRESS</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="192.168.1.42"
                    value={inputIp}
                    onChange={(e) => setInputIp(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveIp()}
                    className="flex-1 px-4 py-3 rounded-xl text-sm text-[var(--cocoa)] placeholder:text-[var(--cocoa-lt)] outline-none"
                    style={{ background: "var(--cream2)", border: "2px solid var(--cream2)" }}
                    aria-label="ESP32-CAM IP address"
                  />
                  <button
                    onClick={handleSaveIp}
                    className="px-4 py-3 rounded-xl font-pixel text-[8px] text-white pixel-press"
                    style={{ background: "linear-gradient(135deg, var(--mint-dk), var(--mint))", border: "2px solid var(--cocoa)", boxShadow: "2px 2px 0 var(--cocoa)" }}
                  >
                    CONNECT
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed space-y-1.5">
                <p>Enter the IP address of your ESP32-CAM. The stream connects to:</p>
                <code className="block px-3 py-2 rounded-lg text-[10px] font-mono" style={{ background: "var(--cream2)" }}>
                  http://{inputIp || "192.168.1.10"}:{DEFAULT_PORT}/stream
                </code>
              </div>

              {camIp && (
                <button
                  onClick={handleDisconnect}
                  className="w-full py-3 rounded-xl font-pixel text-[8px] text-[#FF6B6B] transition-all"
                  style={{ background: "rgba(255,107,107,0.08)", border: "1.5px solid rgba(255,107,107,0.3)" }}
                >
                  🔌 DISCONNECT CAMERA
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
