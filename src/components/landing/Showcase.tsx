"use client";
import { useState, useEffect } from "react";
import PixelCat from "@/components/PixelCat";

export default function Showcase() {
  return (
    <>
      {/* ═══════════ SPY CAM SECTION ═══════════ */}
      <section id="showcase" className="py-20 px-6" style={{ background: "var(--cream)" }}>
        <div className="max-w-3xl mx-auto">
          <span className="font-pixel text-[10px] text-[var(--pink-dk)] mb-3.5 inline-block">
            ▸ SPY MODE
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--cocoa)] mb-3.5 leading-tight">
            See the parts of her day{" "}
            <span className="text-[var(--mint-dk)]">you always miss</span>
          </h2>
          <p className="text-base text-[var(--cocoa-lt)] max-w-md mb-10 font-medium">
            Live ESP32 collar cam plus a full map of her favorite haunts — all
            streamed straight to your phone.
          </p>

          {/* Camera feed card */}
          <div
            className="rounded-2xl overflow-hidden mb-5"
            style={{
              background: "var(--plum-xl)",
              border: "2.5px solid var(--cocoa)",
              boxShadow: "5px 5px 0 var(--cocoa)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "var(--plum-lt)", borderBottom: "2px solid rgba(255,255,255,0.06)" }}
            >
              <span className="font-pixel text-[8px] text-[var(--yellow)]">📷 ESP32 COLLAR CAM</span>
              <span className="flex items-center gap-1.5 font-pixel text-[7px] text-[#FF5C5C]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />
                REC
              </span>
            </div>
            <div
              className="relative h-44 md:h-52 overflow-hidden"
              style={{
                background:
                  "repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 3px), linear-gradient(160deg, #2D2438 0%, #0E0B14 100%)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
                }}
              />
              <div
                className="absolute inset-0 animate-scan"
                style={{
                  background: "linear-gradient(transparent 0%, rgba(127,216,190,0.05) 50%, transparent 100%)",
                }}
              />
              <span className="absolute top-2.5 right-2.5 font-pixel text-[7px] text-white/80 bg-black/50 px-2 py-1 rounded flex items-center gap-1.5 z-10">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />
                12:04 PM
              </span>
              <span className="absolute top-2.5 left-2.5 font-pixel text-[6px] text-white/40 z-10">
                CH1 · 480p · 30fps
              </span>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-cam-idle z-[5]">
                <PixelCat size={56} variant="night" />
              </div>
              <div
                className="absolute bottom-0 left-0 right-0 px-3 py-2.5 font-pixel text-[7px] text-[var(--yellow)] z-10 flex items-center gap-2"
                style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
              >
                🐟 Currently: investigating the snack drawer
              </div>
            </div>
          </div>

          {/* Map card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--plum-xl)",
              border: "2.5px solid var(--cocoa)",
              boxShadow: "4px 4px 0 var(--cocoa)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: "var(--plum-lt)", borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}
            >
              <span className="font-pixel text-[8px] text-[var(--yellow)]">🗺️ TODAY&apos;S TRAIL</span>
              <span className="font-pixel text-[7px] text-[var(--mint)]">7 STOPS</span>
            </div>
            <div
              className="relative h-40 md:h-48 overflow-hidden"
              style={{
                background:
                  "linear-gradient(rgba(127,216,190,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(127,216,190,0.06) 1px, transparent 1px), #0E0B14",
                backgroundSize: "16px 16px",
              }}
            >
              {/* room outlines */}
              <div className="absolute rounded-sm" style={{ top: 10, left: 10, width: "40%", height: "42%", border: "1px dashed rgba(255,255,255,0.12)" }}>
                <span className="absolute top-1 left-1.5 font-pixel text-[5px] text-white/25">BEDROOM</span>
              </div>
              <div className="absolute rounded-sm" style={{ top: 10, right: 10, width: "35%", height: "58%", border: "1px dashed rgba(255,255,255,0.12)" }}>
                <span className="absolute top-1 left-1.5 font-pixel text-[5px] text-white/25">KITCHEN</span>
              </div>
              <div className="absolute rounded-sm" style={{ bottom: 10, left: 10, width: "55%", height: "36%", border: "1px dashed rgba(255,255,255,0.12)" }}>
                <span className="absolute top-1 left-1.5 font-pixel text-[5px] text-white/25">LIVING RM</span>
              </div>

              {/* dotted path */}
              <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
                <path
                  d="M 50 45 Q 90 70 120 100 Q 160 85 200 75 Q 230 110 260 120"
                  fill="none"
                  stroke="rgba(127,216,190,0.25)"
                  strokeWidth="1.5"
                  strokeDasharray="4 5"
                />
              </svg>

              {/* pins with glow pulse animation */}
              {[
                { emoji: "💤", top: "22%", left: "18%", delay: "0s", glow: "rgba(91,141,239,0.4)" },
                { emoji: "🍽️", top: "32%", left: "65%", delay: "0.5s", glow: "rgba(255,209,102,0.4)" },
                { emoji: "🧶", top: "58%", left: "35%", delay: "1s", glow: "rgba(79,174,148,0.4)" },
                { emoji: "☀️", top: "62%", left: "70%", delay: "1.5s", glow: "rgba(255,209,102,0.5)" },
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute animate-pin-pop"
                  style={{ top: p.top, left: p.left, animationDelay: p.delay, opacity: 0 }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm animate-bob"
                    style={{
                      background: "rgba(255,209,102,0.12)",
                      border: "1.5px solid rgba(255,209,102,0.3)",
                      boxShadow: `0 2px 8px ${p.glow}`,
                      animationDelay: p.delay,
                    }}
                  >
                    {p.emoji}
                  </div>
                </div>
              ))}

              {/* Walking cat with thought bubble */}
              <TrailCat />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SCRAPBOOK SECTION ═══════════ */}
      <section id="scrapbook" className="py-20 px-6" style={{ background: "var(--cream2)" }}>
        <div className="max-w-3xl mx-auto">
          <span className="font-pixel text-[10px] text-[var(--pink-dk)] mb-3.5 inline-block">
            ▸ SCRAPBOOK
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--cocoa)] mb-3.5 leading-tight">
            Every moment, <span className="text-[var(--mint-dk)]">pasted in</span>
          </h2>
          <p className="text-base text-[var(--cocoa-lt)] max-w-md mb-10 font-medium">
            Photos, videos, and little notes — all saved in a digital scrapbook
            you can flip through like a real album.
          </p>

          {/* Book preview */}
          <div
            className="rounded-2xl overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, #F5E6D3 0%, #EDD9C0 50%, #E8D1B5 100%)",
              border: "3px solid var(--cocoa)",
              boxShadow: "6px 6px 0 var(--cocoa), inset 0 0 30px rgba(74,59,50,0.06)",
              minHeight: "320px",
            }}
          >
            {/* spine */}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[3px] z-10 pointer-events-none"
              style={{
                background: "linear-gradient(180deg, rgba(74,59,50,0.25), rgba(74,59,50,0.1), rgba(74,59,50,0.25))",
                boxShadow: "-3px 0 6px rgba(74,59,50,0.06), 3px 0 6px rgba(74,59,50,0.06)",
              }}
            />

            {/* paper texture */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle, var(--cocoa) 0.4px, transparent 0.4px)",
                backgroundSize: "14px 14px",
              }}
            />

            {/* page header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2 relative z-10">
              <span className="font-pixel text-[7px] text-[var(--cocoa-lt)]">📖 MOCHI&apos;S ALBUM</span>
              <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">PAGE 1</span>
            </div>

            {/* two-page spread */}
            <div className="grid grid-cols-2 gap-0 px-3 pb-14 relative z-10">
              {/* left page */}
              <div className="pr-3 flex flex-col gap-3" style={{ borderRight: "1px dashed rgba(74,59,50,0.12)" }}>
                {/* polaroid 1 */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "#fff",
                    border: "2px solid var(--cocoa)",
                    boxShadow: "2px 2px 0 rgba(74,59,50,0.12)",
                    transform: "rotate(-1.5deg)",
                  }}
                >
                  <div className="h-20 flex items-center justify-center" style={{ background: "#FFD16633" }}>
                    <span className="text-3xl">📷</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="text-[11px] font-bold text-[var(--cocoa)] leading-tight">
                      First day with the collar
                    </div>
                    <div className="font-pixel text-[5px] text-[var(--cocoa-lt)] mt-1">Jun 22 · milestone ✨</div>
                  </div>
                </div>

                {/* note sticker */}
                <div
                  className="rounded-lg px-3 py-2.5"
                  style={{
                    background: "rgba(127,216,190,0.15)",
                    border: "1.5px dashed rgba(79,174,148,0.4)",
                    transform: "rotate(0.5deg)",
                  }}
                >
                  <div className="text-[10px] font-bold text-[var(--cocoa)] leading-tight mb-1">
                    📝 Treat puzzle solved in 4 min
                  </div>
                  <div className="text-[9px] text-[var(--cocoa-lt)] leading-snug">
                    She stared at it, batted it twice, treats fell out. Genius.
                  </div>
                </div>
              </div>

              {/* right page */}
              <div className="pl-3 flex flex-col gap-3">
                {/* polaroid 2 */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "#fff",
                    border: "2px solid var(--cocoa)",
                    boxShadow: "2px 2px 0 rgba(74,59,50,0.12)",
                    transform: "rotate(1deg)",
                  }}
                >
                  <div className="h-20 flex items-center justify-center" style={{ background: "#FF8FA333" }}>
                    <span className="text-3xl">🎬</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="text-[11px] font-bold text-[var(--cocoa)] leading-tight">
                      3AM zoomies compilation
                    </div>
                    <div className="font-pixel text-[5px] text-[var(--cocoa-lt)] mt-1">Jun 20 · chaos 🌀</div>
                  </div>
                </div>

                {/* polaroid 3 */}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    background: "#fff",
                    border: "2px solid var(--cocoa)",
                    boxShadow: "2px 2px 0 rgba(74,59,50,0.12)",
                    transform: "rotate(-0.8deg)",
                  }}
                >
                  <div className="h-14 flex items-center justify-center" style={{ background: "#C4B5FD33" }}>
                    <span className="text-2xl">☀️</span>
                  </div>
                  <div className="px-2.5 py-2">
                    <div className="text-[11px] font-bold text-[var(--cocoa)] leading-tight">
                      Sunbathing queen
                    </div>
                    <div className="font-pixel text-[5px] text-[var(--cocoa-lt)] mt-1">Jun 18 · cozy</div>
                  </div>
                </div>
              </div>
            </div>

            {/* page navigation hint */}
            <div
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center py-3 z-20"
              style={{ background: "linear-gradient(transparent, rgba(245,230,211,0.95))" }}
            >
              <div className="flex items-center gap-2">
                <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">◀</span>
                <div className="flex gap-1">
                  <span className="w-4 h-1 rounded-full bg-[var(--pink-dk)]" />
                  <span className="w-1.5 h-1 rounded-full bg-[var(--cocoa-lt)] opacity-30" />
                  <span className="w-1.5 h-1 rounded-full bg-[var(--cocoa-lt)] opacity-30" />
                  <span className="w-1.5 h-1 rounded-full bg-[var(--cocoa-lt)] opacity-30" />
                </div>
                <span className="font-pixel text-[6px] text-[var(--cocoa-lt)]">▶</span>
              </div>
            </div>
          </div>

          {/* feature bullets */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { emoji: "📷", label: "Photos" },
              { emoji: "🎬", label: "Videos" },
              { emoji: "📝", label: "Notes" },
            ].map((f) => (
              <div
                key={f.label}
                className="rounded-xl py-3 text-center"
                style={{
                  background: "#fff",
                  border: "2px solid var(--cocoa)",
                  boxShadow: "3px 3px 0 var(--cocoa)",
                }}
              >
                <div className="text-xl mb-1">{f.emoji}</div>
                <div className="font-pixel text-[7px] text-[var(--cocoa)]">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

const CAT_THOUGHTS = [
  "where's my treat?",
  "that bird looks suspicious...",
  "nap time soon~",
  "I smell food!",
  "pet me hooman",
  "what was that noise?",
  "the red dot... where?",
  "this box is mine now",
  "feeling fancy today",
  "zoomies incoming!",
];

function TrailCat() {
  const [thought, setThought] = useState(CAT_THOUGHTS[0]);
  const [showThought, setShowThought] = useState(true);

  // Cycle thoughts
  useEffect(() => {
    const interval = setInterval(() => {
      setShowThought(false);
      setTimeout(() => {
        setThought(CAT_THOUGHTS[Math.floor(Math.random() * CAT_THOUGHTS.length)]);
        setShowThought(true);
      }, 400);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute bottom-3 left-0 z-20 animate-walk">
      {/* Thought bubble */}
      <div
        className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-300"
        style={{ opacity: showThought ? 1 : 0, transform: showThought ? "translateY(0)" : "translateY(4px)" }}
      >
        <div
          className="relative px-2 py-1 rounded-lg font-pixel text-[5px] text-white/80"
          style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          {thought}
          {/* Bubble tail */}
          <div
            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45"
            style={{ background: "rgba(0,0,0,0.6)", borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.15)" }}
          />
        </div>
      </div>
      {/* Cat */}
      <PixelCat size={36} variant="orange" walking />
    </div>
  );
}
