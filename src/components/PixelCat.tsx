"use client";
import { useEffect, useState } from "react";

type PixelCatProps = {
  size?: number;
  variant?: "orange" | "night";
  className?: string;
  bounce?: boolean;
};

export default function PixelCat({
  size = 48,
  variant = "orange",
  className = "",
  bounce = false,
}: PixelCatProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isNodding, setIsNodding] = useState(false);
  const [tailPhase, setTailPhase] = useState(0);

  // Blink animation — random intervals
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    };
    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 4000; // 2-6 seconds
      return setTimeout(() => {
        blink();
        timerId = scheduleNext();
      }, delay);
    };
    let timerId = scheduleNext();
    return () => clearTimeout(timerId);
  }, []);

  // Nod animation — occasional
  useEffect(() => {
    const scheduleNod = () => {
      const delay = 5000 + Math.random() * 8000; // 5-13 seconds
      return setTimeout(() => {
        setIsNodding(true);
        setTimeout(() => setIsNodding(false), 600);
        timerId = scheduleNod();
      }, delay);
    };
    let timerId = scheduleNod();
    return () => clearTimeout(timerId);
  }, []);

  // Tail wag
  useEffect(() => {
    const interval = setInterval(() => {
      setTailPhase((p) => (p + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const isOrange = variant === "orange";
  const body = isOrange ? "#F5A623" : "#3D2E50";
  const bodyDark = isOrange ? "#D4891A" : "#2A1E3A";
  const belly = isOrange ? "#FFCC66" : "#5A4573";
  const earInner = "#FF8FA3";
  const nose = "#4A3B32";
  const pawPad = "#E56B85";
  const eyeWhite = "#FFFFFF";
  const eyeIris = isOrange ? "#4A5FC1" : "#7FD8BE";
  const eyePupil = isOrange ? "#1A1A2E" : "#0E2E28";
  const whiskerColor = isOrange ? "#8A7768" : "#C4B5FD";
  const tailTip = isOrange ? "#4A3B32" : "#1A1225";
  const stripeColor = isOrange ? "#D4891A" : "transparent";

  // Tail curve based on phase
  const tailCurves = [
    "M52 38 C56 34, 60 28, 58 22 C56 18, 52 16, 50 19",
    "M52 38 C57 33, 62 27, 59 21 C57 17, 53 17, 51 20",
    "M52 38 C56 34, 60 28, 58 22 C56 18, 52 16, 50 19",
    "M52 38 C55 35, 58 29, 57 23 C55 19, 51 17, 49 20",
  ];

  const nodTransform = isNodding ? "translateY(2px)" : "translateY(0)";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`${bounce ? "animate-cat-bounce" : ""} ${className}`}
      style={{ overflow: "visible" }}
    >
      {/* Tail with animation */}
      <path
        d={tailCurves[tailPhase]}
        stroke={body}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        style={{ transition: "d 0.4s ease" }}
      />
      <path
        d={tailCurves[tailPhase]}
        stroke={tailTip}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        strokeDasharray="0 22 12 100"
        style={{ transition: "d 0.4s ease" }}
      />

      {/* Body */}
      <ellipse cx="32" cy="46" rx="17" ry="14" fill={body} />
      {/* Belly */}
      <ellipse cx="32" cy="49" rx="11" ry="10" fill={belly} />

      {/* Front paws */}
      <ellipse cx="23" cy="57" rx="5" ry="4" fill={bodyDark} />
      <ellipse cx="41" cy="57" rx="5" ry="4" fill={bodyDark} />
      {/* Paw pads */}
      <ellipse cx="23" cy="58" rx="3" ry="2" fill={pawPad} opacity="0.8" />
      <ellipse cx="41" cy="58" rx="3" ry="2" fill={pawPad} opacity="0.8" />

      {/* Head group (nods) */}
      <g style={{ transform: nodTransform, transformOrigin: "32px 30px", transition: "transform 0.3s ease" }}>
        {/* Head */}
        <ellipse cx="32" cy="26" rx="15" ry="13.5" fill={body} />

        {/* Left ear */}
        <path d="M18 18 L16 5 L27 14 Z" fill={body} />
        <path d="M19.5 16 L18 8 L25.5 14 Z" fill={earInner} />

        {/* Right ear */}
        <path d="M46 18 L48 5 L37 14 Z" fill={body} />
        <path d="M44.5 16 L46 8 L38.5 14 Z" fill={earInner} />

        {/* Tabby stripes on forehead */}
        {isOrange && (
          <>
            <path d="M27 15 C29 13.5, 35 13.5, 37 15" stroke={stripeColor} strokeWidth="1.2" fill="none" opacity="0.6" strokeLinecap="round" />
            <path d="M28.5 13 C30 12, 34 12, 35.5 13" stroke={stripeColor} strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round" />
            <path d="M30 11.5 L32 10.5 L34 11.5" stroke={stripeColor} strokeWidth="0.8" fill="none" opacity="0.4" strokeLinecap="round" />
          </>
        )}

        {/* Eyes */}
        <g>
          {/* Left eye */}
          <ellipse cx="26" cy="25" rx="4" ry={isBlinking ? 0.5 : 4.5} fill={eyeWhite} style={{ transition: "ry 0.08s ease" }} />
          {!isBlinking && (
            <>
              <ellipse cx="26.5" cy="25.5" rx="2.8" ry="3.2" fill={eyeIris} />
              <ellipse cx="26.5" cy="26" rx="1.8" ry="2.2" fill={eyePupil} />
              <circle cx="25" cy="24" r="1.2" fill="white" opacity="0.9" />
              <circle cx="27.5" cy="26.5" r="0.6" fill="white" opacity="0.5" />
            </>
          )}

          {/* Right eye */}
          <ellipse cx="38" cy="25" rx="4" ry={isBlinking ? 0.5 : 4.5} fill={eyeWhite} style={{ transition: "ry 0.08s ease" }} />
          {!isBlinking && (
            <>
              <ellipse cx="38.5" cy="25.5" rx="2.8" ry="3.2" fill={eyeIris} />
              <ellipse cx="38.5" cy="26" rx="1.8" ry="2.2" fill={eyePupil} />
              <circle cx="37" cy="24" r="1.2" fill="white" opacity="0.9" />
              <circle cx="39.5" cy="26.5" r="0.6" fill="white" opacity="0.5" />
            </>
          )}
        </g>

        {/* Nose */}
        <path d="M30.5 30 L32 32 L33.5 30 Z" fill={nose} />

        {/* Mouth */}
        <path d="M32 32 C31 33.5, 29 34, 28 33.5" stroke={nose} strokeWidth="0.9" fill="none" strokeLinecap="round" />
        <path d="M32 32 C33 33.5, 35 34, 36 33.5" stroke={nose} strokeWidth="0.9" fill="none" strokeLinecap="round" />

        {/* Whiskers */}
        <line x1="11" y1="27" x2="22" y2="29" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="10" y1="30" x2="22" y2="31" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="11" y1="33" x2="22" y2="32.5" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="53" y1="27" x2="42" y2="29" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="54" y1="30" x2="42" y2="31" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />
        <line x1="53" y1="33" x2="42" y2="32.5" stroke={whiskerColor} strokeWidth="0.9" strokeLinecap="round" />

        {/* Cheeks (blush) */}
        <circle cx="22" cy="31" r="3" fill={earInner} opacity="0.2" />
        <circle cx="42" cy="31" r="3" fill={earInner} opacity="0.2" />
      </g>
    </svg>
  );
}
