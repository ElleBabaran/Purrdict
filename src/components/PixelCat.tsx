"use client";
import { useEffect, useState } from "react";

type PixelCatProps = {
  size?: number;
  variant?: "orange" | "night";
  className?: string;
  bounce?: boolean;
  walking?: boolean;
};

// High-detail pixel art cat rendered as a grid of colored pixels
// 16x16 grid — orange tabby sitting, inspired by the chunky pixel art style
// Each cell is one "fat pixel"

const ORANGE_SIT = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBWKBBBBWKBO__",
  "_OBBWKBBBBWKBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "___ODDOO__ODDO__",
  "___OPPO___OPPO__",
];

const ORANGE_WALK_1 = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBWKBBBBWKBO__",
  "_OBBWKBBBBWKBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "__ODDO___ODDOO__",
  "__OPPO____OPPO__",
];

const ORANGE_WALK_2 = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBWKBBBBWKBO__",
  "_OBBWKBBBBWKBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "___ODDOO_ODDO___",
  "____OPPO_OPPO___",
];

// Blink frame — eyes become a line
const ORANGE_BLINK = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBBBBBBBBBBBO_",
  "_OBBKKBBBBKKBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "___ODDOO__ODDO__",
  "___OPPO___OPPO__",
];

const NIGHT_SIT = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBGCBBBBGCBO__",
  "_OBBGCBBBBGCBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "___ODDOO__ODDO__",
  "___OPPO___OPPO__",
];

const NIGHT_BLINK = [
  "________________",
  "___OO______OO___",
  "__OPPO____OPPO__",
  "__OBBBO__OBBBO__",
  "_OBBBBBBBBBBBO__",
  "_OBBDBBBBBBDBO__",
  "_OBBBBBBBBBBBBO_",
  "_OBBBBBBBBBBBBO_",
  "_OBBCCBBBBCCBO__",
  "_OBBBBBNNBBBBO__",
  "_OBBBBMBBMBBO___",
  "__OBBBBBBBBBO___",
  "__OBLLLLLLLLBO__",
  "__OBLLLLLLLLBO__",
  "___ODDOO__ODDO__",
  "___OPPO___OPPO__",
];

// Color palettes
const ORANGE_COLORS: Record<string, string> = {
  _: "transparent",
  O: "#4A3B32",   // outline/dark brown
  B: "#F5A623",   // body orange
  D: "#D4891A",   // darker orange (stripes/shading)
  L: "#FFCC66",   // light belly
  P: "#FF8FA3",   // pink (ear inner, paw pads)
  W: "#FFFFFF",   // eye white
  K: "#1A1A2E",   // eye pupil (dark)
  N: "#4A3B32",   // nose
  M: "#4A3B32",   // mouth
};

const NIGHT_COLORS: Record<string, string> = {
  _: "transparent",
  O: "#1A1225",   // outline
  B: "#3D2E50",   // body purple
  D: "#2A1E3A",   // darker purple
  L: "#5A4573",   // belly lighter
  P: "#E56B85",   // pink
  W: "#FFFFFF",   // eye white
  G: "#7FD8BE",   // eye (green glow)
  C: "#0E4E40",   // eye pupil (dark teal)
  K: "#1A1225",   // dark
  N: "#2A1E3A",   // nose
  M: "#2A1E3A",   // mouth
};

export default function PixelCat({
  size = 48,
  variant = "orange",
  className = "",
  bounce = false,
  walking = false,
}: PixelCatProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [walkFrame, setWalkFrame] = useState(0);
  const [tailWag, setTailWag] = useState(0);

  // Blink randomly
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const scheduleNext = (): ReturnType<typeof setTimeout> => {
      const delay = 2500 + Math.random() * 3500;
      return setTimeout(() => {
        blink();
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  // Walk cycle
  useEffect(() => {
    if (!walking) return;
    const interval = setInterval(() => {
      setWalkFrame((f) => (f + 1) % 2);
    }, 250);
    return () => clearInterval(interval);
  }, [walking]);

  // Tail wag
  useEffect(() => {
    const interval = setInterval(() => {
      setTailWag((t) => (t + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const isOrange = variant === "orange";
  const colors = isOrange ? ORANGE_COLORS : NIGHT_COLORS;

  // Pick the right frame
  let frame: string[];
  if (isBlinking) {
    frame = isOrange ? ORANGE_BLINK : NIGHT_BLINK;
  } else if (walking) {
    frame = walkFrame === 0 ? ORANGE_WALK_1 : ORANGE_WALK_2;
  } else {
    frame = isOrange ? ORANGE_SIT : NIGHT_SIT;
  }

  const rows = frame.length;
  const cols = frame[0].length;

  // Tail pixels relative to body
  const tailPositions = [
    [{ x: 14, y: 7 }, { x: 15, y: 6 }, { x: 15, y: 5 }],
    [{ x: 14, y: 7 }, { x: 15, y: 6 }, { x: 15, y: 5 }, { x: 14, y: 4 }],
    [{ x: 14, y: 7 }, { x: 15, y: 6 }, { x: 15, y: 5 }],
    [{ x: 14, y: 7 }, { x: 15, y: 7 }, { x: 15, y: 6 }],
  ];
  const tail = tailPositions[tailWag];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${cols} ${rows}`}
      shapeRendering="crispEdges"
      className={`${bounce ? "animate-cat-bounce" : ""} ${className}`}
      role="img"
      aria-label="Pixel art cat"
    >
      {/* Tail */}
      {tail.map((p, i) => (
        <rect
          key={`tail-${i}`}
          x={p.x}
          y={p.y}
          width={1}
          height={1}
          fill={i === tail.length - 1 ? colors.O : colors.B}
        />
      ))}

      {/* Body from pixel grid */}
      {frame.map((row, y) =>
        row.split("").map((ch, x) => {
          if (ch === "_") return null;
          const color = colors[ch];
          if (!color || color === "transparent") return null;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={color}
            />
          );
        })
      )}
    </svg>
  );
}
