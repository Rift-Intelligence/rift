"use client";

import { useEffect, useState } from "react";

/**
 * EyeThinkingConsole — the "the agent is alive and working" filler.
 *
 * Shown in place of the old three-dot spinner while a turn is submitted /
 * streaming but no assistant content has arrived yet (durable task spinning up,
 * sandbox booting, model reasoning before first token). Instead of staring at
 * dots, the user watches EYE "wake up": staged boot lines resolve one by one,
 * and a live cogitation ticker cycles thoughts under a blinking cursor.
 *
 * Purely presentational — it fills the dead air before the real reasoning/tool
 * stream takes over. Respects prefers-reduced-motion.
 */

const BOOT_STEPS = [
  "establishing optical link",
  "provisioning isolated sandbox",
  "mounting offensive toolkit",
  "calibrating target surface",
  "spinning up reasoning core",
];

const THOUGHTS = [
  "parsing the request",
  "mapping the attack surface",
  "recalling prior findings",
  "selecting an approach",
  "weighing tool options",
  "planning the first move",
  "checking scope boundaries",
  "correlating signals",
];

const HEX = "0123456789abcdef";
function pseudoHex(seed: number, len: number): string {
  // deterministic-ish hex (no Math.random — stable across renders)
  let out = "";
  let x = seed * 2654435761;
  for (let i = 0; i < len; i++) {
    x = (x ^ (x << 13)) >>> 0;
    out += HEX[(x >>> (i % 8)) & 15];
  }
  return out;
}

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function EyeThinkingConsole() {
  // Computed once on mount; a value (not a ref) so it's safe to read in render.
  const [reduce] = useState(prefersReduced);
  // When reduced-motion is on, start with boot already fully resolved.
  const [step, setStep] = useState(reduce ? BOOT_STEPS.length : 0);
  const [thought, setThought] = useState(0);
  const [tick, setTick] = useState(0);

  // Resolve boot steps one by one (~520ms each), then hold on the last.
  useEffect(() => {
    if (reduce || step >= BOOT_STEPS.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), 520);
    return () => clearTimeout(t);
  }, [step, reduce]);

  // Cycle the live thought once boot has resolved.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(
      () => setThought((n) => (n + 1) % THOUGHTS.length),
      1900,
    );
    return () => clearInterval(t);
  }, [reduce]);

  // Drive the cursor/heartbeat readout.
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTick((n) => (n + 1) % 1000), 240);
    return () => clearInterval(t);
  }, [reduce]);

  const bootDone = step >= BOOT_STEPS.length;

  return (
    <div
      className="hud scanlines w-full max-w-[520px] overflow-hidden bg-surface/60 font-mono"
      role="status"
      aria-label="EYE is working"
    >
      <span className="hud-corners" aria-hidden />
      {/* title bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="hud-label flex items-center gap-1.5">
          <span className="inline-block size-1.5 rounded-full bg-primary eye-live" />
          EYE // THINKING
        </span>
        <span className="hud-label text-primary/70">
          0x{pseudoHex(tick + step * 7, 6)}
        </span>
      </div>

      {/* boot log */}
      <div className="space-y-0.5 px-3 py-2.5 text-[12px] leading-relaxed">
        {BOOT_STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step && !bootDone;
          if (i > step) return null;
          return (
            <div
              key={label}
              className={`flex items-center gap-2 ${
                done ? "text-muted-foreground" : "text-foreground"
              }`}
            >
              <span className={done ? "text-primary" : "text-primary/80"}>
                {done ? "[ok]" : active ? "[··]" : "[  ]"}
              </span>
              <span className="text-muted-foreground">{label}</span>
              {done && (
                <span className="ml-auto text-[10px] text-primary/40">
                  {pseudoHex(i * 31 + 5, 4)}ms
                </span>
              )}
            </div>
          );
        })}

        {/* live cogitation line */}
        {bootDone && (
          <div className="mt-1.5 flex items-center gap-2 text-foreground">
            <span className="text-primary">&gt;</span>
            <span className="text-eye-glow text-primary">
              {THOUGHTS[thought]}
            </span>
            <span
              className={`ml-0.5 inline-block h-3.5 w-[7px] translate-y-[1px] bg-primary ${
                tick % 2 === 0 ? "opacity-100" : "opacity-0"
              }`}
              aria-hidden
            />
          </div>
        )}
      </div>
    </div>
  );
}
