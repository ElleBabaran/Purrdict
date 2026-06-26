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
  const body = variant === "orange" ? "#F5A623" : "#F5A623";
  const dark = variant === "orange" ? "#4A3B32" : "#1A1424";
  const belly = "#FFD166";

  return (
    <svg
      width={size}
      height={(size * 40) / 48}
      viewBox="0 0 48 40"
      shapeRendering="crispEdges"
      className={`${bounce ? "animate-cat-bounce" : ""} ${className}`}
    >
      <rect x="14" y="6" width="20" height="4" fill={dark} />
      <rect x="10" y="10" width="4" height="4" fill={dark} />
      <rect x="34" y="10" width="4" height="4" fill={dark} />
      <rect x="12" y="10" width="24" height="16" fill={body} />
      <rect x="12" y="10" width="4" height="4" fill={dark} />
      <rect x="32" y="10" width="4" height="4" fill={dark} />
      <rect x="16" y="16" width="4" height="4" fill={dark === "#1A1424" ? dark : "#2D2438"} />
      <rect x="28" y="16" width="4" height="4" fill={dark === "#1A1424" ? dark : "#2D2438"} />
      <rect x="20" y="22" width="8" height="3" fill={belly} />
      <rect x="8" y="26" width="32" height="10" fill={body} />
      <rect x="8" y="26" width="32" height="3" fill={belly} opacity="0.6" />
      <rect x="6" y="34" width="6" height="6" fill={dark} />
      <rect x="20" y="34" width="6" height="6" fill={dark} />
      <rect x="34" y="34" width="6" height="6" fill={dark} />
      <rect x="38" y="14" width="4" height="4" fill={body} />
      <rect x="42" y="10" width="4" height="4" fill={body} />
      <rect x="46" y="6" width="2" height="4" fill={body} />
    </svg>
  );
}
