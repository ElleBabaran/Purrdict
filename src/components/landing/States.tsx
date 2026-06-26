// src/components/landing/States.tsx
// Based on: Nicholson & O'Carroll 2021 (5 primary feline emotions)
// + Evangelista 2019 (Feline Grimace Scale for pain)
const states = [
  { emoji: "😌", name: "CONTENT", desc: "Relaxed posture, slow blinks, soft purring (25-50Hz)", source: "Nicholson 2021" },
  { emoji: "😸", name: "JOY / PLAY", desc: "Dilated pupils, ears forward, tail up, pounce-ready crouch", source: "Nicholson 2021" },
  { emoji: "🧐", name: "INTEREST", desc: "Ears rotating, head tilts, whiskers forward, alert stance", source: "Nicholson 2021" },
  { emoji: "😰", name: "FEAR", desc: "Flattened ears, wide eyes, tucked tail, frozen low crouch", source: "Nicholson 2021" },
  { emoji: "😾", name: "ANGER", desc: "Puffed tail, arched back, hissing, direct stare", source: "Nicholson 2021" },
  { emoji: "🤕", name: "PAIN", desc: "Orbital tightening, muzzle tension, ears flattened sideways", source: "FGS — Evangelista 2019" },
];

export default function States() {
  return (
    <section id="states" className="py-20 px-6" style={{ background: "var(--cream2)" }}>
      <div className="max-w-3xl mx-auto">
        <span className="font-pixel text-[10px] text-[var(--pink-dk)] mb-3.5 inline-block">
          ▸ ETHOGRAM
        </span>
        <h2 className="text-3xl md:text-4xl font-bold text-[var(--cocoa)] mb-3.5 leading-tight">
          Every emotion, <span className="text-[var(--mint-dk)]">research-defined</span>
        </h2>
        <p className="text-base text-[var(--cocoa-lt)] max-w-md mb-10 font-medium">
          Based on the feline emotion ethogram (Nicholson & O&apos;Carroll 2021) and the Feline Grimace Scale (Evangelista et al. 2019).
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
          {states.map((s) => (
            <div
              key={s.name}
              className="bg-white pixel-border-sm rounded p-4 text-center hover:-translate-y-1 transition-transform"
            >
              <span className="text-3xl mb-2 block">{s.emoji}</span>
              <div className="font-pixel text-[8px] text-[var(--cocoa)] mb-1.5">
                {s.name}
              </div>
              <div className="text-xs text-[var(--cocoa-lt)] leading-snug mb-2">
                {s.desc}
              </div>
              <div className="font-pixel text-[6px] text-[var(--mint-dk)] opacity-70">
                {s.source}
              </div>
            </div>
          ))}
        </div>

        {/* Research links */}
        <div className="mt-8 text-center space-y-1">
          <p className="text-[11px] text-[var(--cocoa-lt)]">
            📚 <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC7995744/" target="_blank" rel="noopener" className="underline hover:text-[var(--pink-dk)]">Nicholson & O&apos;Carroll 2021 — Irish Vet Journal</a>
          </p>
          <p className="text-[11px] text-[var(--cocoa-lt)]">
            📚 <a href="https://www.nature.com/articles/s41598-019-55693-8" target="_blank" rel="noopener" className="underline hover:text-[var(--pink-dk)]">Evangelista et al. 2019 — Feline Grimace Scale (Nature)</a>
          </p>
        </div>
      </div>
    </section>
  );
}
