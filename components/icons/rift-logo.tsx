import type { FC } from "react";

interface RiftLogoProps {
  /** Pixel size of the square logo */
  size?: number;
  /** Whether to render the glow effect */
  glow?: boolean;
  className?: string;
}

/**
 * RIFT logo mark.
 *
 * Concept: two triangular wedges pointing inward with a glowing gap between
 * them — a dimensional rift / tear in space. Registration ticks top & bottom.
 * Inherits `currentColor`; pass `glow` for the phosphor-green signal halo.
 */
export const RiftLogo: FC<RiftLogoProps> = ({
  size = 32,
  glow = false,
  className,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="RIFT"
      style={
        glow
          ? { filter: "drop-shadow(0 0 5px rgba(0,255,102,0.6))" }
          : undefined
      }
    >
      {/* Left wedge — apex points right toward the rift */}
      <path
        d="M2 4 L14 16 L2 28 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Right wedge — apex points left toward the rift */}
      <path
        d="M30 4 L18 16 L30 28 Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Rift gap — glowing crack at center */}
      <path
        d="M16 9 L16 23"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.45"
      />
      {/* Registration ticks (top/bottom) */}
      <path
        d="M16 0.5 V2.5 M16 29.5 V31.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
};
