// src/components/landing/Levels.tsx
const levels = [
  {
    icon: "📡",
    tag: "LEVEL 01 — COLLECT",
    title: "Tiny leash, big sensors",
    body: "An ESP32 leash with a triaxial accelerometer, gyroscope, GPS module, and camera — sampling movement at 50Hz while your cat naps, zooms, or stalks dust bunnies.",
  },
  {
    icon: "📚",
    tag: "LEVEL 02 — CLASSIFY",
    title: "Research-backed detection",
    body: "Random Forest and CNN-LSTM models classify 10+ behaviors from sensor data — validated by Ikurior et al. 2023 (>86% accuracy) and Uddin et al. 2024 on leash-mounted hardware.",
  },
  {
    icon: "😺",
    tag: "LEVEL 03 — ASSESS",
    title: "Emotions & pain, decoded",
    body: "The Feline Grimace Scale (Evangelista 2019, 91% sensitivity) detects pain. The Nicholson 2021 ethogram maps body language to 5 primary emotions: fear, anger, joy, contentment, interest.",
  },
  {
    icon: "🗺️",
    tag: "LEVEL 04 — TRACK",
    title: "Every hideout, pinned live",
    body: "Real-time GPS on OpenStreetMap with geofence alerts. Know exactly where she napped, hunted, or planned her next escape — backed by circadian pattern research (Piccione 2013).",
  },
];

export default function Levels() {
  return (
    <section id="levels" className="py-20 px-6" style={{ background: "var(--cream2)" }}>
      <div className="max-w-3xl mx-auto">
        <span className="font-pixel text-[10px] text-[var(--pink-dk)] mb-3.5 inline-block">
          ▸ QUEST LOG
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--cocoa)] mb-3.5 leading-tight">
          Four levels to <span className="text-[var(--mint-dk)]">cat-whisperer</span> status
        </h2>
        <p className="text-base text-[var(--cocoa-lt)] max-w-md mb-12 font-medium">
          Each level is grounded in published veterinary and ethology research.
        </p>

        <div className="flex flex-col">
          {levels.map((l, i) => (
            <div key={l.tag} className="grid grid-cols-[64px_1fr] md:grid-cols-[90px_1fr] gap-5 md:gap-6 items-start py-6 relative">
              {i !== levels.length - 1 && (
                <div
                  className="absolute w-[3px] top-[64px] md:top-[90px] bottom-[-24px]"
                  style={{
                    left: "30px",
                    background:
                      "repeating-linear-gradient(to bottom, var(--cocoa) 0 6px, transparent 6px 12px)",
                  }}
                />
              )}
              <div className="w-[60px] h-[60px] md:w-[88px] md:h-[88px] rounded-full bg-white pixel-border flex items-center justify-center text-2xl md:text-3xl flex-shrink-0">
                {l.icon}
              </div>
              <div className="bg-white pixel-border-sm rounded p-5">
                <span className="font-pixel text-[8px] text-[var(--mint-dk)] mb-2 block">
                  {l.tag}
                </span>
                <div className="text-lg font-bold text-[var(--cocoa)] mb-1.5">
                  {l.title}
                </div>
                <p className="text-sm text-[var(--cocoa-lt)] leading-relaxed">
                  {l.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
