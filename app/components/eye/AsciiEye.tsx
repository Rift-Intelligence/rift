"use client";

import { useEffect, useRef } from "react";

/**
 * AsciiEye — the EYE motif.
 *
 * A live <canvas> ASCII renderer. Nothing is "animated" directly: every frame
 * we compute a per-cell intensity field (almond sclera → iris ring → pupil
 * void), map intensity → character via a density ramp, and draw. Blink, cursor
 * tracking, and the eyelid-collapse fall out of that math.
 *
 * Blink: two lids travel toward the horizontal midline; the lid seam row is
 * forced to the brightest glyph so a blink reads as the bright lens collapsing
 * into a single glowing line, then snapping open. Cadence is randomized so it
 * feels alive (watching) rather than looping.
 */

const RAMP = " .·:-=co0O@";
const COLS = 116;
const ROWS = 52;

export function AsciiEye({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const pupil = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let blink = 0;
    let blinkT = -1;
    let nextBlink = performance.now() + 1600 + Math.random() * 1200;
    let pending = 0; // queued extra blinks (for occasional double-blink)

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect();
      mouse.current = {
        x: (e.clientX - r.left) / r.width,
        y: (e.clientY - r.top) / r.height,
      };
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.max(1, cv.clientWidth * dpr);
      cv.height = Math.max(1, cv.clientHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      const W = cv.clientWidth;
      const H = cv.clientHeight;
      const cw = W / COLS;
      const ch = H / ROWS;

      ctx.clearRect(0, 0, W, H);
      ctx.font = `${Math.ceil(ch)}px "JetBrains Mono", ui-monospace, monospace`;
      ctx.textBaseline = "top";

      // --- blink scheduler ---
      if (!reduce) {
        if (blinkT < 0 && t >= nextBlink) blinkT = t;
        if (blinkT >= 0) {
          const dt = t - blinkT;
          blink =
            dt < 80
              ? dt / 80
              : dt < 120
                ? 1
                : dt < 240
                  ? 1 - (dt - 120) / 120
                  : 0;
          if (dt >= 240) {
            blinkT = -1;
            if (pending > 0) {
              pending -= 1;
              nextBlink = t + 130;
            } else {
              nextBlink = t + 3000 + Math.random() * 4000;
              if (Math.random() < 0.08) pending = 1; // double-blink
            }
          }
        }
      }

      // pupil tracking — eased lag (creepier than instant)
      const tx = 0.5 + (mouse.current.x - 0.5) * 0.12;
      const ty = 0.5 + (mouse.current.y - 0.5) * 0.12;
      pupil.current.x += (tx - pupil.current.x) * (reduce ? 1 : 0.08);
      pupil.current.y += (ty - pupil.current.y) * (reduce ? 1 : 0.08);

      // Aspect-corrected screen space so the iris stays ROUND and the sclera a
      // proper almond regardless of the (wide) panel ratio. x spans roughly
      // [-aspect/2, aspect/2], y spans [-0.5, 0.5].
      const aspect = W / Math.max(1, H);
      const A = aspect * 0.46; // sclera half-width
      const B = 0.4; // sclera half-height
      const px = (pupil.current.x - 0.5) * aspect;
      const py = (pupil.current.y - 0.5) * 0.55; // pupil roams less vertically
      const lidEdge = B * (1 - blink); // lids travel toward midline
      const seamTol = (0.5 / ROWS) * 1.4;

      for (let row = 0; row < ROWS; row++) {
        const y = row / ROWS - 0.5;
        for (let col = 0; col < COLS; col++) {
          const x = (col / COLS - 0.5) * aspect;

          // almond sclera (elliptical)
          const eye = 1 - Math.hypot(x / A, y / B);
          if (eye <= 0) continue;

          // iris ring + pupil void (round in screen space)
          const dIris = Math.hypot(x - px, y - py);
          let intensity = eye * 0.5;
          if (dIris < 0.3) intensity = 1 - dIris / 0.3; // iris gradient
          if (dIris < 0.12) intensity = 0.04; // pupil void (near-dark)

          // eyelid mask: collapse toward midline; bright lash seam
          const closedAbove = y < -lidEdge;
          const closedBelow = y > lidEdge;
          const onSeam = Math.abs(Math.abs(y) - lidEdge) < seamTol;
          if ((closedAbove || closedBelow) && !onSeam) continue;
          if (onSeam && blink > 0.12) intensity = 1;

          const ci = Math.min(
            RAMP.length - 1,
            Math.max(0, Math.floor(intensity * RAMP.length)),
          );
          const glyph = RAMP[ci];
          if (glyph === " ") continue;

          // hot core highlight vs phosphor-cyan body
          ctx.fillStyle = intensity > 0.85 ? "#c8faff" : "#22e0ff";
          ctx.globalAlpha = 0.55 + intensity * 0.45;
          ctx.fillText(glyph, col * cw, row * ch);
        }
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      role="img"
      aria-label="A watching eye, rendered in ASCII"
    />
  );
}
