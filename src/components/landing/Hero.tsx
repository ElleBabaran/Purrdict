"use client";
import Link from "next/link";
import PixelCat from "@/components/PixelCat";

export default function Hero() {
  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 pt-32 pb-14 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 20%, rgba(255,209,102,0.3) 0%, transparent 35%), radial-gradient(circle at 85% 75%, rgba(127,216,190,0.25) 0%, transparent 40%), radial-gradient(circle at 50% 90%, rgba(255,143,163,0.15) 0%, transparent 30%), var(--cream)",
      }}
    >
      {/* floating decorations */}
      <span className="absolute text-2xl animate-twinkle" style={{ top: "18%", left: "8%" }}>⭐</span>
      <span className="absolute text-2xl animate-twinkle" style={{ top: "30%", right: "12%", animationDelay: "1s" }}>✨</span>
      <span className="absolute text-2xl animate-twinkle" style={{ bottom: "25%", left: "14%", animationDelay: "1.6s" }}>🧶</span>
      <span className="absolute text-2xl animate-twinkle" style={{ top: "12%", right: "30%", animationDelay: "0.6s" }}>💫</span>
      <span className="absolute text-lg animate-twinkle" style={{ bottom: "15%", right: "8%", animationDelay: "2.2s" }}>🐾</span>

      <div className="max-w-5xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        {/* left: copy */}
        <div>
          <div
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 mb-6 animate-bob"
            style={{
              background: "linear-gradient(135deg, var(--yellow) 0%, #FFBE33 100%)",
              border: "2.5px solid var(--cocoa)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
          >
            <span className="font-pixel text-[9px] text-[var(--cocoa)]">🎮 LEVEL UP YOUR CAT CARE</span>
          </div>
          <h1 className="font-bold text-4xl md:text-5xl leading-tight mb-5 text-[var(--cocoa)]">
            What did your cat
            <br />
            even{" "}
            <span
              className="text-[var(--pink-dk)] relative inline-block"
              style={{
                textDecoration: "underline",
                textDecorationStyle: "wavy",
                textDecorationColor: "var(--yellow)",
                textDecorationThickness: "3px",
                textUnderlineOffset: "4px",
              }}
            >
              get up to
            </span>
            <br />
            today?
          </h1>
          <p className="text-base text-[var(--cocoa-lt)] leading-relaxed max-w-md mb-8 font-medium">
            Purrdict gives your cat an ESP32 smart collar — accelerometer, GPS, and
            camera — then uses methods from 17 peer-reviewed veterinary papers to
            classify behavior, detect emotions, and track location.
          </p>
          <div className="flex gap-3.5 flex-wrap">
            <Link
              href="/dashboard"
              className="pixel-press font-pixel text-[11px] px-6 py-4 rounded-xl text-white inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: "linear-gradient(135deg, var(--pink) 0%, var(--pink-dk) 100%)",
                border: "2.5px solid var(--cocoa)",
                boxShadow: "4px 4px 0 var(--cocoa)",
              }}
            >
              🐱 START SPYING
            </Link>
            <a
              href="#levels"
              className="pixel-press font-pixel text-[11px] px-6 py-4 rounded-xl text-[var(--cocoa)] inline-flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{
                background: "white",
                border: "2.5px solid var(--cocoa)",
                boxShadow: "4px 4px 0 var(--cocoa)",
              }}
            >
              ▶ SEE HOW
            </a>
          </div>
        </div>

        {/* right: hero scene — redesigned */}
        <div
          className="relative h-[380px] rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(180deg, #1A1225 0%, #2D2438 60%, #3A3050 100%)",
            border: "3px solid var(--cocoa)",
            boxShadow: "6px 6px 0 var(--cocoa)",
          }}
        >
          {/* grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(127,216,190,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(127,216,190,0.06) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          {/* live badge */}
          <div
            className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 rounded-full z-20"
            style={{
              background: "rgba(45,36,56,0.9)",
              border: "1.5px solid rgba(127,216,190,0.3)",
              backdropFilter: "blur(6px)",
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--mint)] animate-blink" />
            <span className="font-pixel text-[7px] text-[var(--mint)]">LIVE TRACKING</span>
          </div>

          {/* time stamp */}
          <div
            className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg z-20"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C5C] animate-blink" />
            <span className="font-pixel text-[7px] text-white/80">2:41 PM</span>
          </div>

          {/* room labels */}
          <div className="absolute top-14 left-6 font-pixel text-[6px] text-white/20 tracking-wider z-10">BEDROOM</div>
          <div className="absolute top-14 right-8 font-pixel text-[6px] text-white/20 tracking-wider z-10">KITCHEN</div>
          <div className="absolute bottom-28 left-6 font-pixel text-[6px] text-white/20 tracking-wider z-10">LIVING RM</div>

          {/* activity pins with labels */}
          {[
            { emoji: "💤", label: "Nap spot", left: "15%", top: "30%", delay: "0.8s" },
            { emoji: "🍽️", label: "Fed here",  left: "72%", top: "35%", delay: "1.6s" },
            { emoji: "🧶", label: "Play time", left: "42%", top: "55%", delay: "2.4s" },
            { emoji: "☀️", label: "Sunbath",   left: "78%", top: "62%", delay: "3.2s" },
          ].map((p, i) => (
            <div
              key={i}
              className="absolute flex flex-col items-center gap-1 animate-pin-pop z-10"
              style={{
                left: p.left,
                top: p.top,
                animationDelay: p.delay,
                opacity: 0,
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{
                  background: "rgba(255,209,102,0.15)",
                  border: "1.5px solid rgba(255,209,102,0.3)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {p.emoji}
              </div>
              <span className="font-pixel text-[5px] text-white/40">{p.label}</span>
            </div>
          ))}

          {/* dotted path between points */}
          <svg className="absolute inset-0 w-full h-full z-[5]" style={{ pointerEvents: "none" }}>
            <path
              d="M 57 114 Q 120 140 160 209 Q 200 180 250 152 Q 280 200 296 236"
              fill="none"
              stroke="rgba(127,216,190,0.25)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
          </svg>

          {/* ground area */}
          <div
            className="absolute bottom-0 left-0 right-0 h-20 z-[3]"
            style={{
              background: "linear-gradient(180deg, transparent 0%, rgba(127,216,190,0.1) 100%)",
              borderTop: "1.5px dashed rgba(127,216,190,0.2)",
            }}
          />

          {/* walking cat */}
          <div className="absolute bottom-6 animate-walk z-[15]">
            <PixelCat size={52} walking />
          </div>

          {/* bottom status bar */}
          <div
            className="absolute bottom-0 left-0 right-0 px-4 py-2.5 z-20 flex items-center justify-between"
            style={{
              background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
            }}
          >
            <span className="font-pixel text-[6px] text-[var(--yellow)]">
              🐾 4 stops today · 2.1 hrs active
            </span>
            <span className="font-pixel text-[6px] text-[var(--mint)]">
              😌 CALM
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
