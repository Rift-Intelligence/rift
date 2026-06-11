"use client";

import { useEffect, useState } from "react";
import { EyeMascot } from "./eye/EyeMascot";

// Boot lines that type out when a session opens — terminal cold-start feel.
const BOOT = [
  { t: "eye --init", cmd: true },
  { t: "[ok] optical core .......... online" },
  { t: "[ok] cloud sandbox ......... provisioned" },
  { t: "[ok] secure link .......... established" },
  { t: "[ok] arsenal .............. loaded" },
];

const PROMPTS = [
  "what's the target?",
  "where do we start?",
  "what are we compromising today?",
  "point me at something.",
];

export const HackingSuggestions = () => {
  const [prompt] = useState(
    () => PROMPTS[Math.floor(Math.random() * PROMPTS.length)],
  );
  // When reduced-motion is on, skip the type-out and show the full boot at once.
  const [shown, setShown] = useState(() =>
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
      ? BOOT.length
      : 0,
  );

  // Reveal boot lines one by one.
  useEffect(() => {
    if (shown >= BOOT.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), 260);
    return () => clearTimeout(t);
  }, [shown]);

  const bootDone = shown >= BOOT.length;

  return (
    <div className="relative mx-auto mb-6 flex w-full max-w-[680px] flex-col items-center px-4">
      <h1 className="sr-only">New RIFT session</h1>
      <div className="flex items-center gap-5">
        {/* 8-bit living eye */}
        <EyeMascot cell={11} />

        {/* boot log */}
        <div className="text-left font-mono text-[12.5px] leading-relaxed">
          {BOOT.slice(0, shown).map((line, i) => (
            <div
              key={i}
              className={line.cmd ? "text-foreground" : "text-muted-foreground"}
            >
              {line.cmd && <span className="text-primary">$ </span>}
              {!line.cmd && (
                <span className="text-primary">{line.t.slice(0, 4)}</span>
              )}
              {line.cmd ? line.t : line.t.slice(4)}
            </div>
          ))}
          {bootDone && (
            <div className="mt-1 flex items-center text-foreground">
              <span className="text-primary">rift@root</span>
              <span className="text-muted-foreground">:~$</span>
              <span className="ml-2 text-muted-foreground">{prompt}</span>
              <span className="terminal-cursor ml-1 inline-block !h-3.5 !w-1.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
