"use client";
import { useEffect, useState } from "react";

type CatActivity = "sleeping" | "eating" | "playing" | "walking" | "sitting";

interface CatRoomProps {
  activity?: CatActivity;
  catName?: string;
  timeOfDay?: "day" | "night";
}

export default function CatRoom({
  activity = "sitting",
  catName = "Mochi",
  timeOfDay = "day",
}: CatRoomProps) {
  const [frame, setFrame] = useState(0);
  const [catX, setCatX] = useState(50);
  const [blink, setBlink] = useState(false);
  const [zzz, setZzz] = useState(false);
  const [playBall, setPlayBall] = useState({ x: 65, y: 70 });

  // Animation frame ticker
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => (f + 1) % 8), 300);
    return () => clearInterval(interval);
  }, []);

  // Blink
  useEffect(() => {
    if (activity === "sleeping") return;
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(id);
  }, [activity]);

  // Walking movement
  useEffect(() => {
    if (activity !== "walking") return;
    const id = setInterval(() => {
      setCatX((x) => {
        const next = x + 2;
        return next > 80 ? 20 : next;
      });
    }, 300);
    return () => clearInterval(id);
  }, [activity]);

  // Sleeping zzz
  useEffect(() => {
    if (activity !== "sleeping") return;
    const id = setInterval(() => {
      setZzz((z) => !z);
    }, 1000);
    return () => clearInterval(id);
  }, [activity]);

  // Playing ball bounce
  useEffect(() => {
    if (activity !== "playing") return;
    const id = setInterval(() => {
      setPlayBall((b) => ({
        x: b.x + (Math.random() - 0.5) * 8,
        y: 68 + Math.sin(Date.now() / 300) * 4,
      }));
    }, 400);
    return () => clearInterval(id);
  }, [activity]);

  const isDay = timeOfDay === "day";

  // Cat position based on activity
  const getCatPos = () => {
    switch (activity) {
      case "sleeping": return { x: 18, y: 62 };
      case "eating": return { x: 72, y: 72 };
      case "playing": return { x: 50, y: 72 };
      case "walking": return { x: catX, y: 75 };
      default: return { x: 50, y: 72 };
    }
  };

  const catPos = getCatPos();
  const walkFrame = activity === "walking" ? frame % 4 : 0;
  const isEating = activity === "eating";
  const isSleeping = activity === "sleeping";

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ aspectRatio: "16/10" }}
    >
      {/* Sky / Background */}
      <div
        className="absolute inset-0"
        style={{
          background: isDay
            ? "linear-gradient(180deg, #87CEEB 0%, #B8E4F0 40%, #F0E6D3 100%)"
            : "linear-gradient(180deg, #0E0820 0%, #1A1040 40%, #2A1850 100%)",
        }}
      />

      {/* Sun or Moon */}
      {isDay ? (
        <div
          className="absolute top-[8%] right-[15%] w-10 h-10 rounded-full"
          style={{ background: "#FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.5)" }}
        />
      ) : (
        <div
          className="absolute top-[8%] right-[15%] w-8 h-8 rounded-full"
          style={{ background: "radial-gradient(#E8E0F0, #B0A0D0)", boxShadow: "0 0 15px rgba(200,180,230,0.4)" }}
        />
      )}

      {/* Window on back wall */}
      <div
        className="absolute top-[15%] left-[35%] w-[30%] h-[30%]"
        style={{
          background: isDay ? "linear-gradient(180deg, #A0D4E8, #C8E8F4)" : "linear-gradient(180deg, #0A0618, #1A1040)",
          border: "4px solid #8B7355",
          borderRadius: "2px",
        }}
      >
        {/* Window cross */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-[#8B7355]" />
        <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-[#8B7355]" />
        {/* Curtains */}
        <div className="absolute -left-2 top-0 w-3 h-full bg-[#E8B0B0] opacity-60 rounded-r" />
        <div className="absolute -right-2 top-0 w-3 h-full bg-[#E8B0B0] opacity-60 rounded-l" />
      </div>

      {/* Wall */}
      <div
        className="absolute left-0 right-0 top-[48%] bottom-[35%]"
        style={{
          background: isDay ? "#F5E6D3" : "#2A2040",
          borderBottom: `3px solid ${isDay ? "#D4C4A8" : "#1A1030"}`,
        }}
      />

      {/* Floor */}
      <div
        className="absolute left-0 right-0 bottom-0 h-[38%]"
        style={{
          background: isDay
            ? "linear-gradient(180deg, #C8A882 0%, #A08060 100%)"
            : "linear-gradient(180deg, #3A2850 0%, #2A1840 100%)",
        }}
      >
        {/* Floor planks */}
        <div className="absolute inset-0 opacity-20">
          {[0, 20, 40, 60, 80].map((left) => (
            <div
              key={left}
              className="absolute top-0 bottom-0"
              style={{ left: `${left}%`, width: "1px", background: isDay ? "#8A6040" : "#1A1030" }}
            />
          ))}
        </div>
      </div>

      {/* ── FURNITURE ── */}

      {/* Cat bed (left side) */}
      <div className="absolute bottom-[28%] left-[8%] w-[22%] h-[16%]">
        <div
          className="absolute bottom-0 w-full h-[70%] rounded-full"
          style={{ background: "#E8A0B0", border: "2px solid #C08090" }}
        />
        <div
          className="absolute bottom-[10%] left-[10%] right-[10%] h-[50%] rounded-full"
          style={{ background: "#F0C8D0" }}
        />
        {/* Pillow */}
        <div
          className="absolute bottom-[20%] left-[25%] w-[50%] h-[35%] rounded-full"
          style={{ background: "#F8E0E8", border: "1px solid #E0B0C0" }}
        />
      </div>

      {/* Food bowl (right side) */}
      <div className="absolute bottom-[22%] right-[12%] w-[12%] h-[8%]">
        <div
          className="w-full h-full rounded-b-full rounded-t-lg"
          style={{ background: "#E06060", border: "2px solid #C04040" }}
        />
        {/* Food in bowl */}
        <div
          className="absolute top-[15%] left-[15%] right-[15%] h-[40%] rounded-full"
          style={{ background: isEating ? "#8B6040" : "#A07050" }}
        />
        {/* Bowl label */}
        <div className="absolute top-[50%] left-1/2 -translate-x-1/2 w-2 h-1 rounded-full bg-[#F0D0D0]" />
      </div>

      {/* Water bowl */}
      <div className="absolute bottom-[22%] right-[26%] w-[9%] h-[6%]">
        <div
          className="w-full h-full rounded-b-full rounded-t-lg"
          style={{ background: "#6090E0", border: "2px solid #4070C0" }}
        />
        <div
          className="absolute top-[20%] left-[20%] right-[20%] h-[35%] rounded-full"
          style={{ background: "#80B0F0", opacity: 0.8 }}
        />
      </div>

      {/* Toy ball */}
      {activity === "playing" && (
        <div
          className="absolute w-5 h-5 rounded-full z-10 transition-all duration-300"
          style={{
            left: `${playBall.x}%`,
            top: `${playBall.y}%`,
            background: "radial-gradient(circle at 30% 30%, #FF6060, #CC3030)",
            border: "1.5px solid #AA2020",
            boxShadow: "1px 2px 3px rgba(0,0,0,0.3)",
          }}
        >
          <div className="absolute top-[20%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/40" />
        </div>
      )}

      {/* Scratching post */}
      <div className="absolute bottom-[22%] left-[38%] w-[4%] h-[20%]">
        <div className="w-full h-full rounded-t" style={{ background: "#C8A060", border: "1px solid #A08040" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-4 rounded-t-lg" style={{ background: "#90C090", border: "1px solid #70A070" }} />
        {/* Rope texture */}
        {[20, 35, 50, 65, 80].map((top) => (
          <div key={top} className="absolute left-0 right-0 h-[2px]" style={{ top: `${top}%`, background: "#A08840" }} />
        ))}
      </div>

      {/* ── THE CAT ── */}
      <div
        className="absolute z-20 transition-all"
        style={{
          left: `${catPos.x}%`,
          top: `${catPos.y}%`,
          transform: "translate(-50%, -50%)",
          transitionDuration: activity === "walking" ? "250ms" : "500ms",
        }}
      >
        <CatSprite
          activity={activity}
          frame={frame}
          walkFrame={walkFrame}
          blink={blink}
          size={activity === "sleeping" ? 44 : 48}
        />

        {/* Sleeping ZZZ */}
        {isSleeping && (
          <div className="absolute -top-5 -right-2 font-pixel text-[10px] text-[#7090D0]" style={{ opacity: zzz ? 1 : 0.3, transition: "opacity 0.5s" }}>
            z<span className="text-[8px]">z</span><span className="text-[6px]">z</span>
          </div>
        )}

        {/* Eating particles */}
        {isEating && frame % 3 === 0 && (
          <div className="absolute -top-2 left-1/2 w-1 h-1 rounded-full bg-[#A07050] animate-fade-up" />
        )}
      </div>

      {/* ── HUD OVERLAY ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(127,216,190,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-[#7FD8BE] animate-blink" />
          <span className="font-pixel text-[7px] text-[#7FD8BE]">LIVE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="font-pixel text-[7px] text-white/70">{catName}</span>
          <span className="font-pixel text-[7px] text-[#FFD166]">
            {activity === "sleeping" ? "💤" : activity === "eating" ? "🍽️" : activity === "playing" ? "🎯" : activity === "walking" ? "🚶" : "😌"}
          </span>
        </div>
      </div>

      {/* Activity label */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-30 flex items-center justify-between" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
        <span className="font-pixel text-[7px] text-white/70">
          {activity === "sleeping" && "Taking a cozy nap~"}
          {activity === "eating" && "Nom nom time~"}
          {activity === "playing" && "Chasing the ball!"}
          {activity === "walking" && "Exploring around~"}
          {activity === "sitting" && "Just vibing~"}
        </span>
        <span className="font-pixel text-[6px] text-white/40">ESP32 COLLAR</span>
      </div>
    </div>
  );
}

/* ── Cat Sprite Component ── */
function CatSprite({
  activity,
  frame,
  walkFrame,
  blink,
  size = 48,
}: {
  activity: CatActivity;
  frame: number;
  walkFrame: number;
  blink: boolean;
  size?: number;
}) {
  const isSleeping = activity === "sleeping";
  const isEating = activity === "eating";
  const isWalking = activity === "walking";

  // Body bob for eating
  const headDip = isEating && frame % 2 === 0 ? 1 : 0;
  // Sleep: cat is in loaf position (shorter height)
  const viewBox = isSleeping ? "0 0 20 12" : "0 0 16 16";

  if (isSleeping) {
    return (
      <svg width={size} height={size * 0.6} viewBox={viewBox} shapeRendering="crispEdges">
        {/* Sleeping loaf cat */}
        <rect x={3} y={4} width={14} height={7} fill="#F5A623" />
        <rect x={2} y={5} width={1} height={5} fill="#4A3B32" />
        <rect x={17} y={5} width={1} height={5} fill="#4A3B32" />
        <rect x={3} y={3} width={14} height={1} fill="#4A3B32" />
        <rect x={3} y={11} width={14} height={1} fill="#4A3B32" />
        {/* Head */}
        <rect x={3} y={2} width={7} height={6} fill="#F5A623" />
        <rect x={2} y={2} width={1} height={6} fill="#4A3B32" />
        <rect x={3} y={1} width={7} height={1} fill="#4A3B32" />
        {/* Ears */}
        <rect x={3} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={4} y={0} width={1} height={1} fill="#FF8FA3" />
        <rect x={7} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={8} y={0} width={1} height={1} fill="#FF8FA3" />
        {/* Closed eyes */}
        <rect x={4} y={4} width={2} height={1} fill="#4A3B32" />
        <rect x={7} y={4} width={2} height={1} fill="#4A3B32" />
        {/* Tail */}
        <rect x={15} y={6} width={3} height={2} fill="#F5A623" />
        <rect x={17} y={5} width={2} height={2} fill="#D4891A" />
        {/* Belly/body shading */}
        <rect x={5} y={8} width={10} height={2} fill="#FFCC66" opacity={0.5} />
        {/* Paws tucked */}
        <rect x={3} y={9} width={2} height={2} fill="#D4891A" />
        <rect x={12} y={9} width={2} height={2} fill="#D4891A" />
      </svg>
    );
  }

  // Normal sitting/walking/eating/playing cat
  // Walk leg offsets
  const legAnim = isWalking ? [
    { fl: 0, fr: -1 },
    { fl: -1, fr: 0 },
    { fl: 0, fr: -1 },
    { fl: -1, fr: 0 },
  ][walkFrame] : { fl: 0, fr: 0 };

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <g transform={`translate(0, ${headDip})`}>
        {/* Ears */}
        <rect x={3} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={4} y={1} width={1} height={1} fill="#FF8FA3" />
        <rect x={10} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={11} y={1} width={1} height={1} fill="#FF8FA3" />
        {/* Head */}
        <rect x={3} y={2} width={10} height={7} fill="#F5A623" />
        <rect x={2} y={3} width={1} height={5} fill="#4A3B32" />
        <rect x={13} y={3} width={1} height={5} fill="#4A3B32" />
        <rect x={3} y={1} width={10} height={1} fill="#4A3B32" />
        {/* Eyes */}
        {blink ? (
          <>
            <rect x={5} y={5} width={2} height={1} fill="#4A3B32" />
            <rect x={9} y={5} width={2} height={1} fill="#4A3B32" />
          </>
        ) : (
          <>
            <rect x={5} y={4} width={2} height={2} fill="#FFF" />
            <rect x={6} y={5} width={1} height={1} fill="#2D2438" />
            <rect x={9} y={4} width={2} height={2} fill="#FFF" />
            <rect x={10} y={5} width={1} height={1} fill="#2D2438" />
          </>
        )}
        {/* Nose & mouth */}
        <rect x={7} y={6} width={2} height={1} fill="#4A3B32" />
        <rect x={7} y={7} width={1} height={1} fill="#4A3B32" opacity={0.5} />
        <rect x={8} y={7} width={1} height={1} fill="#4A3B32" opacity={0.5} />
        {/* Whiskers */}
        <rect x={1} y={5} width={2} height={1} fill="#8A7768" opacity={0.7} />
        <rect x={1} y={7} width={2} height={1} fill="#8A7768" opacity={0.7} />
        <rect x={13} y={5} width={2} height={1} fill="#8A7768" opacity={0.7} />
        <rect x={13} y={7} width={2} height={1} fill="#8A7768" opacity={0.7} />
      </g>
      {/* Body */}
      <rect x={4} y={9} width={8} height={4} fill="#F5A623" />
      <rect x={5} y={10} width={6} height={2} fill="#FFCC66" opacity={0.6} />
      {/* Outline */}
      <rect x={3} y={9} width={1} height={4} fill="#4A3B32" />
      <rect x={12} y={9} width={1} height={4} fill="#4A3B32" />
      {/* Legs */}
      <rect x={4} y={13 + (legAnim.fl)} width={2} height={2} fill="#D4891A" />
      <rect x={5} y={14 + (legAnim.fl)} width={1} height={1} fill="#E56B85" />
      <rect x={9} y={13 + (legAnim.fr)} width={2} height={2} fill="#D4891A" />
      <rect x={10} y={14 + (legAnim.fr)} width={1} height={1} fill="#E56B85" />
      {/* Tail */}
      <rect x={12} y={9} width={2} height={1} fill="#F5A623" />
      <rect x={13} y={8} width={2} height={1} fill="#F5A623" />
      <rect x={14} y={7} width={1} height={1} fill="#4A3B32" />
      {/* Tabby stripes */}
      <rect x={5} y={3} width={6} height={1} fill="#D4891A" opacity={0.4} />
    </svg>
  );
}
