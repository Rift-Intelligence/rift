import { useId, type FC } from "react";

interface RiftLogoProps {
  /** Pixel size of the square logo */
  size?: number;
  /** Kept for backwards-compat with older call sites; no longer used. */
  glow?: boolean;
  className?: string;
}

/**
 * RIFT brand mark — the official geometric "R" / rift symbol: a blue
 * gradient blade with a small white notch, on a transparent ground so it drops
 * onto any surface. Scalable SVG; gradient ids are per-instance (useId) so
 * multiple marks on one page never collide.
 */
export const RiftLogo: FC<RiftLogoProps> = ({ size = 32, className }) => {
  const uid = useId().replace(/:/g, "");
  const blue = `rl-b-${uid}`;
  const white = `rl-w-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="300 250 740 740"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="RIFT"
      style={{ filter: "drop-shadow(0 2px 5px rgba(0,18,79,0.35))" }}
    >
      <defs>
        <linearGradient
          id={blue}
          x1="520"
          y1="300"
          x2="920"
          y2="930"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#20C8FF" />
          <stop offset="0.52" stopColor="#0B9EFF" />
          <stop offset="1" stopColor="#1477FF" />
        </linearGradient>
        <linearGradient
          id={white}
          x1="350"
          y1="500"
          x2="455"
          y2="755"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F1F4FF" />
        </linearGradient>
      </defs>
      <path fill={`url(#${white})`} d="M453 501 L345 579 L345 754 L453 674 Z" />
      <path
        fill={`url(#${blue})`}
        d="M603 293 L501 370 L501 527 L610 460 C621 453 633 453 645 461 L755 554 L503 748 L772 932 L975 932 L725 749 L867 624 C875 616 879 604 879 590 L879 505 C879 482 868 462 850 449 L603 293 Z"
      />
    </svg>
  );
};
