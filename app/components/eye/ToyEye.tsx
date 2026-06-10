"use client";

import { useEffect, useRef, useState } from "react";

/**
 * ToyEye — a small, friendly "mascot" eye (à la Claude's eye).
 *
 * A clean SVG eye: cyan iris + dark pupil that smoothly tracks the cursor,
 * with an eyelid that blinks on a natural, randomized cadence. Lives at the top
 * of the terminal chat. Respects prefers-reduced-motion (no blink, no tracking).
 */
export function ToyEye({ size = 26 }: { size?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [pupil, setPupil] = useState({ x: 0, y: 0 });
  const [closed, setClosed] = useState(false);
  const target = useRef({ x: 0, y: 0 });
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // pointer tracking → target pupil offset (clamped to a small radius)
  useEffect(() => {
    if (reduce.current) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const max = 3; // max pupil travel in viewBox units
      const k = Math.min(1, dist / 240);
      target.current = {
        x: (dx / dist) * max * k,
        y: (dy / dist) * max * k,
      };
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // ease pupil toward target
  useEffect(() => {
    if (reduce.current) return;
    let raf = 0;
    const tick = () => {
      setPupil((p) => ({
        x: p.x + (target.current.x - p.x) * 0.18,
        y: p.y + (target.current.y - p.y) * 0.18,
      }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // blink on a randomized cadence
  useEffect(() => {
    if (reduce.current) return;
    let to: ReturnType<typeof setTimeout>;
    const schedule = () => {
      to = setTimeout(
        () => {
          setClosed(true);
          setTimeout(() => setClosed(false), 130);
          schedule();
        },
        2600 + Math.random() * 3600,
      );
    };
    schedule();
    return () => clearTimeout(to);
  }, []);

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="EYE"
      className="shrink-0"
    >
      {/* outer glow */}
      <ellipse cx="16" cy="16" rx="14" ry="9.5" fill="rgba(34,224,255,0.08)" />
      {/* sclera (almond) */}
      <path
        d="M2 16 C6 9 11 6.5 16 6.5 C21 6.5 26 9 30 16 C26 23 21 25.5 16 25.5 C11 25.5 6 23 2 16 Z"
        fill="#03161b"
        stroke="#22e0ff"
        strokeWidth="1.4"
      />
      {/* iris + pupil, clipped to the sclera, hidden while blinking */}
      {!closed && (
        <g
          style={{
            transform: `translate(${pupil.x}px, ${pupil.y}px)`,
            transition: "transform 40ms linear",
          }}
        >
          <circle cx="16" cy="16" r="6.4" fill="#0e9fc4" />
          <circle
            cx="16"
            cy="16"
            r="6.4"
            fill="none"
            stroke="#6df4ff"
            strokeWidth="1"
          />
          <circle cx="16" cy="16" r="2.9" fill="#02080a" />
          {/* catchlight */}
          <circle cx="18.1" cy="13.9" r="1.1" fill="#c8faff" />
        </g>
      )}
      {/* eyelid line when closed */}
      {closed && (
        <path
          d="M3.5 16 C8 18 24 18 28.5 16"
          stroke="#22e0ff"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
