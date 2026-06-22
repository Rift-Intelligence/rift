"use client";

import React from "react";

/**
 * Live number with the reference site's value-change motion:
 *   - the digit rolls (`digitUp` / `digitDown`) in the direction of change
 *   - the text flashes (`flashUp` emerald / `flashDown` red) then settles
 *
 * Drop-in for any ticking metric (usage counters, live stats, prices):
 *   <AnimatedNumber value={requestsUsed} />
 */
export default function AnimatedNumber({
  value,
  format = (n) => n.toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const prev = React.useRef(value);
  const [dir, setDir] = React.useState<"up" | "down" | null>(null);

  React.useEffect(() => {
    if (value === prev.current) return;
    setDir(value > prev.current ? "up" : "down");
    prev.current = value;
    const t = setTimeout(() => setDir(null), 900);
    return () => clearTimeout(t);
  }, [value]);

  return (
    <span
      // re-key on direction so the animation restarts each change
      key={`${value}-${dir}`}
      className={`inline-block tabular-nums ${
        dir === "up"
          ? "digit-up flash-up"
          : dir === "down"
            ? "digit-down flash-down"
            : ""
      } ${className ?? ""}`}
    >
      {format(value)}
    </span>
  );
}
