"use client";
import { useEffect, useState } from "react";

type PixelCatProps = {
  size?: number;
  variant?: "orange" | "night";
  className?: string;
  bounce?: boolean;
  walking?: boolean;
};

export default function PixelCat({
  size = 48,
  variant = "orange",
  className = "",
  bounce = false,
  walking = false,
}: PixelCatProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [tailFrame, setTailFrame] = useState(0);
  const [walkFrame, setWalkFrame] = useState(0);

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

  // Tail wag
  useEffect(() => {
    const interval = setInterval(() => {
      setTailFrame((f) => (f + 1) % 4);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Walk cycle (4 frames)
  useEffect(() => {
    if (!walking) return;
    const interval = setInterval(() => {
      setWalkFrame((f) => (f + 1) % 4);
    }, 200);
    return () => clearInterval(interval);
  }, [walking]);

  const isOrange = variant === "orange";

  // Colors
  const body = isOrange ? "#F5A623" : "#5A4080";
  const bodyDark = isOrange ? "#D4891A" : "#3D2E60";
  const outline = isOrange ? "#4A3B32" : "#1A1225";
  const earInner = "#FF8FA3";
  const eyeWhite = "#FFFFFF";
  const pupil = isOrange ? "#2D2438" : "#7FD8BE";
  const belly = isOrange ? "#FFCC66" : "#7A6099";
  const nose = "#4A3B32";
  const pawPad = "#E56B85";
  const tailTip = isOrange ? "#4A3B32" : "#1A1225";
  const whisker = isOrange ? "#6B5B50" : "#A090C0";

  // Walk leg offsets (simulate stepping)
  const legOffsets = [
    { fl: 0, fr: -1, bl: -1, br: 0 },  // frame 0
    { fl: -1, fr: 0, bl: 0, br: -1 },  // frame 1
    { fl: 0, fr: -1, bl: -1, br: 0 },  // frame 2
    { fl: -1, fr: 0, bl: 0, br: -1 },  // frame 3
  ];
  const legs = walking ? legOffsets[walkFrame] : { fl: 0, fr: 0, bl: 0, br: 0 };

  // Body bob when walking
  const bodyY = walking ? (walkFrame % 2 === 0 ? 0 : -0.5) : 0;

  // Tail sway positions
  const tailSway = [0, 2, 0, -2][tailFrame];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      className={`${bounce ? "animate-cat-bounce" : ""} ${className}`}
    >
      <g transform={`translate(0, ${bodyY})`}>
        {/* Tail */}
        <rect x={24 + tailSway} y={12} width={2} height={2} fill={body} />
        <rect x={25 + tailSway} y={10} width={2} height={2} fill={body} />
        <rect x={26 + tailSway} y={8} width={2} height={2} fill={body} />
        <rect x={25 + tailSway} y={7} width={2} height={2} fill={tailTip} />
        <rect x={24 + tailSway} y={6} width={2} height={2} fill={tailTip} />

        {/* Body */}
        <rect x={8} y={16} width={16} height={10} fill={body} />
        <rect x={9} y={15} width={14} height={2} fill={body} />
        <rect x={10} y={17} width={12} height={7} fill={belly} />

        {/* Body outline */}
        <rect x={7} y={16} width={1} height={10} fill={outline} />
        <rect x={24} y={16} width={1} height={10} fill={outline} />
        <rect x={8} y={14} width={16} height={1} fill={outline} />
        <rect x={8} y={26} width={16} height={1} fill={outline} />

        {/* Head */}
        <rect x={8} y={4} width={14} height={12} fill={body} />
        <rect x={9} y={3} width={12} height={1} fill={body} />

        {/* Head outline */}
        <rect x={7} y={4} width={1} height={12} fill={outline} />
        <rect x={22} y={4} width={1} height={12} fill={outline} />
        <rect x={8} y={3} width={14} height={1} fill={outline} />

        {/* Left ear */}
        <rect x={8} y={1} width={2} height={3} fill={body} />
        <rect x={7} y={1} width={1} height={4} fill={outline} />
        <rect x={10} y={2} width={1} height={2} fill={outline} />
        <rect x={8} y={0} width={2} height={1} fill={outline} />
        <rect x={9} y={2} width={1} height={2} fill={earInner} />

        {/* Right ear */}
        <rect x={19} y={1} width={2} height={3} fill={body} />
        <rect x={21} y={1} width={1} height={4} fill={outline} />
        <rect x={18} y={2} width={1} height={2} fill={outline} />
        <rect x={19} y={0} width={2} height={1} fill={outline} />
        <rect x={20} y={2} width={1} height={2} fill={earInner} />

        {/* Eyes */}
        {isBlinking ? (
          <>
            <rect x={10} y={9} width={3} height={1} fill={outline} />
            <rect x={17} y={9} width={3} height={1} fill={outline} />
          </>
        ) : (
          <>
            {/* Left eye */}
            <rect x={10} y={8} width={3} height={3} fill={eyeWhite} />
            <rect x={11} y={9} width={2} height={2} fill={pupil} />
            <rect x={11} y={8} width={1} height={1} fill="#FFF" />
            {/* Right eye */}
            <rect x={17} y={8} width={3} height={3} fill={eyeWhite} />
            <rect x={18} y={9} width={2} height={2} fill={pupil} />
            <rect x={18} y={8} width={1} height={1} fill="#FFF" />
          </>
        )}

        {/* Nose */}
        <rect x={14} y={11} width={2} height={1} fill={nose} />
        {/* Mouth */}
        <rect x={13} y={12} width={1} height={1} fill={nose} />
        <rect x={16} y={12} width={1} height={1} fill={nose} />

        {/* Whiskers */}
        <rect x={5} y={10} width={3} height={1} fill={whisker} />
        <rect x={5} y={12} width={3} height={1} fill={whisker} />
        <rect x={22} y={10} width={3} height={1} fill={whisker} />
        <rect x={22} y={12} width={3} height={1} fill={whisker} />

        {/* Cheek blush */}
        <rect x={9} y={11} width={2} height={2} fill={earInner} opacity={0.3} />
        <rect x={19} y={11} width={2} height={2} fill={earInner} opacity={0.3} />

        {/* Legs/Paws */}
        {/* Front left */}
        <rect x={9} y={26 + legs.fl} width={3} height={3} fill={bodyDark} />
        <rect x={10} y={28 + legs.fl} width={2} height={1} fill={pawPad} />
        {/* Front right */}
        <rect x={18} y={26 + legs.fr} width={3} height={3} fill={bodyDark} />
        <rect x={19} y={28 + legs.fr} width={2} height={1} fill={pawPad} />

        {/* Tabby stripes (orange only) */}
        {isOrange && (
          <>
            <rect x={12} y={5} width={6} height={1} fill={bodyDark} opacity={0.4} />
            <rect x={13} y={4} width={4} height={1} fill={bodyDark} opacity={0.3} />
          </>
        )}
      </g>
    </svg>
  );
}
