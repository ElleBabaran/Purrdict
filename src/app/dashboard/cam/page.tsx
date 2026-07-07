"use client";
import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/nav/TopBar";
import { useAuth } from "@/lib/AuthContext";

// Push Mode (esp32/PurrDictCam_Push): the ESP32-CAM itself POSTs JPEG
// frames to /api/esp32/snapshot every ~500ms. The dashboard just polls
// that endpoint for the latest frame — no direct browser -> ESP32
// connection required, so this works even when the ESP32 and the
// viewing device can't reach each other directly on the LAN (e.g.
// router AP/client isolation), and it also works once the app is
// deployed to Vercel, since the ESP32 always initiates the connection
// outward to the server.
const POLL_INTERVAL_MS = 800; // ~1.25 FPS refresh — matches ~2 FPS push rate closely enough

export default function CamPage() {
  const { user } = useAuth();
  const catName = user?.cats[0]?.name || "Your Cat";
  const [currentTime, setCurrentTime] = useState("");
  const [snapshotUrl, setSnapshotUrl] = useState("");
  const [status, setStatus] = useState<"connecting" | "connected" | "stale" | "offline">("connecting");
  const [lastFrameAt, setLastFrameAt] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

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

  // Poll the snapshot endpoint for the latest pushed frame
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/esp32/snapshot?_t=${Date.now()}`, { cache: "no-store" });
        if (cancelled) return;

        const ageHeader = res.headers.get("X-Snapshot-Age");
        const noFrameYet = ageHeader === "none";

        if (!res.ok || noFrameYet) {
          setStatus((prev) => (prev === "connected" || prev === "stale" ? "offline" : "connecting"));
          return;
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        setSnapshotUrl((prevUrl) => {
          if (prevUrl) URL.revokeObjectURL(prevUrl);
          return url;
        });
        setLastFrameAt(Date.now());
        setStatus("connected");
      } catch {
        if (!cancelled) setStatus((prev) => (prev === "connected" || prev === "stale" ? "offline" : "connecting"));
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // If the last successful frame is getting old (device likely stopped
  // pushing), flip to "stale" so the UI reflects it without waiting for
  // a failed poll.
  useEffect(() => {
    if (status !== "connected" || lastFrameAt === null) return;
    const timer = setInterval(() => {
      if (Date.now() - lastFrameAt > 5000) setStatus("stale");
    }, 1000);
    return () => clearInterval(timer);
  }, [status, lastFrameAt]);

  function handleSnapshot() {
    if (!snapshotUrl) return;
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 320;
    canvas.height = img.naturalHeight || img.height || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${catName}-snapshot-${Date.now()}.jpg`;
    link.click();
  }

  const isLive = status === "connected" || status === "stale";

  return (
    <>
      <TopBar title="▸ CAT CAM" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Video Feed ── */}
        <div
          className="rounded-2xl overflow-hidden relative w-full"
          style={{
            border: "3px solid var(--cocoa)",
            boxShadow: "5px 5px 0 var(--cocoa)",
            aspectRatio: "4/3",
            minHeight: "420px",
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

          {/* Connecting — waiting for the first frame */}
          {status === "connecting" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
              <div className="w-10 h-10 rounded-full border-2 border-[var(--mint)] border-t-transparent animate-spin" />
              <div className="font-pixel text-[9px] text-[var(--mint)]">WAITING FOR CAMERA…</div>
              <div className="text-[10px] text-white/40 text-center leading-relaxed max-w-[260px] mt-1">
                Make sure the ESP32-CAM (Push Mode firmware) is powered on and pushing frames.
              </div>
            </div>
          )}

          {/* Offline — no recent frame at all */}
          {status === "offline" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 px-6">
              <span className="text-3xl">📷</span>
              <div className="font-pixel text-[8px] text-[#FF6B6B] text-center">CAMERA OFFLINE</div>
              <div className="text-[10px] text-white/40 text-center leading-relaxed max-w-[260px]">
                No frames received in the last 30s. Check that the ESP32-CAM is powered on, connected to WiFi, and pushing to the server.
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="font-pixel text-[7px] px-3 py-2 rounded-lg text-white mt-1"
                style={{ background: "var(--plum)", boxShadow: "2px 2px 0 var(--cocoa)" }}
              >
                HOW IT WORKS
              </button>
            </div>
          )}

          {/* Latest pushed frame */}
          {snapshotUrl && isLive && (
            <img
              ref={imgRef}
              src={snapshotUrl}
              alt="ESP32-CAM Latest Frame"
              className="w-full h-full object-cover"
              style={{ opacity: status === "stale" ? 0.5 : 1, transition: "opacity 0.3s ease-in" }}
            />
          )}

          {/* HUD overlay when live */}
          {isLive && (
            <>
              <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(127,216,190,0.3)" }}>
                  <span className={`w-2 h-2 rounded-full ${status === "connected" ? "bg-[#FF4444] animate-blink" : "bg-[#FFD166]"}`} />
                  <span className="font-pixel text-[7px] text-[#FF6B6B]">
                    {status === "connected" ? "● LIVE" : "○ STALE"}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span className="font-pixel text-[7px] text-white/70">{catName}</span>
                  <span className="font-pixel text-[7px] text-[#FFD166]">🐱</span>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-30 flex items-center justify-between" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}>
                <span className="font-pixel text-[7px] text-white/80">{currentTime}</span>
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[6px] text-white/40">ESP32-CAM · PUSH MODE</span>
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
                  {status === "connected" ? "Live Feed Active" : status === "stale" ? "Feed Stalled" : status === "offline" ? "Camera Offline" : "Connecting…"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettings(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm hover:bg-[var(--cream2)] transition-colors"
                aria-label="Camera info"
              >
                ⚙️
              </button>
              <div
                className="px-3 py-1.5 rounded-full font-pixel text-[7px]"
                style={{
                  background: status === "connected" ? "rgba(79,174,148,0.12)" : status === "offline" ? "rgba(255,107,107,0.12)" : "rgba(255,209,102,0.12)",
                  border: `1.5px solid ${status === "connected" ? "rgba(79,174,148,0.4)" : status === "offline" ? "rgba(255,107,107,0.4)" : "rgba(255,209,102,0.4)"}`,
                  color: status === "connected" ? "var(--mint-dk)" : status === "offline" ? "#FF6B6B" : "var(--yellow)",
                }}
              >
                {status === "connected" ? "● CONNECTED" : status === "stale" ? "○ STALLED" : status === "offline" ? "● OFFLINE" : "○ WAITING"}
              </div>
            </div>
          </div>
        </div>

        {/* ── Quick Actions ── */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { emoji: "📸", label: "Snap", action: handleSnapshot, disabled: !isLive },
            { emoji: "ℹ️", label: "How it works", action: () => setShowSettings(true), disabled: false },
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

        {/* ── Setup Help (only if offline/connecting) ── */}
        {!isLive && (
          <div className="glass-card p-4 space-y-3">
            <div className="font-pixel text-[8px] text-[var(--pink-dk)]">📋 HOW PUSH MODE WORKS</div>
            <div className="space-y-2 text-[11px] text-[var(--cocoa-lt)] leading-relaxed">
              <p><strong>1.</strong> Flash the ESP32-CAM with <code>esp32/PurrDictCam_Push/PurrDictCam_Push.ino</code>.</p>
              <p><strong>2.</strong> Set <code>SNAPSHOT_URL</code> in the sketch to this server&apos;s <code>/api/esp32/snapshot</code> endpoint (works for both local dev and a deployed Vercel URL).</p>
              <p><strong>3.</strong> The ESP32 pushes a JPEG frame outward every ~500ms — no need for the browser to reach the ESP32 directly, so this works even across networks or behind router AP isolation.</p>
              <p><strong>4.</strong> This page polls for the latest frame automatically once the device starts pushing.</p>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ INFO MODAL ══════════ */}
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
                <div className="text-lg font-bold text-[var(--cocoa)]">Push Mode</div>
              </div>
              <button onClick={() => setShowSettings(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:bg-[var(--cream2)]">✕</button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="text-[12px] text-[var(--cocoa-lt)] leading-relaxed space-y-2">
                <p>Unlike the older MJPEG-stream mode, Push Mode doesn&apos;t require your browser to reach the ESP32-CAM directly. Instead, the ESP32 itself sends frames <em>out</em> to this server:</p>
                <code className="block px-3 py-2 rounded-lg text-[10px] font-mono" style={{ background: "var(--cream2)" }}>
                  POST /api/esp32/snapshot
                </code>
                <p>This means it works even when the camera and the viewing device can&apos;t talk to each other on the local network (e.g. router client isolation), and it also works once this app is deployed — the ESP32 just needs outbound internet access to reach the server URL.</p>
              </div>

              <div className="p-3 rounded-lg text-[10px]" style={{ background: "rgba(0,0,0,0.05)" }}>
                <p className="font-medium mb-1">Current Status:</p>
                <p>• Status: <span className={status === "connected" ? "text-green-600" : status === "offline" ? "text-red-600" : "text-yellow-600"}>{status.toUpperCase()}</span></p>
                <p>• Last frame: {lastFrameAt ? `${Math.round((Date.now() - lastFrameAt) / 1000)}s ago` : "None yet"}</p>
                <p className="mt-2 text-[9px]">If no frame ever arrives, check the ESP32&apos;s Serial Monitor for <code>[OK] Frame sent</code> lines and confirm SNAPSHOT_URL points at this server.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
