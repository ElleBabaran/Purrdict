// src/components/landing/CTA.tsx
import Link from "next/link";

export default function CTA() {
  return (
    <>
      <section
        id="cta"
        className="py-24 px-6 text-center relative overflow-hidden"
        style={{ background: "var(--plum)" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(255,209,102,0.12) 0%, transparent 60%)",
          }}
        />
        <div className="max-w-lg mx-auto relative z-10">
          <span className="font-pixel text-[10px] text-[var(--yellow)] mb-3.5 inline-block">
            ▸ NEW GAME
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3.5 leading-tight">
            Ready to find out
            <br />
            what she&apos;s really up to?
          </h2>
          <p className="text-base text-[#C9BFE0] mb-9 font-medium">
            Strap on the leash — 17 research papers are ready to decode her behavior.
          </p>
          <div className="flex gap-3.5 justify-center flex-wrap">
            <Link
              href="/signup"
              className="pixel-press font-pixel text-[11px] px-6 py-4 pixel-border rounded bg-[var(--pink)] text-white inline-flex items-center gap-2"
            >
              🐱 GET STARTED
            </Link>
            <Link
              href="/demo"
              className="pixel-press font-pixel text-[11px] px-6 py-4 rounded text-white inline-flex items-center gap-2 border-[3px] border-white"
              style={{ boxShadow: "4px 4px 0 white" }}
            >
              🎮 TRY DEMO
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-8 py-7 flex items-center justify-between flex-wrap gap-2.5 text-sm" style={{ background: "var(--cocoa)", color: "var(--cream)" }}>
        <div className="font-pixel text-[11px]">
          🐾 PURRDICT<span style={{ color: "var(--yellow)" }}> RESEARCH</span>
        </div>
        <div>Backed by 17 peer-reviewed papers · Built for #hackthekitty 2026</div>
      </footer>
    </>
  );
}
