// src/components/PixelCat.tsx
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
  const isOrange = variant === "orange";
  const body = isOrange ? "#F5A623" : "#3D2E50";
  const bodyLight = isOrange ? "#FFCC66" : "#5A4573";
  const dark = isOrange ? "#4A3B32" : "#1A1225";
  const earInner = isOrange ? "#FF8FA3" : "#E56B85";
  const nose = "#FF8FA3";
  const eyes = isOrange ? "#2D2438" : "#7FD8BE";
  const whiskerColor = isOrange ? "#4A3B32" : "#C4B5FD";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`${bounce ? "animate-cat-bounce" : ""} ${className}`}
    >
      {/* Tail */}
      <path
        d="M48 42 C54 40, 58 34, 56 28 C55 24, 52 22, 50 24"
        stroke={body}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M56 28 C55.5 25, 53 23, 51 25"
        stroke={dark}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* Body */}
      <ellipse cx="32" cy="46" rx="16" ry="12" fill={body} />
      {/* Belly */}
      <ellipse cx="32" cy="48" rx="10" ry="8" fill={bodyLight} opacity="0.6" />

      {/* Front paws */}
      <ellipse cx="24" cy="55" rx="4.5" ry="3.5" fill={dark} />
      <ellipse cx="40" cy="55" rx="4.5" ry="3.5" fill={dark} />
      {/* Paw pads */}
      <circle cx="23" cy="55.5" r="1.2" fill={earInner} opacity="0.7" />
      <circle cx="25" cy="55.5" r="1.2" fill={earInner} opacity="0.7" />
      <circle cx="39" cy="55.5" r="1.2" fill={earInner} opacity="0.7" />
      <circle cx="41" cy="55.5" r="1.2" fill={earInner} opacity="0.7" />

      {/* Head */}
      <circle cx="32" cy="26" r="14" fill={body} />

      {/* Left ear */}
      <path d="M20 18 L18 6 L26 14 Z" fill={body} />
      <path d="M21 16 L19.5 8 L25 14 Z" fill={earInner} />

      {/* Right ear */}
      <path d="M44 18 L46 6 L38 14 Z" fill={body} />
      <path d="M43 16 L44.5 8 L39 14 Z" fill={earInner} />

      {/* Face markings (tabby stripes for orange) */}
      {isOrange && (
        <>
          <path d="M28 16 L32 14 L36 16" stroke={dark} strokeWidth="1.2" fill="none" opacity="0.4" strokeLinecap="round" />
          <path d="M26 18 L32 16 L38 18" stroke={dark} strokeWidth="1" fill="none" opacity="0.3" strokeLinecap="round" />
        </>
      )}

      {/* Eyes */}
      <ellipse cx="27" cy="25" rx="3" ry="3.5" fill="white" />
      <ellipse cx="37" cy="25" rx="3" ry="3.5" fill="white" />
      <ellipse cx="27.5" cy="25.5" rx="2" ry="2.5" fill={eyes} />
      <ellipse cx="37.5" cy="25.5" rx="2" ry="2.5" fill={eyes} />
      {/* Eye shine */}
      <circle cx="26.5" cy="24.5" r="1" fill="white" />
      <circle cx="36.5" cy="24.5" r="1" fill="white" />

      {/* Nose */}
      <path d="M31 29 L32 30.5 L33 29 Z" fill={nose} />

      {/* Mouth */}
      <path d="M32 30.5 C32 30.5 30 32.5 29 32" stroke={dark} strokeWidth="0.8" fill="none" strokeLinecap="round" />
      <path d="M32 30.5 C32 30.5 34 32.5 35 32" stroke={dark} strokeWidth="0.8" fill="none" strokeLinecap="round" />

      {/* Whiskers */}
      <line x1="14" y1="27" x2="24" y2="28.5" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="15" y1="30" x2="24" y2="30" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="16" y1="33" x2="24" y2="31.5" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="50" y1="27" x2="40" y2="28.5" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="49" y1="30" x2="40" y2="30" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />
      <line x1="48" y1="33" x2="40" y2="31.5" stroke={whiskerColor} strokeWidth="0.8" strokeLinecap="round" />

      {/* Cheeks */}
      <circle cx="24" cy="30" r="2.5" fill={earInner} opacity="0.25" />
      <circle cx="40" cy="30" r="2.5" fill={earInner} opacity="0.25" />
    </svg>
  );
}
