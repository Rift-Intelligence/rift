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
  const pixels: Array<{ x: number; y: number; fill: string }> = [
    { x: 2, y: 1, fill: "#161618" },
    { x: 5, y: 1, fill: "#161618" },
    { x: 1, y: 2, fill: "#f5f5f2" },
    { x: 2, y: 2, fill: "#f5f5f2" },
    { x: 3, y: 2, fill: "#f5f5f2" },
    { x: 4, y: 2, fill: "#f5f5f2" },
    { x: 5, y: 2, fill: "#f5f5f2" },
    { x: 6, y: 2, fill: "#f5f5f2" },
    { x: 1, y: 3, fill: "#161618" },
    { x: 2, y: 3, fill: "#161618" },
    { x: 3, y: 3, fill: "#f5f5f2" },
    { x: 4, y: 3, fill: "#f5f5f2" },
    { x: 5, y: 3, fill: "#161618" },
    { x: 6, y: 3, fill: "#161618" },
    { x: 1, y: 4, fill: "#f5f5f2" },
    { x: 2, y: 4, fill: "#f5f5f2" },
    { x: 3, y: 4, fill: "#161618" },
    { x: 4, y: 4, fill: "#f5f5f2" },
    { x: 5, y: 4, fill: "#f5f5f2" },
    { x: 6, y: 4, fill: "#f5f5f2" },
    { x: 2, y: 5, fill: "#f5f5f2" },
    { x: 3, y: 5, fill: "#f5f5f2" },
    { x: 4, y: 5, fill: "#f5f5f2" },
    { x: 5, y: 5, fill: "#f5f5f2" },
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
        rx={size * 0.22}
        fill="#252526"
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
