"use client";

import { useEffect, useRef } from "react";

/**
 * RiftBackdrop — the ambient "something is watching" background for the whole app.
 *
 * A fixed, full-viewport canvas that renders a giant surveillance RIFT behind all
 * content:
 *   - a genuine 3D iris: a rotating point-sphere (fibonacci distribution),
 *     perspective-projected, depth-shaded cyan — no Three.js dependency.
 *   - an almond dot-matrix sclera framing it.
 *   - a dark pupil void at the core.
 *   - cursor parallax (the orb leans toward the pointer) + a slow autorotate.
 *
 * Kept deliberately dim + vignetted so foreground text stays readable. Replaces
 * the old zauth conic-glow/wavy backdrop. Respects prefers-reduced-motion.
 */

const SPHERE_POINTS = 2600;

// Precompute a fibonacci sphere (unit radius) once at module scope.
const SPHERE: Array<[number, number, number]> = (() => {
  const pts: Array<[number, number, number]> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < SPHERE_POINTS; i++) {
    const y = 1 - (i / (SPHERE_POINTS - 1)) * 2; // 1 → -1
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts.push([Math.cos(theta) * r, y, Math.sin(theta) * r]);
  }
  return pts;
})();

export function RiftBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const rot = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const reduce =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0;
    let t0 = 0;

    const onMove = (e: PointerEvent) => {
      mouse.current = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };
    };
    window.addEventListener("pointermove", onMove);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      cv.width = Math.floor(window.innerWidth * dpr);
      cv.height = Math.floor(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      if (!t0) t0 = t;
      const elapsed = (t - t0) / 1000;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const cx = W / 2;
      const cy = H * 0.46;
      ctx.clearRect(0, 0, W, H);

      // eye size relative to viewport
      const eyeR = Math.min(W, H) * 0.46;
      const irisR = eyeR * 0.54;

      // target rotation: slow autorotate + lean toward cursor
      const targetY =
        (mouse.current.x - 0.5) * 0.9 + (reduce ? 0 : elapsed * 0.18);
      const targetX = (mouse.current.y - 0.5) * 0.5;
      rot.current.y += (targetY - rot.current.y) * 0.06;
      rot.current.x += (targetX - rot.current.x) * 0.06;
      const sy = Math.sin(rot.current.y),
        cyr = Math.cos(rot.current.y);
      const sx = Math.sin(rot.current.x),
        cxr = Math.cos(rot.current.x);

      // ---- sclera almond: faint dot field bounded by an ellipse ----
      const aW = eyeR * 1.95; // almond half-width
      const aH = eyeR * 0.92; // almond half-height
      const pitch = 11;
      ctx.fillStyle = "rgba(34,224,255,0.6)";
      for (let yy = -aH; yy <= aH; yy += pitch) {
        for (let xx = -aW; xx <= aW; xx += pitch) {
          const inAlmond = (xx * xx) / (aW * aW) + (yy * yy) / (aH * aH);
          if (inAlmond > 1) continue;
          // carve out the iris area (drawn separately as the 3D orb)
          if (xx * xx + yy * yy < irisR * irisR * 1.12) continue;
          // edge falloff
          const a = 0.55 * (1 - inAlmond * 0.7);
          ctx.globalAlpha = a;
          ctx.fillRect(cx + xx, cy + yy, 2, 2);
        }
      }
      ctx.globalAlpha = 1;

      // ---- 3D iris orb: rotating point sphere ----
      for (let i = 0; i < SPHERE.length; i++) {
        const [px, py, pz] = SPHERE[i];
        // rotate Y then X
        let x = px * cyr + pz * sy;
        let z = -px * sy + pz * cyr;
        let y = py * cxr - z * sx;
        z = py * sx + z * cxr;
        // perspective
        const persp = 1 / (1.8 - z * 0.6);
        const sxp = cx + x * irisR * persp;
        const syp = cy + y * irisR * persp;
        // depth shade: front points bright cyan, back dim
        const depth = (z + 1) / 2; // 0 back → 1 front
        // pupil void: skip points near the projected center & facing front
        const dc = Math.hypot(sxp - cx, syp - cy);
        if (dc < irisR * 0.34 && depth > 0.5) continue;
        const alpha = 0.32 + depth * 0.68;
        const size = 1.4 + depth * 2.2;
        ctx.fillStyle =
          depth > 0.8
            ? `rgba(200,250,255,${alpha})`
            : `rgba(34,224,255,${alpha})`;
        ctx.fillRect(sxp, syp, size, size);
      }

      // ---- pupil core glow ring ----
      ctx.beginPath();
      ctx.arc(cx, cy, irisR * 0.34, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(34,224,255,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // Don't burn the main thread animating a 2600-point canvas while the tab is
    // hidden — pause the RAF loop on visibilitychange and resume when visible.
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else if (!raf) {
        t0 = 0; // reset elapsed so it doesn't jump after a long pause
        raf = requestAnimationFrame(draw);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* the 3D eye */}
      <canvas ref={ref} className="absolute inset-0 h-full w-full opacity-95" />
      {/* dot-matrix texture overlay */}
      <div className="dot-matrix absolute inset-0 opacity-25" />
      {/* scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)",
        }}
      />
      {/* gentle vignette — keeps edges dark + foreground readable without
          hiding the eye */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(135% 100% at 50% 44%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.72) 100%)",
        }}
      />
    </div>
  );
}
