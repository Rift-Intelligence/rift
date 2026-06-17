"use client";

import { useEffect, useState } from "react";

/** RIFT pixel panda — Claude-style grid, white & black palette. */

const MASCOT = {
  body: "#f5f5f2",
  belly: "#ebebe6",
  patch: "#161618",
} as const;

type PixelKind =
  | "body"
  | "belly"
  | "patch"
  | "eye-patch"
  | "nose"
  | "leg-l"
  | "leg-r";

const PIXELS: Array<{
  l: number;
  t: number;
  w: number;
  h: number;
  kind: PixelKind;
}> = [
  { l: 8, t: 0, w: 4, h: 4, kind: "patch" },
  { l: 20, t: 0, w: 4, h: 4, kind: "patch" },
  { l: 4, t: 4, w: 20, h: 4, kind: "body" },
  { l: 4, t: 8, w: 8, h: 4, kind: "eye-patch" },
  { l: 12, t: 8, w: 8, h: 4, kind: "body" },
  { l: 20, t: 8, w: 8, h: 4, kind: "eye-patch" },
  { l: 0, t: 12, w: 28, h: 4, kind: "body" },
  { l: 16, t: 12, w: 4, h: 4, kind: "nose" },
  { l: 4, t: 16, w: 20, h: 4, kind: "body" },
  { l: 4, t: 20, w: 20, h: 4, kind: "belly" },
  { l: 4, t: 24, w: 4, h: 6, kind: "leg-l" },
  { l: 8, t: 24, w: 4, h: 6, kind: "leg-l" },
  { l: 20, t: 24, w: 4, h: 6, kind: "leg-r" },
  { l: 24, t: 24, w: 4, h: 6, kind: "leg-r" },
];

const BASE_W = 33;
const BASE_H = 32;

function fillFor(kind: PixelKind, blink: boolean) {
  switch (kind) {
    case "eye-patch":
      return blink ? MASCOT.body : MASCOT.patch;
    case "nose":
    case "patch":
    case "leg-l":
    case "leg-r":
      return MASCOT.patch;
    case "belly":
      return MASCOT.belly;
    default:
      return MASCOT.body;
  }
}

export function RiftMascot({
  className = "",
  variant = "default",
  scale: scaleProp,
  /** @deprecated use `scale` — old API: cell 4 ≈ scale 1 */
  cell,
}: {
  className?: string;
  variant?: "default" | "hero" | "banner";
  scale?: number;
  cell?: number;
}) {
  const [blink, setBlink] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let timeout: ReturnType<typeof setTimeout>;
    const loop = () => {
      timeout = setTimeout(
        () => {
          setBlink(true);
          setTimeout(() => setBlink(false), 120);
          loop();
        },
        2800 + Math.random() * 3200,
      );
    };
    loop();
    return () => clearTimeout(timeout);
  }, [reduceMotion]);

  const scale =
    scaleProp ??
    (cell != null ? cell / 4 : undefined) ??
    (variant === "hero" ? 2.4 : variant === "banner" ? 1.55 : 1.35);

  const motionClass = reduceMotion
    ? ""
    : variant === "hero"
      ? "rift-mascot-hero"
      : variant === "banner"
        ? "rift-mascot-banner"
        : "rift-mascot-bob";

  const headroom = variant === "banner" ? 10 : variant === "hero" ? 14 : 6;

  return (
    <div
      role="img"
      aria-label="RIFT panda mascot"
      className={`rift-mascot relative shrink-0 overflow-visible ${motionClass} ${className}`}
      style={{
        width: BASE_W * scale,
        height: BASE_H * scale + headroom,
        transformOrigin: "center bottom",
      }}
    >
      <div
        className="absolute left-0 origin-bottom-left"
        style={{
          top: headroom,
          transform: `scale(${scale})`,
          width: BASE_W,
          height: BASE_H,
        }}
      >
        {PIXELS.map(({ l, t, w, h, kind }, i) => (
          <span
            key={i}
            className={`absolute ${kind === "leg-l" && !reduceMotion ? "rift-mascot-leg-l" : ""} ${
              kind === "leg-r" && !reduceMotion ? "rift-mascot-leg-r" : ""
            }`}
            style={{
              left: l,
              top: t,
              width: w,
              height: h,
              backgroundColor: fillFor(kind, blink),
            }}
          />
        ))}
      </div>
    </div>
  );
}
