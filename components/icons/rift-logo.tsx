import type { FC } from "react";

interface RiftLogoProps {
  /** Pixel size of the square logo */
  size?: number;
  /** Whether to render the glow effect */
  glow?: boolean;
  className?: string;
}

/**
 * EYE logo mark.
 *
 * Concept: an almond eye drawn as a HUD optic — outer lid, iris ring, and a
 * solid pupil void at center, with two registration ticks. Reads as a watching
 * eye / surveillance scope at any size. Inherits `currentColor`; pass `glow`
 * for the cyan signal halo.
 *
 * (Component name kept as `RiftLogo` to avoid churn across import sites.)
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
      aria-label="EYE"
      style={
        glow
          ? { filter: "drop-shadow(0 0 5px rgba(34,224,255,0.6))" }
          : undefined
      }
    >
      {/* Eyelid / almond outline */}
      <path
        d="M2 16 C7 8.5 12 6 16 6 C20 6 25 8.5 30 16 C25 23.5 20 26 16 26 C12 26 7 23.5 2 16 Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Iris ring */}
      <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="2" />
      {/* Pupil void */}
      <circle cx="16" cy="16" r="2.6" fill="currentColor" />
      {/* Registration ticks (left/right) */}
      <path
        d="M0.5 16 H2.5 M29.5 16 H31.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
};
