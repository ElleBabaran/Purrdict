"use client";
import { useEffect, useState, useCallback } from "react";

type CatActivity = "sleeping" | "eating" | "playing" | "walking" | "sitting";
type PlayPhase = "idle" | "throw" | "jump" | "catch" | "return";

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

  // Yarn play sequence
  const [playPhase, setPlayPhase] = useState<PlayPhase>("idle");
  const [yarnPos, setYarnPos] = useState({ x: -10, y: 50 });
  const [catJumpY, setCatJumpY] = useState(0);
  const [showHand, setShowHand] = useState(false);

  // Frame ticker (for walk legs)
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => (f + 1) % 8), 250);
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

  // Walking — cat moves side to side with animated legs
  useEffect(() => {
    if (activity !== "walking") return;
    setCatX(20);
    const id = setInterval(() => {
      setCatX((x) => {
        if (x >= 78) return 20;
        return x + 1.5;
      });
    }, 150);
    return () => clearInterval(id);
  }, [activity]);

  // Sleeping zzz
  useEffect(() => {
    if (activity !== "sleeping") return;
    const id = setInterval(() => setZzz((z) => !z), 1000);
    return () => clearInterval(id);
  }, [activity]);

  // Yarn play sequence: hand throws → yarn flies → cat jumps → catches → returns
  const startYarnSequence = useCallback(() => {
    // Phase 1: Hand appears
    setShowHand(true);
    setPlayPhase("idle");
    setYarnPos({ x: 5, y: 45 });
    setCatJumpY(0);

    // Phase 2: Throw (after 800ms)
    setTimeout(() => {
      setPlayPhase("throw");
      setYarnPos({ x: 55, y: 60 });
      setShowHand(false);
    }, 800);

    // Phase 3: Cat jumps (after 1500ms)
    setTimeout(() => {
      setPlayPhase("jump");
      setCatJumpY(-15);
    }, 1500);

    // Phase 4: Catch (after 2000ms)
    setTimeout(() => {
      setPlayPhase("catch");
      setCatJumpY(-10);
      setYarnPos({ x: 50, y: 55 });
    }, 2000);

    // Phase 5: Land + return (after 2500ms)
    setTimeout(() => {
      setCatJumpY(0);
      setPlayPhase("return");
      setYarnPos({ x: 30, y: 72 });
    }, 2500);

    // Reset (after 4000ms)
    setTimeout(() => {
      setPlayPhase("idle");
      setYarnPos({ x: -10, y: 50 });
    }, 4000);
  }, []);

  // Loop yarn play
  useEffect(() => {
    if (activity !== "playing") return;
    startYarnSequence();
    const id = setInterval(startYarnSequence, 5000);
    return () => clearInterval(id);
  }, [activity, startYarnSequence]);

  const isDay = timeOfDay === "day";

  // Cat position
  const getCatPos = () => {
    switch (activity) {
      case "sleeping": return { x: 18, y: 65 };
      case "eating": return { x: 72, y: 74 };
      case "playing": return { x: playPhase === "return" ? 30 : playPhase === "jump" || playPhase === "catch" ? 52 : 40, y: 74 };
      case "walking": return { x: catX, y: 76 };
      default: return { x: 50, y: 74 };
    }
  };

  const catPos = getCatPos();
  const isEating = activity === "eating";
  const isSleeping = activity === "sleeping";
  const isWalking = activity === "walking";
  const isPlaying = activity === "playing";

  return (
    <div className="relative w-full rounded-2xl overflow-hidden select-none" style={{ aspectRatio: "16/10" }}>
      {/* Sky */}
      <div className="absolute inset-0" style={{
        background: isDay
          ? "linear-gradient(180deg, #87CEEB 0%, #B8E4F0 40%, #F0E6D3 100%)"
          : "linear-gradient(180deg, #0E0820 0%, #1A1040 40%, #2A1850 100%)",
      }} />

      {/* Sun/Moon */}
      {isDay ? (
        <div className="absolute top-[8%] right-[15%] w-10 h-10 rounded-full" style={{ background: "#FFD700", boxShadow: "0 0 20px rgba(255,215,0,0.5)" }} />
      ) : (
        <div className="absolute top-[8%] right-[15%] w-8 h-8 rounded-full" style={{ background: "radial-gradient(#E8E0F0, #B0A0D0)", boxShadow: "0 0 15px rgba(200,180,230,0.4)" }} />
      )}

      {/* Window */}
      <div className="absolute top-[15%] left-[35%] w-[30%] h-[30%]" style={{ background: isDay ? "linear-gradient(180deg, #A0D4E8, #C8E8F4)" : "linear-gradient(180deg, #0A0618, #1A1040)", border: "4px solid #8B7355" }}>
        <div className="absolute left-1/2 top-0 bottom-0 w-[3px] -translate-x-1/2 bg-[#8B7355]" />
        <div className="absolute top-1/2 left-0 right-0 h-[3px] -translate-y-1/2 bg-[#8B7355]" />
      </div>

      {/* Wall */}
      <div className="absolute left-0 right-0 top-[48%] bottom-[35%]" style={{ background: isDay ? "#F5E6D3" : "#2A2040", borderBottom: `3px solid ${isDay ? "#D4C4A8" : "#1A1030"}` }} />

      {/* Floor */}
      <div className="absolute left-0 right-0 bottom-0 h-[38%]" style={{ background: isDay ? "linear-gradient(180deg, #C8A882 0%, #A08060 100%)" : "linear-gradient(180deg, #3A2850 0%, #2A1840 100%)" }}>
        <div className="absolute inset-0 opacity-20">
          {[0, 20, 40, 60, 80].map((l) => (
            <div key={l} className="absolute top-0 bottom-0" style={{ left: `${l}%`, width: "1px", background: isDay ? "#8A6040" : "#1A1030" }} />
          ))}
        </div>
      </div>

      {/* Cat bed */}
      <div className="absolute bottom-[28%] left-[8%] w-[22%] h-[14%]">
        <div className="absolute bottom-0 w-full h-[70%] rounded-full" style={{ background: "#E8A0B0", border: "2px solid #C08090" }} />
        <div className="absolute bottom-[10%] left-[10%] right-[10%] h-[50%] rounded-full" style={{ background: "#F0C8D0" }} />
      </div>

      {/* Food bowl */}
      <div className="absolute bottom-[22%] right-[12%] w-[12%] h-[7%]">
        <div className="w-full h-full rounded-b-full rounded-t-lg" style={{ background: "#E06060", border: "2px solid #C04040" }} />
        <div className="absolute top-[15%] left-[15%] right-[15%] h-[40%] rounded-full" style={{ background: "#A07050" }} />
      </div>

      {/* Scratching post */}
      <div className="absolute bottom-[22%] left-[42%] w-[3.5%] h-[18%]">
        <div className="w-full h-full rounded-t" style={{ background: "#C8A060" }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[160%] h-3.5 rounded-t-lg" style={{ background: "#90C090" }} />
      </div>

      {/* ── HAND throwing yarn ── */}
      {isPlaying && showHand && (
        <div className="absolute left-[2%] top-[40%] z-20 animate-fade-up">
          <svg width="32" height="32" viewBox="0 0 16 16" shapeRendering="crispEdges">
            <rect x={8} y={4} width={4} height={6} fill="#F0C8A0" />
            <rect x={7} y={6} width={2} height={5} fill="#F0C8A0" />
            <rect x={12} y={5} width={2} height={4} fill="#F0C8A0" />
            <rect x={6} y={8} width={2} height={4} fill="#F0C8A0" />
            <rect x={9} y={3} width={3} height={2} fill="#F0C8A0" />
          </svg>
        </div>
      )}

      {/* ── YARN BALL ── */}
      {isPlaying && playPhase !== "idle" && (
        <div
          className="absolute z-15 transition-all"
          style={{
            left: `${yarnPos.x}%`,
            top: `${yarnPos.y}%`,
            transitionDuration: playPhase === "throw" ? "700ms" : "400ms",
            transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.3, 1)",
          }}
        >
          {/* Yarn ball - pixel art */}
          <svg width="20" height="20" viewBox="0 0 10 10" shapeRendering="crispEdges">
            <rect x={3} y={1} width={4} height={1} fill="#60A060" />
            <rect x={2} y={2} width={6} height={1} fill="#60A060" />
            <rect x={1} y={3} width={8} height={4} fill="#50B050" />
            <rect x={2} y={7} width={6} height={1} fill="#60A060" />
            <rect x={3} y={8} width={4} height={1} fill="#60A060" />
            {/* Yarn strand */}
            <rect x={7} y={5} width={2} height={1} fill="#40A040" />
            <rect x={8} y={4} width={1} height={1} fill="#40A040" />
            {/* Highlight */}
            <rect x={3} y={3} width={2} height={1} fill="#80D080" />
          </svg>
          {/* Motion trail when thrown */}
          {playPhase === "throw" && (
            <>
              <div className="absolute -left-3 top-1/2 w-2 h-0.5 bg-[#50B050] opacity-50 rounded" />
              <div className="absolute -left-5 top-1/2 w-1.5 h-0.5 bg-[#50B050] opacity-30 rounded" />
            </>
          )}
        </div>
      )}

      {/* ── THE CAT ── */}
      <div
        className="absolute z-20 transition-all"
        style={{
          left: `${catPos.x}%`,
          top: `calc(${catPos.y}% + ${catJumpY}px)`,
          transform: "translate(-50%, -50%)",
          transitionDuration: isWalking ? "130ms" : "400ms",
          transitionTimingFunction: "ease-out",
        }}
      >
        <CatSprite
          activity={activity}
          frame={frame}
          blink={blink}
          size={isSleeping ? 44 : 48}
          playPhase={playPhase}
        />

        {/* ZZZ */}
        {isSleeping && (
          <div className="absolute -top-5 -right-2 font-pixel text-[10px] text-[#7090D0]" style={{ opacity: zzz ? 1 : 0.3, transition: "opacity 0.5s" }}>
            z<span className="text-[8px]">z</span><span className="text-[6px]">z</span>
          </div>
        )}

        {/* Eating crumbs */}
        {isEating && frame % 3 === 0 && (
          <div className="absolute -top-2 left-1/2 w-1 h-1 rounded-full bg-[#A07050] animate-fade-up" />
        )}

        {/* Yarn in mouth after catch */}
        {isPlaying && (playPhase === "catch" || playPhase === "return") && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2">
            <svg width="10" height="10" viewBox="0 0 6 6" shapeRendering="crispEdges">
              <rect x={1} y={1} width={4} height={4} fill="#50B050" />
              <rect x={2} y={0} width={2} height={1} fill="#60A060" />
            </svg>
          </div>
        )}
      </div>

      {/* ── HUD ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-30">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(127,216,190,0.3)" }}>
          <span className="w-2 h-2 rounded-full bg-[#7FD8BE] animate-blink" />
          <span className="font-pixel text-[7px] text-[#7FD8BE]">LIVE</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <span className="font-pixel text-[7px] text-white/70">{catName}</span>
          <span className="font-pixel text-[7px] text-[#FFD166]">
            {activity === "sleeping" ? "💤" : activity === "eating" ? "🍽️" : activity === "playing" ? "🧶" : activity === "walking" ? "🚶" : "😌"}
          </span>
        </div>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 z-30 flex items-center justify-between" style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.6))" }}>
        <span className="font-pixel text-[7px] text-white/70">
          {activity === "sleeping" && "Taking a cozy nap~"}
          {activity === "eating" && "Nom nom time~"}
          {activity === "playing" && (playPhase === "throw" ? "Ooh! A yarn ball!" : playPhase === "jump" ? "POUNCE!" : playPhase === "catch" ? "Got it!" : playPhase === "return" ? "Bringing it back~" : "Waiting for yarn~")}
          {activity === "walking" && "Exploring around~"}
          {activity === "sitting" && "Just vibing~"}
        </span>
        <span className="font-pixel text-[6px] text-white/40">ESP32 LEASH</span>
      </div>
    </div>
  );
}

/* ── Pixel Art Cat Sprite ── */
function CatSprite({
  activity,
  frame,
  blink,
  size = 48,
  playPhase = "idle",
}: {
  activity: CatActivity;
  frame: number;
  blink: boolean;
  size?: number;
  playPhase?: PlayPhase;
}) {
  const isSleeping = activity === "sleeping";
  const isEating = activity === "eating";
  const isWalking = activity === "walking";
  const isJumping = playPhase === "jump";

  // Walk leg animation: alternating legs
  const legFrame = isWalking ? frame % 4 : 0;
  const fl = isWalking ? (legFrame < 2 ? -1 : 0) : 0;
  const fr = isWalking ? (legFrame < 2 ? 0 : -1) : 0;

  // Eating head bob
  const headDip = isEating && frame % 2 === 0 ? 1 : 0;

  // Jump stretch
  const jumpStretch = isJumping ? "scale(1.1, 0.9)" : "scale(1, 1)";

  if (isSleeping) {
    return (
      <svg width={size} height={size * 0.6} viewBox="0 0 20 12" shapeRendering="crispEdges" style={{ imageRendering: "pixelated" }}>
        {/* Body loaf */}
        <rect x={4} y={4} width={12} height={6} fill="#F5A623" />
        <rect x={3} y={5} width={1} height={4} fill="#4A3B32" />
        <rect x={16} y={5} width={1} height={4} fill="#4A3B32" />
        <rect x={4} y={3} width={12} height={1} fill="#4A3B32" />
        <rect x={4} y={10} width={12} height={1} fill="#4A3B32" />
        {/* Head */}
        <rect x={2} y={3} width={6} height={5} fill="#F5A623" />
        <rect x={1} y={3} width={1} height={5} fill="#4A3B32" />
        <rect x={2} y={2} width={6} height={1} fill="#4A3B32" />
        {/* Ears */}
        <rect x={2} y={1} width={2} height={2} fill="#F5A623" />
        <rect x={3} y={1} width={1} height={1} fill="#FF8FA3" />
        <rect x={6} y={1} width={2} height={2} fill="#F5A623" />
        <rect x={7} y={1} width={1} height={1} fill="#FF8FA3" />
        {/* Closed eyes */}
        <rect x={3} y={5} width={2} height={1} fill="#4A3B32" />
        <rect x={6} y={5} width={2} height={1} fill="#4A3B32" />
        {/* Belly */}
        <rect x={6} y={7} width={8} height={2} fill="#FFCC66" opacity={0.5} />
        {/* Tail curled */}
        <rect x={14} y={5} width={3} height={2} fill="#F5A623" />
        <rect x={16} y={4} width={2} height={2} fill="#4A3B32" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 18"
      shapeRendering="crispEdges"
      style={{ imageRendering: "pixelated", transform: jumpStretch, transition: "transform 0.2s" }}
    >
      {/* Head group (bobs when eating) */}
      <g transform={`translate(0, ${headDip})`}>
        {/* Ears */}
        <rect x={3} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={4} y={1} width={1} height={1} fill="#FF8FA3" />
        <rect x={11} y={0} width={2} height={2} fill="#F5A623" />
        <rect x={12} y={1} width={1} height={1} fill="#FF8FA3" />
        {/* Head */}
        <rect x={3} y={2} width={10} height={7} fill="#F5A623" />
        {/* Outline */}
        <rect x={2} y={3} width={1} height={5} fill="#4A3B32" />
        <rect x={13} y={3} width={1} height={5} fill="#4A3B32" />
        <rect x={3} y={1} width={10} height={1} fill="#4A3B32" />
        {/* Tabby forehead */}
        <rect x={5} y={3} width={6} height={1} fill="#D4891A" opacity={0.5} />
        {/* Eyes */}
        {blink ? (
          <>
            <rect x={4} y={5} width={3} height={1} fill="#4A3B32" />
            <rect x={9} y={5} width={3} height={1} fill="#4A3B32" />
          </>
        ) : (
          <>
            <rect x={4} y={4} width={3} height={3} fill="#FFF" />
            <rect x={5} y={5} width={2} height={2} fill="#2D2438" />
            <rect x={5} y={4} width={1} height={1} fill="#FFF" />
            <rect x={9} y={4} width={3} height={3} fill="#FFF" />
            <rect x={10} y={5} width={2} height={2} fill="#2D2438" />
            <rect x={10} y={4} width={1} height={1} fill="#FFF" />
          </>
        )}
        {/* Nose */}
        <rect x={7} y={7} width={2} height={1} fill="#4A3B32" />
        {/* Mouth */}
        <rect x={6} y={8} width={1} height={1} fill="#4A3B32" opacity={0.6} />
        <rect x={9} y={8} width={1} height={1} fill="#4A3B32" opacity={0.6} />
        {/* Whiskers */}
        <rect x={0} y={6} width={3} height={1} fill="#8A7768" opacity={0.6} />
        <rect x={0} y={8} width={3} height={1} fill="#8A7768" opacity={0.6} />
        <rect x={13} y={6} width={3} height={1} fill="#8A7768" opacity={0.6} />
        <rect x={13} y={8} width={3} height={1} fill="#8A7768" opacity={0.6} />
        {/* Cheeks */}
        <rect x={3} y={6} width={2} height={2} fill="#FF8FA3" opacity={0.25} />
        <rect x={11} y={6} width={2} height={2} fill="#FF8FA3" opacity={0.25} />
      </g>
      {/* Body */}
      <rect x={4} y={9} width={8} height={5} fill="#F5A623" />
      <rect x={5} y={10} width={6} height={3} fill="#FFCC66" opacity={0.5} />
      {/* Body outline */}
      <rect x={3} y={9} width={1} height={5} fill="#4A3B32" />
      <rect x={12} y={9} width={1} height={5} fill="#4A3B32" />
      {/* Tail */}
      <rect x={12} y={9} width={2} height={1} fill="#F5A623" />
      <rect x={13} y={8} width={2} height={1} fill="#F5A623" />
      <rect x={14} y={7} width={2} height={1} fill="#D4891A" />
      {/* Legs with walk animation */}
      <rect x={4} y={14 + fl} width={2} height={3} fill="#D4891A" />
      <rect x={5} y={16 + fl} width={1} height={1} fill="#E56B85" />
      <rect x={10} y={14 + fr} width={2} height={3} fill="#D4891A" />
      <rect x={11} y={16 + fr} width={1} height={1} fill="#E56B85" />
    </svg>
  );
}
