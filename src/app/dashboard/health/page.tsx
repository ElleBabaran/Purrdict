import TopBar from "@/components/nav/TopBar";
import { healthAlert, healthWeek, healthStats } from "@/lib/mockData";

const statusStyle: Record<string, { bar: string; text: string; bg: string }> = {
  normal: { bar: "var(--mint-dk)",  text: "text-[var(--mint-dk)]",  bg: "rgba(79,174,148,0.12)"  },
  watch:  { bar: "var(--yellow)",   text: "text-[var(--yellow)]",   bg: "rgba(255,209,102,0.12)" },
  alert:  { bar: "var(--coral)",    text: "text-[var(--coral)]",    bg: "rgba(255,107,107,0.12)" },
};

const toneColor: Record<string, string> = {
  good:    "text-[var(--mint-dk)]",
  warn:    "text-[var(--pink-dk)]",
  neutral: "text-[var(--cocoa)]",
};

export default function HealthPage() {
  return (
    <>
      <TopBar title="▸ HEALTH MONITOR" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Alert banner ── */}
        {healthAlert.active && (
          <div
            className="rounded-2xl p-4 flex items-start gap-3 animate-fade-up"
            style={{
              background: "linear-gradient(135deg, rgba(255,107,107,0.12) 0%, rgba(255,107,107,0.06) 100%)",
              border: "2px solid rgba(255,107,107,0.35)",
              boxShadow: "3px 3px 0 var(--cocoa)",
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "rgba(255,107,107,0.15)", border: "1.5px solid rgba(255,107,107,0.3)" }}
            >
              ⚠️
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--coral)] mb-1">{healthAlert.title}</div>
              <p className="text-[11px] text-[var(--cocoa-lt)] leading-relaxed">{healthAlert.desc}</p>
            </div>
          </div>
        )}

        {/* ── 7-day baseline ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-4">7-DAY BASELINE</div>
          <div className="space-y-3">
            {healthWeek.map((d) => {
              const ss = statusStyle[d.status];
              return (
                <div key={d.day} className="flex items-center gap-3">
                  <span className="font-pixel text-[9px] text-[var(--cocoa-lt)] w-10">{d.day}</span>
                  <div className="flex-1 h-2.5 bg-[var(--cream2)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${d.score}%`,
                        background: ss.bar,
                      }}
                    />
                  </div>
                  <span
                    className={`font-pixel text-[8px] w-14 text-right ${ss.text}`}
                  >
                    {d.status === "normal" ? "OK ✓" : d.status.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Health stats ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-3">HEALTH STATS</div>
          <div className="space-y-0">
            {healthStats.map((s, i) => (
              <div
                key={s.k}
                className="flex justify-between items-center py-2.5"
                style={{
                  borderBottom: i < healthStats.length - 1 ? "1px solid var(--cream2)" : "none",
                }}
              >
                <span className="text-[12px] text-[var(--cocoa-lt)]">{s.k}</span>
                <span className={`text-[12px] font-bold ${toneColor[s.tone]}`}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Vet prompt ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3"
          style={{
            background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          <span className="text-2xl">🏥</span>
          <div className="flex-1">
            <div className="text-sm font-bold text-white mb-0.5">Schedule a vet visit?</div>
            <div className="text-[11px] text-white/50">
              Last check-up was 3 months ago. Due for annual wellness.
            </div>
          </div>
          <button
            className="font-pixel text-[7px] px-3 py-2 rounded-xl text-[var(--plum)] pixel-press"
            style={{
              background: "linear-gradient(135deg, var(--mint) 0%, var(--mint-dk) 100%)",
              boxShadow: "2px 2px 0 var(--cocoa)",
            }}
          >
            BOOK
          </button>
        </div>
      </div>
    </>
  );
}
