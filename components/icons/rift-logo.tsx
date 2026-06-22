import { useId, type FC } from "react";

interface RiftLogoProps {
  /** Pixel size of the square logo */
  size?: number;
  /** Whether to render the glow effect */
  glow?: boolean;
  className?: string;
}

/**
 * RIFT logo mark — "slip-fault".
 *
 * A solid rounded square split by an offset vertical tear: the upper crack sits
 * left of center, the lower crack right, joined by a 45° slip plane — reading as
 * two tectonic plates that have shifted past each other (a breach / rift). The
 * tear is a true transparent cut (via mask), so the mark inherits `currentColor`
 * and works on any background, at any size. Pass `glow` for the phosphor halo.
 */
export const RiftLogo: FC<RiftLogoProps> = ({
  size = 32,
  glow = false,
  className,
}) => {
  const maskId = useId();
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
          ? { filter: "drop-shadow(0 0 4px rgba(0,255,102,0.6))" }
          : undefined
      }
    >
      <mask id={maskId}>
        {/* Visible body */}
        <rect x="1" y="1" width="30" height="30" rx="8" fill="#fff" />
        {/* Carved slip-fault tear (offset top→bottom, 45° slip in the middle) */}
        <path
          d="M16 -2 L13.4 13 L18.6 18 L15.4 34"
          stroke="#000"
          strokeWidth="3"
          strokeLinejoin="round"
        />
      </mask>
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="8"
        fill="currentColor"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
};
