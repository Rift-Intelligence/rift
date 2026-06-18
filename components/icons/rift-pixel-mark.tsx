import type { FC } from "react";

interface RiftPixelMarkProps {
  size?: number;
  className?: string;
}

/** RIFT app mark — simple pixel panda face. */
export const RiftPixelMark: FC<RiftPixelMarkProps> = ({
  size = 32,
  className,
}) => {
  const cell = size / 8;
  const D = "var(--mascot-detail)";
  const F = "var(--mascot-face)";
  const pixels: Array<{ x: number; y: number; fill: string }> = [
    { x: 2, y: 1, fill: D },
    { x: 5, y: 1, fill: D },
    { x: 1, y: 2, fill: F },
    { x: 2, y: 2, fill: F },
    { x: 3, y: 2, fill: F },
    { x: 4, y: 2, fill: F },
    { x: 5, y: 2, fill: F },
    { x: 6, y: 2, fill: F },
    { x: 1, y: 3, fill: D },
    { x: 2, y: 3, fill: D },
    { x: 3, y: 3, fill: F },
    { x: 4, y: 3, fill: F },
    { x: 5, y: 3, fill: D },
    { x: 6, y: 3, fill: D },
    { x: 1, y: 4, fill: F },
    { x: 2, y: 4, fill: F },
    { x: 3, y: 4, fill: D },
    { x: 4, y: 4, fill: F },
    { x: 5, y: 4, fill: F },
    { x: 6, y: 4, fill: F },
    { x: 2, y: 5, fill: F },
    { x: 3, y: 5, fill: F },
    { x: 4, y: 5, fill: F },
    { x: 5, y: 5, fill: F },
  ];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
      className={className}
      role="img"
      aria-label="RIFT"
    >
      <rect
        x={0}
        y={0}
        width={size}
        height={size}
        rx={Math.round((size * 6) / 22)}
        fill="var(--mascot-bg)"
      />
      {pixels.map(({ x, y, fill }, i) => (
        <rect
          key={i}
          x={x * cell}
          y={y * cell}
          width={cell}
          height={cell}
          fill={fill}
        />
      ))}
    </svg>
  );
};
