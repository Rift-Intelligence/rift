"use client";

import { useEffect, useState } from "react";

/**
 * BiosStatusBar — RIFT OS bottom readout.
 *
 * A thin BIOS/CRT status strip pinned to the bottom of the workstation, in the
 * spirit of a classified terminal footer: secure-mode flag, crypto stack, link
 * state, and a live clock/date. Pure black, phosphor mono, hairline top rule.
 */
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function BiosStatusBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // First paint via rAF (not a synchronous in-effect setState), then tick.
    const raf = requestAnimationFrame(() => setNow(new Date()));
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(t);
    };
  }, []);

  const clock = now
    ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
    : "--:--:--";
  const date = now
    ? `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`
    : "--------";

  return (
    <div className="relative z-20 hidden h-[22px] shrink-0 select-none items-center gap-4 border-t border-terminal-border bg-black px-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:flex">
      <span className="flex items-center gap-1.5 text-primary">
        <span className="inline-block size-1.5 rounded-full bg-primary eye-live" />
        [ secure mode: on ]
      </span>
      <span className="text-terminal-border">│</span>
      <span>
        encryption: <span className="text-foreground/70">aes-256</span>
      </span>
      <span className="hidden md:inline">
        hash: <span className="text-foreground/70">sha-512</span>
      </span>
      <span className="hidden lg:inline">
        link: <span className="text-primary/80">encrypted</span>
      </span>
      <span className="hidden lg:inline">
        protocol: <span className="text-foreground/70">riftnet/3.0</span>
      </span>
      <span className="ml-auto flex items-center gap-3 tabular-nums">
        <span className="text-foreground/70">{clock}</span>
        <span className="text-terminal-border">│</span>
        <span>{date}</span>
      </span>
    </div>
  );
}
