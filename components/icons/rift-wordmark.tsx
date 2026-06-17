import type { FC } from "react";

/** Pixel RIFT wordmark — matches public/brand/rift-x-header.svg */

const LETTER_W = 5;
const GAP = 2;
const ROWS = 7;

const GLYPHS: Record<string, Array<[number, number]>> = {
  R: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [0, 1],
    [4, 1],
    [0, 2],
    [4, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [0, 4],
    [2, 4],
    [0, 5],
    [3, 5],
    [0, 6],
    [4, 6],
  ],
  I: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [0, 6],
    [1, 6],
    [2, 6],
    [3, 6],
    [4, 6],
  ],
  F: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [3, 3],
    [0, 4],
    [0, 5],
    [0, 6],
  ],
  T: [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [2, 5],
    [2, 6],
  ],
};

const WORD_COLS = "RIFT".length * LETTER_W + ("RIFT".length - 1) * GAP;

function buildRects(word: string) {
  const letters = word.toUpperCase().split("");
  let originX = 0;
  const rects: Array<[number, number]> = [];

  for (const ch of letters) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      for (const [c, r] of glyph) {
        rects.push([originX + c, r]);
      }
    }
    originX += LETTER_W + GAP;
  }

  return rects;
}

export interface RiftWordmarkProps {
  /** Pixel height of the RIFT letters (excludes tagline). */
  height?: number;
  className?: string;
  fill?: string;
  showTagline?: boolean;
  tagline?: string;
  taglineClassName?: string;
  title?: string;
}

export const RiftWordmark: FC<RiftWordmarkProps> = ({
  height = 14,
  className,
  fill = "#f5f5f2",
  showTagline = false,
  tagline = "autonomous offensive intelligence",
  taglineClassName,
  title = "RIFT",
}) => {
  const cell = height / ROWS;
  const width = WORD_COLS * cell;
  const rects = buildRects("RIFT");

  if (!showTagline) {
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${WORD_COLS} ${ROWS}`}
        shapeRendering="crispEdges"
        className={className}
        role="img"
        aria-label={title}
      >
        {rects.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
        ))}
      </svg>
    );
  }

  const taglineSize = Math.max(8, Math.round(height * 0.55));
  const taglineGap = Math.max(4, Math.round(height * 0.35));

  return (
    <div
      className={`inline-flex flex-col items-center ${className ?? ""}`}
      role="img"
      aria-label={title}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${WORD_COLS} ${ROWS}`}
        shapeRendering="crispEdges"
        aria-hidden
      >
        {rects.map(([x, y], i) => (
          <rect key={i} x={x} y={y} width={1} height={1} fill={fill} />
        ))}
      </svg>
      <span
        className={
          taglineClassName ??
          "font-mono lowercase tracking-normal text-[#858585]"
        }
        style={{ fontSize: taglineSize, marginTop: taglineGap }}
      >
        {tagline}
      </span>
    </div>
  );
};
