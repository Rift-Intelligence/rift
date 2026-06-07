"use client";

import React from "react";

/**
 * zauth-grade atmosphere backdrop.
 *
 * Three stacked, pointer-events-none layers reproducing the reference's
 * landing atmosphere (original implementation):
 *   1. cool-white CONIC GLOW sweeping from the top-left, brightened in via `lightOn`
 *   2. a faint DOT-MATRIX field (tiled radial-gradient) revealed via `dotReveal`,
 *      with a handful of `ztrace` blinking "trace" dots
 *   3. a bottom LINEAR FADE melting content into the canvas
 *
 * Designed to sit at z-0 inside a `#1d1d1d` container.
 */

// fixed (deterministic) positions for the blinking trace dots — % coords
const TRACE_DOTS: Array<{ x: number; y: number; d: number }> = [
  { x: 12, y: 22, d: 0 },
  { x: 27, y: 64, d: 1.4 },
  { x: 41, y: 18, d: 3.1 },
  { x: 58, y: 48, d: 2.2 },
  { x: 69, y: 30, d: 4.6 },
  { x: 78, y: 70, d: 0.8 },
  { x: 88, y: 40, d: 3.7 },
  { x: 34, y: 82, d: 5.2 },
  { x: 52, y: 12, d: 1.9 },
  { x: 19, y: 50, d: 2.7 },
  { x: 63, y: 86, d: 4.1 },
  { x: 83, y: 16, d: 5.8 },
];

export default function ZauthBackdrop({ className }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
      aria-hidden="true"
    >
      {/* 1. conic glow, top-left sweep (+ a soft beam to read the direction) */}
      <div
        className="animate-light-on absolute inset-0"
        style={{
          backgroundImage:
            "conic-gradient(from 130deg at 15% -5%, rgba(0,0,0,0) 0deg, rgba(180,200,255,0.07) 14deg, rgba(255,255,255,0.12) 30deg, rgba(180,200,255,0.07) 52deg, rgba(0,0,0,0) 72deg, rgba(0,0,0,0) 360deg)",
        }}
      />
      <div
        className="animate-light-on absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 22% -8%, rgba(255,255,255,0.10), rgba(255,255,255,0) 60%)",
        }}
      />

      {/* 2a. dot-matrix field — tiled radial grid, masked to fade toward edges */}
      <div
        className="animate-fade-in-up absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, rgba(244,244,245,0.09) 1px, transparent 1.4px)",
          backgroundSize: "27px 27px",
          opacity: 0.5,
          maskImage:
            "radial-gradient(120% 90% at 50% 8%, #000 0%, rgba(0,0,0,0.6) 45%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(120% 90% at 50% 8%, #000 0%, rgba(0,0,0,0.6) 45%, transparent 80%)",
        }}
      />

      {/* 2b. blinking trace dots */}
      {TRACE_DOTS.map((dot, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: 3,
            height: 3,
            backgroundColor: "#34d399",
            opacity: 0.12,
            animation: `ztrace 6s ease-in-out ${dot.d}s infinite`,
          }}
        />
      ))}

      {/* 3. bottom fade into the canvas */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40"
        style={{
          backgroundImage: "linear-gradient(rgba(29,29,29,0), rgb(29,29,29))",
        }}
      />
    </div>
  );
}
