"use client";

import { useEffect, useRef, useState } from "react";

/**
 * EyeMascot — an 8-bit pixel creature with one big, living eye.
 *
 * Claude-Code-terminal-banner energy, but EYE-themed: a chunky cyan pixel body
 * (antenna + frame + little feet) wrapped around a large central eye whose iris
 * smoothly tracks the cursor and blinks on a natural cadence. Rendered as SVG so
 * it stays crisp and scales by a single `cell` size. Respects reduced-motion.
 */

// 1 = lit pixel. The hollow center (0s in the middle band) is the eye window.
const BODY: number[][] = [
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0],
];

export function EyeMascot({ cell = 12 }: { cell?: number }) {
  const cols = BODY[0].length;
  const rows = BODY.length;
  const W = cols * cell;
  const H = rows * cell;

  // eye window center (cols 2..9, rows 4..7) → center ≈ (6, 6) in cells
  const eyeCX = 6 * cell;
  const eyeCY = 6 * cell;
  const eyeRX = 3.4 * cell;
  const eyeRY = 2.0 * cell;
  const irisR = 1.5 * cell;

  const ref = useRef<SVGSVGElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [closed, setClosed] = useState(false);
  const targetRef = useRef({ x: 0, y: 0 });
  const reduceRef = useRef(false);

  useEffect(() => {
    reduceRef.current =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (reduceRef.current) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, dist / 320);
      targetRef.current = {
        x: (dx / dist) * (eyeRX - irisR) * k,
        y: (dy / dist) * (eyeRY - irisR) * k,
      };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [eyeRX, eyeRY, irisR]);

  useEffect(() => {
    if (reduceRef.current) return;
    let raf = 0;
    const tick = () => {
      setPupil((p) => ({
        x: p.x + (targetRef.current.x - p.x) * 0.16,
        y: p.y + (targetRef.current.y - p.y) * 0.16,
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (reduceRef.current) return;
    let to: ReturnType<typeof setTimeout>;
    const loop = () => {
      to = setTimeout(
        () => {
          setClosed(true);
          setTimeout(() => setClosed(false), 150);
          loop();
        },
        2400 + Math.random() * 3600,
      );
    };
    loop();
    return () => clearTimeout(to);
  }, []);

  return (
    <svg
      ref={ref}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="EYE"
      className="select-none"
    >
      {/* 8-bit body pixels */}
      {BODY.flatMap((row, r) =>
        row.map((v, c) =>
          v ? (
            <rect
              key={`${r}-${c}`}
              x={c * cell}
              y={r * cell}
              width={cell}
              height={cell}
              fill="#22e0ff"
              opacity={0.92}
            />
          ) : null,
        ),
      )}

      {/* eye window backdrop */}
      <rect
        x={2 * cell}
        y={4 * cell}
        width={8 * cell}
        height={4 * cell}
        fill="#02080a"
      />

      {/* the big living eye */}
      {!closed ? (
        <g>
          {/* sclera glow */}
          <ellipse
            cx={eyeCX}
            cy={eyeCY}
            rx={eyeRX}
            ry={eyeRY}
            fill="rgba(34,224,255,0.10)"
          />
          {/* iris + pupil track the cursor */}
          <g
            style={{
              transform: `translate(${pupil.x}px, ${pupil.y}px)`,
              transition: "transform 40ms linear",
            }}
          >
            <circle cx={eyeCX} cy={eyeCY} r={irisR} fill="#0e9fc4" />
            <circle
              cx={eyeCX}
              cy={eyeCY}
              r={irisR}
              fill="none"
              stroke="#6df4ff"
              strokeWidth={Math.max(1, cell * 0.18)}
            />
            <circle cx={eyeCX} cy={eyeCY} r={irisR * 0.42} fill="#02080a" />
            <rect
              x={eyeCX + irisR * 0.2}
              y={eyeCY - irisR * 0.55}
              width={cell * 0.5}
              height={cell * 0.5}
              fill="#c8faff"
            />
          </g>
        </g>
      ) : (
        /* blink: a bright pixel lid line */
        <rect
          x={2.4 * cell}
          y={eyeCY - cell * 0.25}
          width={7.2 * cell}
          height={cell * 0.5}
          fill="#22e0ff"
        />
      )}
    </svg>
  );
}
