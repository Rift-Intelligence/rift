"use client";

import { useEffect, useState } from "react";

/**
 * RiftThinkingConsole — minimal, neutral "working" indicator.
 *
 * Shown in place of the old three-dot spinner while a turn is submitted /
 * streaming but no assistant content has arrived yet. Deliberately NEUTRAL: it
 * makes no claims about what the agent is doing (no fake "mounting offensive
 * toolkit" boot steps), so it reads sensibly for any message — a plain "hello"
 * included. The real reasoning/tool stream takes over the moment it arrives.
 */

const STATES = ["thinking", "reading your message", "composing a response"];

export function RiftThinkingConsole() {
  const [reduce] = useState(
    () =>
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [i, setI] = useState(0);
  const [blink, setBlink] = useState(true);

  // advance the status line slowly
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setI((n) => (n + 1) % STATES.length), 1600);
    return () => clearInterval(t);
  }, [reduce]);

  // cursor blink
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setBlink((b) => !b), 480);
    return () => clearInterval(t);
  }, [reduce]);

  return (
    <div
      className="inline-flex items-center gap-2 px-1 py-1 font-mono text-sm"
      role="status"
      aria-label="RIFT is thinking"
    >
      <span className="text-primary">rift@root</span>
      <span className="text-muted-foreground">~</span>
      <span className="text-foreground/80">{STATES[i]}</span>
      <span
        className={`inline-block h-3.5 w-[7px] bg-foreground ${
          blink ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />
    </div>
  );
}
