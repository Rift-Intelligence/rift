"use client";

import { Radar, Bug, Network, BookOpen, type LucideIcon } from "lucide-react";
import { useInputApi } from "@/app/contexts/InputContext";

type Starter = {
  icon: LucideIcon;
  title: string;
  desc: string;
  prompt: string;
};

const STARTERS: Starter[] = [
  {
    icon: Radar,
    title: "Recon a target",
    desc: "Subdomains, live hosts, tech stack",
    prompt:
      "Do recon on example.com — enumerate subdomains, find live hosts and open ports, and fingerprint the tech stack. Keep it fast.",
  },
  {
    icon: Bug,
    title: "Find web vulns",
    desc: "Nuclei + fuzzing on a scoped host",
    prompt:
      "Scan https://example.com for web vulnerabilities — run nuclei templates and light fuzzing on scoped paths, then report findings with severity.",
  },
  {
    icon: Network,
    title: "Scan a network",
    desc: "Port & service discovery on a CIDR",
    prompt:
      "Scan 10.0.0.0/24 for open ports and running services, then summarize the live hosts and anything interesting.",
  },
  {
    icon: BookOpen,
    title: "Explain a CVE",
    desc: "Impact and how to test for it",
    prompt:
      "Explain CVE-2024-3094 — its impact, affected versions, and how I'd test a host for it.",
  },
];

/** Empty-chat starter — landing aesthetic: pixel kicker, Montserrat headline
 *  with an orange accent, and snulja-style operation cards that pre-fill the
 *  prompt on click. */
export const HackingSuggestions = () => {
  const { setInput } = useInputApi();

  return (
    <div className="w-full">
      <div className="mb-7 flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 font-pixel text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-[#ff6309]" />
          Autonomous offensive security
        </span>
        <h1 className="mt-5 font-montserrat text-[1.9rem] font-semibold tracking-tight text-foreground sm:text-[2.4rem]">
          What&apos;s the <span className="text-[#ff6309]">target</span>?
        </h1>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {STARTERS.map(({ icon: Icon, title, desc, prompt }) => (
          <button
            key={title}
            type="button"
            onClick={() => setInput(prompt)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4 text-left transition-colors hover:border-[#ff6309]/50 hover:bg-card"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-[#ff6309] transition-colors group-hover:border-[#ff6309]/50">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <div className="font-montserrat text-[14px] font-semibold text-foreground">
                {title}
              </div>
              <div className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                {desc}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
