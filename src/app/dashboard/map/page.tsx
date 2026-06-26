"use client";
import { useState } from "react";
import TopBar from "@/components/nav/TopBar";
import { mapPins } from "@/lib/mockData";

export default function MapPage() {
  const [selected, setSelected] = useState(mapPins[0].id);
  const pin = mapPins.find((p) => p.id === selected)!;

  return (
    <>
      <TopBar title="▸ TODAY'S TRAIL" />
      <div className="px-4 py-5 space-y-4">

        {/* ── Map card ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--plum-xl)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "4px 4px 0 var(--cocoa)",
          }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1.5px solid rgba(255,255,255,0.06)" }}
          >
            <span className="font-pixel text-[8px] text-[var(--yellow)]">🗺️ HOME MAP</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(127,216,190,0.1)", border: "1px solid rgba(127,216,190,0.2)" }}>
              <span className="font-pixel text-[7px] text-[var(--mint)]">{mapPins.length} STOPS</span>
            </div>
          </div>

          {/* map grid */}
          <div
            className="relative h-72"
            style={{
              background:
                "linear-gradient(rgba(127,216,190,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(127,216,190,0.08) 1px, transparent 1px), #0E0B14",
              backgroundSize: "20px 20px",
            }}
          >
            {/* room outlines */}
            {[
              { label: "BEDROOM",   style: { top: 10, left: 10, width: "40%", height: "40%" }   },
              { label: "KITCHEN",   style: { top: 10, right: 10, width: "36%", height: "62%" }  },
              { label: "LIVING RM", style: { bottom: 10, left: 10, width: "62%", height: "36%" }},
            ].map((r) => (
              <div
                key={r.label}
                className="absolute rounded"
                style={{
                  ...r.style,
                  border: "1.5px dashed rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.015)",
                }}
              >
                <span className="absolute top-1.5 left-2 font-pixel text-[5.5px] text-white/25 tracking-wider">
                  {r.label}
                </span>
              </div>
            ))}

            {/* path line (decorative) */}
            <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
              <polyline
                points={mapPins
                  .map((p) => {
                    // map xPct/yPct to rough pixel coords in the 288px height container
                    return `${p.xPct * 3.2},${p.yPct * 2.88}`;
                  })
                  .join(" ")}
                fill="none"
                stroke="rgba(127,216,190,0.2)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            </svg>

            {/* pins */}
            {mapPins.map((p) => {
              const isSelected = selected === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 group"
                  style={{
                    left: `${p.xPct}%`,
                    top: `${p.yPct}%`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                  aria-label={p.label}
                >
                  <div
                    className="transition-all duration-200"
                    style={{
                      transform: isSelected ? "scale(1.4)" : "scale(1)",
                      filter: isSelected
                        ? "drop-shadow(0 0 8px rgba(255,209,102,0.8))"
                        : "drop-shadow(1px 1px 2px rgba(0,0,0,0.5))",
                    }}
                  >
                    <span className="text-xl block">{p.emoji}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Selected pin detail ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-3 transition-all animate-fade-up"
          style={{
            background: "linear-gradient(135deg, var(--plum) 0%, var(--plum-xl) 100%)",
            border: "2px solid var(--plum-lt)",
            boxShadow: "3px 3px 0 var(--cocoa)",
          }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "rgba(255,209,102,0.1)", border: "1.5px solid rgba(255,209,102,0.2)" }}
          >
            {pin.emoji}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-white">{pin.label}</div>
            <div className="font-pixel text-[8px] text-[var(--mint)] mt-0.5">{pin.time}</div>
          </div>
          <div className="font-pixel text-[7px] text-white/30">STOP {mapPins.findIndex((p) => p.id === selected) + 1}</div>
        </div>

        {/* ── All stops list ── */}
        <div className="glass-card p-4">
          <div className="font-pixel text-[7px] text-[var(--cocoa-lt)] mb-3">ALL STOPS TODAY</div>
          <div className="space-y-1">
            {mapPins.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left"
                style={{
                  background: selected === p.id ? "var(--cream2)" : "transparent",
                  border: `1.5px solid ${selected === p.id ? "var(--cocoa)" : "transparent"}`,
                }}
              >
                <span
                  className="font-pixel text-[7px] text-[var(--cocoa-lt)] w-5 text-right"
                  style={{ flexShrink: 0 }}
                >
                  {i + 1}
                </span>
                <span className="text-base">{p.emoji}</span>
                <span className="text-[12px] font-bold text-[var(--cocoa)] flex-1">{p.label}</span>
                <span className="font-pixel text-[8px] text-[var(--cocoa-lt)]">{p.time}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
