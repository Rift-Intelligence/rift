"use client";

import { useEffect, useState } from "react";
import { AsciiEye } from "./eye/AsciiEye";

// Surveillance-cold two-part headlines: roman lead-in + serif-italic emphasis.
const HEADLINES: { lead: string; emphasis: string }[] = [
  { lead: "What should we", emphasis: "compromise?" },
  { lead: "What's our", emphasis: "target today?" },
  { lead: "Point the eye at", emphasis: "something." },
  { lead: "Where do we", emphasis: "start looking?" },
  { lead: "What's on the", emphasis: "scope today?" },
  { lead: "What are we", emphasis: "exploiting?" },
];

export const HackingSuggestions = () => {
  const [headline] = useState(
    () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
  );
  const [locked, setLocked] = useState(false);

  // First cursor move "acquires the subject" — flips the target-lock label on.
  useEffect(() => {
    const onMove = () => setLocked(true);
    window.addEventListener("pointermove", onMove, { once: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div className="relative mb-8 flex flex-col items-center px-4 text-center">
      {/* The EYE — blinking ASCII canvas inside a HUD scope frame */}
      <div className="hud scanlines relative mb-5 w-full max-w-[520px] overflow-hidden bg-transparent">
        <span className="hud-corners" aria-hidden />
        {/* top status strip */}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="hud-label">EYE // OPTICAL CORE</span>
          <span className="hud-label flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-primary eye-live" />
            {locked ? "SUBJECT 01 LOCKED" : "ACQUIRING…"}
          </span>
        </div>
        <AsciiEye className="eye-glitch-in block h-[17vh] max-h-[160px] min-h-[112px] w-full" />
        {/* bottom readout */}
        <div className="flex items-center justify-between px-3 py-1">
          <span className="hud-label">LAT —— LON ——</span>
          <span className="hud-label text-primary">● ONLINE</span>
        </div>
      </div>

      {/* Display headline: roman lead + serif-italic emphasis */}
      <h1 className="text-balance text-3xl font-normal leading-[1.04] tracking-tight text-foreground sm:text-4xl md:text-5xl">
        <span className="block">{headline.lead}</span>
        <span className="display-emphasis block">{headline.emphasis}</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        Point <span className="text-foreground">EYE</span> at a target. It runs
        recon, exploitation, and reporting on its own — every operation isolated
        in its own sandbox. It was watching before you got here.
      </p>
    </div>
  );
};
