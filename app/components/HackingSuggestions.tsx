"use client";

import { useState } from "react";

// Two-part headlines: a roman (sans) lead-in + a serif-italic emphasis,
// mirroring the zauth.inc "Security for the / agentic internet." treatment.
const HEADLINES: { lead: string; emphasis: string }[] = [
  { lead: "What should we", emphasis: "hack today?" },
  { lead: "What's our", emphasis: "target today?" },
  { lead: "Ready to find", emphasis: "some vulns?" },
  { lead: "Where do we", emphasis: "start?" },
  { lead: "What's on the", emphasis: "scope today?" },
  { lead: "What are we", emphasis: "exploiting?" },
];

export const HackingSuggestions = () => {
  const [headline] = useState(
    () => HEADLINES[Math.floor(Math.random() * HEADLINES.length)],
  );

  return (
    <div className="relative mb-8 flex flex-col items-center px-4 text-center">
      {/* Display headline: sans roman lead + serif-italic emphasis */}
      <h1 className="text-balance text-4xl font-normal leading-[1.04] tracking-tight text-foreground sm:text-5xl md:text-6xl">
        <span className="block">{headline.lead}</span>
        <span className="display-emphasis block">{headline.emphasis}</span>
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
        Point RIFT at a target. It handles recon, exploitation, and reporting on
        its own — every run isolated in its own sandbox.
      </p>
    </div>
  );
};
