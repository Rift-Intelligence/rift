"use client";

import React from "react";

/**
 * Original dotted RIFT wordmark.
 *
 * Rebuilds the reference site's dot-matrix wordmark *system* (not its art):
 *   - 1-unit grid, one square "pixel" per lit cell
 *   - dot size 0.64, centered in its cell (offset 0.18)
 *   - dots stagger in via the `dotReveal` keyframe
 * The glyph bitmaps below are an original 5×7 pixel font for R-I-F-T.
 */

const DOT = 0.64;
const OFFSET = (1 - DOT) / 2; // 0.18 — matches the reference's centering

// 5 wide × 7 tall pixel glyphs (1 = lit cell)
const GLYPHS: Record<string, number[][]> = {
  R: [
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 0],
    [1, 0, 1, 0, 0],
    [1, 0, 0, 1, 0],
    [1, 0, 0, 0, 1],
  ],
  I: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  F: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
  ],
  T: [
    [1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
  E: [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1],
  ],
  Y: [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
    [0, 0, 1, 0, 0],
  ],
};

const GLYPH_W = 5;
const GLYPH_H = 7;
const GAP = 1; // empty column between glyphs

interface DottedWordmarkProps {
  word?: string;
  className?: string;
  /** resting opacity ceiling for the reveal (reference uses 0.55 for bg, ~1 for logo) */
  fill?: string;
  /** disable the staggered reveal (e.g. for a static header logo) */
  animate?: boolean;
  title?: string;
}

export default function DottedWordmark({
  word = "EYE",
  className,
  fill = "#e8edeb",
  animate = true,
  title = "EYE",
}: DottedWordmarkProps) {
  const letters = word.toUpperCase().split("");
  const cols = letters.length * GLYPH_W + (letters.length - 1) * GAP;
  const dots: React.ReactNode[] = [];

  let originX = 0;
  let revealIndex = 0;
  letters.forEach((ch) => {
    const glyph = GLYPHS[ch];
    if (glyph) {
      for (let r = 0; r < GLYPH_H; r++) {
        for (let c = 0; c < GLYPH_W; c++) {
          if (glyph[r][c]) {
            // stagger by visual position (left→right, top→bottom)
            const delay = ((originX + c) * 0.018 + r * 0.01).toFixed(3);
            dots.push(
              <rect
                key={`${originX}-${r}-${c}`}
                x={originX + c + OFFSET}
                y={r + OFFSET}
                width={DOT}
                height={DOT}
                fill={fill}
                style={
                  animate
                    ? {
                        opacity: 0,
                        animation: `dotReveal 0.5s ease-out ${delay}s forwards`,
                      }
                    : undefined
                }
              />,
            );
            revealIndex++;
          }
        }
      }
    }
    originX += GLYPH_W + GAP;
  });

  return (
    <svg
      viewBox={`0 0 ${cols} ${GLYPH_H}`}
      className={className}
      role="img"
      aria-label={title}
      data-dots={revealIndex}
    >
      {dots}
    </svg>
  );
}
