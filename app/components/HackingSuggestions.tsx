"use client";

import { useState } from "react";

// Surveillance-cold two-part headlines: roman lead-in + terminal emphasis.
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

  return (
    <div className="relative mb-8 flex flex-col items-center px-4 text-center">
      {/* The mascot EYE now lives in the terminal titlebar above; here we keep
          just the prompt + a terminal-style boot line. */}
      <div className="hud-label mb-4 text-primary/70">
        {"eye@root:~$ session --new"}
      </div>

      {/* Display headline */}
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
