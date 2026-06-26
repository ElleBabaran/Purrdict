import TopBar from "@/components/nav/TopBar";
import { needPredictions } from "@/lib/mockData";

const levelStyles: Record<string, { badge: string; bar: string; accent: string }> = {
  high:   { badge: "bg-[var(--yellow)] text-[var(--cocoa)]", bar: "var(--yellow)",   accent: "rgba(255,209,102,0.12)" },
  normal: { badge: "bg-[var(--mint)] text-[var(--plum)]",    bar: "var(--mint-dk)",  accent: "rgba(127,216,190,0.08)" },
  low:    { badge: "bg-[var(--cream2)] text-[var(--cocoa-lt)]", bar: "#A78BFA",       accent: "rgba(167,139,250,0.08)" },
};

export default function NeedsPage() {
  const sorted = [...needPredictions].sort((a, b) => b.pct - a.pct);
  return (
    <>
      <TopBar title="▸ NEEDS PREDICTOR" />
      <div className="px-4 py-5 space-y-3">

        {/* Top need hero */}
        {sorted[0] && (
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{
              background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
              border: "2px solid var(--plum-lt)",
              boxShadow: "4px 4px 0 var(--cocoa)",
            }}
          >
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: "rgba(255,209,102,0.12)", border: "2px solid rgba(255,209,102,0.2)" }}
            >
              {sorted[0].emoji}
            </div>
            <div className="flex-1">
              <div className="font-pixel text-[7px] text-[var(--yellow)] mb-1">TOP NEED RIGHT NOW</div>
              <div className="text-xl font-bold text-white">{sorted[0].name}</div>
              <div className="text-[11px] text-white/50 mt-0.5">{sorted[0].pct}% likely · {sorted[0].meta}</div>
            </div>
          </div>
        )}

        {/* All needs */}
        {sorted.map((n) => {
          const style = levelStyles[n.level];
          return (
            <div
              key={n.key}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "#fff",
                border: "2px solid var(--cocoa)",
                boxShadow: "3px 3px 0 var(--cocoa)",
              }}
            >
              {/* accent top bar at percentage width */}
              <div className="h-1 w-full bg-[var(--cream2)] relative overflow-hidden">
                <div
                  className="h-full absolute left-0 top-0 rounded-full"
                  style={{ width: `${n.pct}%`, background: style.bar }}
                />
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: style.accent, border: `1.5px solid ${style.bar}33` }}
                    >
                      {n.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--cocoa)]">{n.name}</div>
                      <div className="font-pixel text-[8px] text-[var(--cocoa-lt)] mt-0.5">{n.meta}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[var(--cocoa)]">{n.pct}%</span>
                    <span className={`font-pixel text-[6px] px-2 py-1 rounded-full ${style.badge}`}>
                      {n.level.toUpperCase()}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed">{n.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
