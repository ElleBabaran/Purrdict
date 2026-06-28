"use client";
import CatRoom from "@/components/CatRoom";

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

          {/* Cat's World preview */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              border: "3px solid var(--cocoa)",
              boxShadow: "5px 5px 0 var(--cocoa)",
            }}
          >
            <CatRoom activity="walking" catName="Mochi" timeOfDay="day" />
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
