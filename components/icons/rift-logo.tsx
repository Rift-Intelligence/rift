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
 * Concept: a solid geometric monolith cleanly cleaved by a diagonal "rift".
 * Two offset facets in a light/dark tone create depth and read as the letter
 * "R" / a fault line. Minimal, flat, premium — Anthropic / Cursor / Devin style.
 *
 * Uses `currentColor` so it inherits the surrounding text color by default;
 * pass `glow` for an optional neon halo.
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
          ? { filter: "drop-shadow(0 0 5px rgba(34,197,94,0.55))" }
          : undefined
      }
    >
      {/* Left facet — full strength */}
      <path d="M5 4 H16.5 L12 16 L17 28 H5 Z" fill="currentColor" />
      {/* Right facet — lighter tone for depth across the rift */}
      <path
        d="M19.5 4 H27 V28 H21 L15.5 16 Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
    </svg>
  );
};
