"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, ChevronDown } from "lucide-react";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { LandingHeader } from "./LandingHeader";
import { TerminalLive } from "./TerminalLive";
import { AskVsAgent } from "./AskVsAgent";
import { AnimatedCounter } from "./AnimatedCounter";
import { Reveal } from "./Reveal";
import { WeightyHeading } from "./WeightyHeading";
import { DotField } from "./DotField";
import { navigateToAuth } from "@/app/hooks/useTauri";

/**
 * air.dev-inspired shell: cool near-black blue-gray (#26282c) with a single
 * cyan signal (#00d3f5) and teal secondary, cyan glow gradients as the
 * signature visual, JetBrains Mono body + a geometric display face for
 * headings. Forced so the marketing page reads the same regardless of the
 * visitor's app theme.
 */
const SHELL: React.CSSProperties = {
  ["--background" as string]: "#26282c",
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "#a3a8b0",
  ["--card" as string]: "#1e2023",
  ["--popover" as string]: "#1e2023",
  ["--border" as string]: "rgba(255,255,255,0.10)",
  ["--surface-1" as string]: "#1f2124",
  ["--surface-2" as string]: "#2c2e33",
  ["--signal" as string]: "#00d3f5",
  ["--primary" as string]: "#00d3f5",
};

// riftsys.app type system: Montserrat for body + headings, Pixelify for the
// brand wordmark / kicker labels / numerals, JetBrains Mono only for code
// (terminals, log output) — never for prose.
const DISPLAY = "font-display"; // Space Grotesk — techy geometric, legible (clear i/l), variable weight
const MONO = "font-mono";
const PIXEL = "font-mono"; // eyebrows/labels — kept clean mono (air.dev)
const PIXNUM = "font-pixel"; // numerals only — pixel, like the original deployment

/* ─────────────────────────── content ─────────────────────────── */

const BENEFITS = [
  {
    title: "One agent, three jobs",
    desc: "Build software, create images, or run security tests — no context-switching between tools.",
  },
  {
    title: "Full oversight",
    desc: "Every command and result streams live. You see exactly what the agent does, step by step.",
  },
  {
    title: "Isolated sandbox",
    desc: "Each run lives in a disposable cloud container. Nothing touches your machine.",
  },
  {
    title: "Yours to keep",
    desc: "Export the code, download the images, save the report. The output is always yours.",
  },
];

const FAQ = [
  {
    q: "What is RIFT?",
    a: "A professional AI agent that builds software, creates images, and runs security tests — all from a single conversation, in an isolated cloud sandbox.",
  },
  {
    q: "How is it different from a chatbot?",
    a: "A chatbot answers. RIFT's Agent mode runs the real tools — writing and running code, rendering images, testing systems — and hands back finished work, not just instructions.",
  },
  {
    q: "What can it build?",
    a: "Full-stack web apps and browser games, with a live preview as it works. When it's done, you can keep editing in the chat, download the code, or deploy it.",
  },
  {
    q: "Is my work private?",
    a: "Yes. Every session is scoped to you alone, runs in a disposable container, and we don't train on your projects.",
  },
  {
    q: "What does it cost?",
    a: "Free gives you 10 questions a day plus one full agent run each month. Pro ($39/mo) and Max ($129/mo) add a monthly pool of credits the agent spends as it works.",
  },
  {
    q: "Do I need to install anything?",
    a: "No. RIFT runs in your browser, with an optional desktop app for Mac and Windows.",
  },
];

const STATS = [
  { value: 3, prefix: "", suffix: "-in-1", label: "Build · Create · Secure" },
  { value: 60, prefix: "<", suffix: "s", label: "To first result" },
  { value: 100, prefix: "", suffix: "%", label: "Runs in a sandbox" },
  { value: 40, prefix: "", suffix: "+", label: "Tools orchestrated" },
] as const;

type Plan = {
  name: string;
  price: string;
  cadence: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "$0",
    cadence: "forever",
    blurb: "Try every capability — no card required.",
    features: [
      "10 questions a day",
      "1 full agent run each month",
      "Build, Create & Secure",
      "Isolated cloud sandbox",
    ],
    cta: "Start for free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$39",
    cadence: "/ month",
    blurb: "For makers who ship every week.",
    features: [
      "Everything in Free",
      "500,000 credits every month",
      "All models & capabilities",
      "Unlimited chats & projects",
      "Priority sandboxes",
    ],
    cta: "Go Pro",
    highlight: true,
    badge: "Most popular",
  },
  {
    name: "Max",
    price: "$129",
    cadence: "/ month",
    blurb: "For power users and small teams.",
    features: [
      "Everything in Pro",
      "1,800,000 credits every month",
      "Personal API keys",
      "Highest limits & priority",
      "Early access to new tools",
    ],
    cta: "Go Max",
    highlight: false,
  },
];

/* ─────────────────────────── primitives ─────────────────────────── */

function CyanButton({
  children,
  onClick,
  variant = "solid",
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "solid" | "ghost";
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[13.5px] font-medium transition-all ${
        variant === "solid"
          ? "bg-[#00d3f5] text-[#0a0e10] shadow-[0_0_40px_-6px_rgba(0,211,245,0.6)] hover:bg-[#5fe6ff] hover:shadow-[0_0_50px_-4px_rgba(0,211,245,0.75)]"
          : "border border-white/15 text-foreground hover:border-[#00d3f5]/60 hover:text-[#00d3f5]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/** Browser/app chrome frame — holds the live demo and capability mocks. */
function WindowFrame({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-white/10 bg-[#1b1e23] shadow-[0_50px_140px_-50px_rgba(0,178,214,0.45)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className="size-2.5 rounded-full bg-white/20" />
        <span className={`ml-3 text-[11px] text-white/40 ${MONO}`}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/** Mock: real AI-generated images for the "Create" capability. */
function CreateMock() {
  return (
    <div className="flex gap-2 p-2.5">
      <div className="relative aspect-[3/4] w-1/2 overflow-hidden rounded-md">
        <Image
          src="/images/showcase/anime-warrior.png"
          alt="AI-generated anime samurai warrior, highest quality"
          fill
          sizes="(max-width: 1024px) 45vw, 280px"
          className="object-cover"
        />
      </div>
      <div className="flex w-1/2 flex-col gap-2">
        <div className="relative aspect-square overflow-hidden rounded-md">
          <Image
            src="/images/showcase/product-headphone.png"
            alt="AI-generated product photograph"
            fill
            sizes="(max-width: 1024px) 45vw, 280px"
            className="object-cover"
          />
        </div>
        <div className="relative aspect-square overflow-hidden rounded-md">
          <Image
            src="/images/showcase/concept-cyberpunk.png"
            alt="AI-generated cinematic concept art"
            fill
            sizes="(max-width: 1024px) 45vw, 280px"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
}

/** Mock: security report summary for the "Secure" capability. */
function SecureMock() {
  const rows = [
    { sev: "CRITICAL", color: "#f0613a", text: "Outdated TLS on api endpoint" },
    { sev: "HIGH", color: "#e3a53d", text: "Exposed config directory" },
    { sev: "MEDIUM", color: "#00d3f5", text: "Missing security headers" },
    { sev: "LOW", color: "#2fb489", text: "Verbose server banner" },
  ];
  return (
    <div className={`p-4 ${MONO}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[10.5px] text-white/65">report.md</span>
        <span className="rounded bg-[#2fb489]/15 px-2 py-0.5 text-[10px] text-[#2fb489]">
          ✓ 4 findings
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((r) => (
          <div
            key={r.sev}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5"
          >
            <span
              className="w-[68px] shrink-0 rounded px-1.5 py-0.5 text-center text-[9px] font-semibold"
              style={{ color: r.color, background: `${r.color}1f` }}
            >
              {r.sev}
            </span>
            <span className="text-[10.5px] text-white/65">{r.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── page ─────────────────────────── */

const CAPABILITIES = [
  {
    tag: "Secure",
    title: "run the whole hack.",
    desc: "Point it at a target you own and it runs the full offensive playbook — recon, exploitation, and a clean report.",
    points: [
      "Recon, exploit, report",
      "Real offensive tooling",
      "Authorized targets only",
    ],
    visual: (
      <WindowFrame title="rift — pentest">
        <SecureMock />
      </WindowFrame>
    ),
  },
  {
    tag: "Build",
    title: "build the app.",
    desc: "Describe a web app or a game. RIFT writes the code, runs it live, and hands you real files to ship.",
    points: [
      "Full-stack apps & games",
      "Live preview as it builds",
      "Download or deploy",
    ],
    visual: <TerminalLive />,
  },
  {
    tag: "Create",
    title: "generate the image.",
    desc: "Prompt it and RIFT renders finished visuals in seconds — then edits and iterates, in any top image model.",
    points: [
      "Text-to-image in seconds",
      "Edit and iterate",
      "Every major image model",
    ],
    visual: (
      <WindowFrame title="rift — create">
        <CreateMock />
      </WindowFrame>
    ),
  },
] as const;

export function LandingPage() {
  const launch = () =>
    navigateToAuth("/signup", { preferSignInForReturningUser: true });
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  React.useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === "#team-pricing-seat-selection") {
        navigateToAuth("/signup?intent=pricing", {
          preferSignInForReturningUser: true,
        });
      }
    };
    checkHash();
    window.addEventListener("hashchange", checkHash);
    return () => window.removeEventListener("hashchange", checkHash);
  }, []);

  return (
    <div
      style={SHELL}
      className={`min-h-full bg-background text-foreground ${MONO}`}
    >
      <LandingHeader />

      {/* ═══════════════ HERO (dark gray · cyan glow) ═══════════════ */}
      <section className="relative overflow-hidden">
        <div className="rift-motion pointer-events-none absolute inset-x-0 top-0 h-[560px] animate-[rift-glow-pulse_9s_ease-in-out_infinite] bg-[radial-gradient(circle_at_50%_-10%,rgba(0,178,214,0.35),transparent_60%)]" />
        <div className="rift-motion pointer-events-none absolute left-1/2 top-40 h-[420px] w-[520px] -translate-x-1/2 animate-[rift-blob-drift_11s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(0,178,214,0.14),transparent_70%)] blur-2xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00d3f5]/40 to-transparent" />
        <DotField
          cols={34}
          rows={9}
          gap={32}
          radius={2}
          color="rgba(0,213,255,0.3)"
          className="rift-motion pointer-events-none absolute left-1/2 top-20 h-[300px] w-[min(1160px,94vw)] -translate-x-1/2 animate-[rift-twinkle_7s_ease-in-out_infinite] [mask-image:radial-gradient(ellipse_60%_75%_at_50%_40%,black,transparent_75%)]"
        />
        <div className="relative mx-auto max-w-5xl px-5 pb-14 pt-20 text-center sm:px-6 sm:pt-28">
          <Reveal delay={60}>
            <p
              className={`text-[11px] uppercase tracking-[0.28em] text-[#00d3f5] ${MONO}`}
            >
              RIFT
            </p>
          </Reveal>

          <Reveal delay={140}>
            <WeightyHeading
              as="h1"
              min={340}
              max={700}
              className={`mx-auto mt-4 max-w-2xl text-balance lowercase leading-[0.98] tracking-tight text-[2.1rem] sm:text-[2.9rem] ${DISPLAY}`}
            >
              the agent that <span className="text-[#00d3f5]">breaks in.</span>
            </WeightyHeading>
          </Reveal>

          <Reveal delay={220}>
            <p className="mx-auto mt-5 max-w-lg text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
              Point RIFT at a target. It runs recon, hunts vulnerabilities, and
              writes the report — autonomously, inside an isolated cloud
              sandbox.
            </p>
          </Reveal>

          <Reveal delay={300}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <CyanButton onClick={launch}>Start for free</CyanButton>
              <CyanButton
                variant="ghost"
                onClick={() => scrollTo("capabilities")}
              >
                See what it does
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </CyanButton>
            </div>
            <p className="mt-4 text-[11.5px] text-white/40">
              No credit card · in your browser or as a desktop app
            </p>
          </Reveal>

          {/* hero product visual */}
          <Reveal delay={380} className="relative mx-auto mt-14 max-w-3xl">
            <div className="pointer-events-none absolute -inset-8 bg-[radial-gradient(ellipse_60%_60%_at_50%_40%,rgba(0,178,214,0.22),transparent_70%)]" />
            <div className="relative">
              <TerminalLive />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ PENTEST LIVE BAND (vivid cyan) — the hero act ═══════════════ */}
      <section id="how" className="relative scroll-mt-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#00b2d6_0%,#0a7f9c_42%,#1b1c1f_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_25%,rgba(180,240,255,0.35),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Reveal>
              <p
                className={`text-[11.5px] uppercase tracking-[0.22em] text-[#04222b]/80 ${PIXEL}`}
              >
                a real pentest, start to finish
              </p>
              <WeightyHeading
                as="h2"
                className={`mt-3 text-[2rem] lowercase leading-[0.95] tracking-tight text-[#04222b] sm:text-[2.9rem] ${DISPLAY}`}
              >
                watch it hack, live.
              </WeightyHeading>
              <p className="mx-auto mt-4 max-w-lg text-[13.5px] leading-relaxed text-[#04222b]/75">
                An unedited run: RIFT maps the target, finds and exploits the
                vulnerabilities, then writes the report — every step streamed so
                you see exactly what it does.
              </p>
            </Reveal>
          </div>
          <Reveal delay={120} className="mx-auto max-w-4xl">
            <WindowFrame title="rift — pentest">
              <video
                className="block w-full"
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                poster="/videos/rift-demo-poster.jpg"
                aria-label="A real RIFT penetration test, run end to end"
              >
                <source src="/videos/rift-demo.mp4" type="video/mp4" />
              </video>
            </WindowFrame>
            <p
              className={`mt-5 text-center text-[11px] uppercase tracking-[0.24em] text-[#04222b]/65 ${MONO}`}
            >
              recon · exploit · report
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ BENEFITS (deep band) ═══════════════ */}
      <section className="relative bg-gradient-to-b from-background to-[#1b1c1f] pt-10">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6 sm:py-20">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ title, desc }, i) => (
              <Reveal
                key={title}
                delay={i * 70}
                className="flex flex-col bg-[#1e2023] p-6"
              >
                <span
                  className={`text-[15px] leading-none tabular-nums text-[#00d3f5] ${PIXNUM}`}
                >
                  0{i + 1}
                </span>
                <h3 className={`mt-4 text-[16px] lowercase ${DISPLAY}`}>
                  {title}
                </h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CAPABILITIES (complete loop) ═══════════════ */}
      <section
        id="capabilities"
        className="scroll-mt-16 bg-[#1b1c1f] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11.5px] uppercase tracking-[0.2em] text-[#00d3f5] font-mono">
              What RIFT can do
            </p>
            <WeightyHeading
              as="h2"
              className={`mt-4 text-[2rem] lowercase leading-[0.95] tracking-tight sm:text-[2.75rem] ${DISPLAY}`}
            >
              three capabilities,{" "}
              <span className="text-muted-foreground">one conversation.</span>
            </WeightyHeading>
            <p className="mx-auto mt-4 max-w-lg text-[14px] leading-relaxed text-muted-foreground">
              Switch between building software, creating visuals, and running
              security tests — without leaving the chat.
            </p>
          </Reveal>

          <div className="mt-16 flex flex-col gap-20 sm:gap-28">
            {CAPABILITIES.map(({ tag, title, desc, points, visual }, i) => {
              const flip = i % 2 === 1;
              return (
                <div
                  key={tag}
                  className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14"
                >
                  <Reveal
                    direction={flip ? "right" : "left"}
                    className={flip ? "lg:order-2" : ""}
                  >
                    <div
                      className={`flex items-center gap-3 text-[11px] uppercase tracking-[0.24em] ${MONO}`}
                    >
                      <span
                        className={`text-[16px] leading-none tabular-nums text-white/35 ${PIXNUM}`}
                      >
                        0{i + 1}
                      </span>
                      <span className="text-[#00d3f5]">{tag}</span>
                    </div>
                    <h3
                      className={`mt-5 text-[1.7rem] lowercase leading-[1.02] tracking-tight sm:text-[2.1rem] ${DISPLAY}`}
                    >
                      {title}
                    </h3>
                    <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                      {desc}
                    </p>
                    <ul className="mt-6 flex flex-col gap-2.5">
                      {points.map((p) => (
                        <li
                          key={p}
                          className="flex items-start gap-3 text-[13px] text-foreground/75"
                        >
                          <span className="mt-[7px] size-1 shrink-0 rounded-full bg-[#00d3f5]/70" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </Reveal>

                  <Reveal
                    direction={flip ? "left" : "right"}
                    delay={100}
                    className={`relative ${flip ? "lg:order-1" : ""}`}
                  >
                    <div className="pointer-events-none absolute -inset-6 bg-[radial-gradient(circle_at_50%_50%,rgba(0,178,214,0.18),transparent_70%)]" />
                    <div className="relative">{visual}</div>
                  </Reveal>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ MODELS + SURFACES ═══════════════ */}
      <section className="border-t border-white/10 bg-[#1b1c1f] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-5 text-center sm:px-6">
          <Reveal>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] text-[#00d3f5] ${PIXEL}`}
            >
              any model · anywhere
            </p>
            <WeightyHeading
              as="h2"
              className={`mt-4 text-[1.8rem] lowercase leading-[0.95] tracking-tight sm:text-[2.4rem] ${DISPLAY}`}
            >
              every major model.{" "}
              <span className="text-muted-foreground">every surface.</span>
            </WeightyHeading>
            <p className="mx-auto mt-4 max-w-lg text-[13.5px] leading-relaxed text-muted-foreground">
              Pick the model that fits the job — RIFT drives them all. Work in
              your browser, the desktop app, or straight from the CLI.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
              {[
                "Claude",
                "GPT-5",
                "Gemini",
                "Grok",
                "DeepSeek",
                "Kimi",
                "Llama",
              ].map((m) => (
                <span
                  key={m}
                  className={`rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[12px] text-white/70 ${MONO}`}
                >
                  {m}
                </span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={160}>
            <div
              className={`mt-6 inline-flex items-center gap-3 rounded-full border border-[#00d3f5]/25 bg-[#00d3f5]/[0.06] px-4 py-2 text-[12px] text-white/70 ${MONO}`}
            >
              <span>
                <span className="text-[#00d3f5]">$</span> npm i -g rift
              </span>
              <span className="text-white/25">·</span>
              <span>browser</span>
              <span className="text-white/25">·</span>
              <span>desktop</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ STATS (deep band) ═══════════════ */}
      <section className="border-y border-white/10 bg-[#1b1c1f]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-12 text-center ${i > 0 ? "border-l border-white/10" : ""} ${
                i >= 2 ? "border-t border-white/10 sm:border-t-0" : ""
              } ${i === 2 ? "border-l-0 sm:border-l" : ""}`}
            >
              <div
                className={`text-[2.4rem] text-[#00d3f5] sm:text-[3rem] ${PIXNUM}`}
              >
                <AnimatedCounter
                  value={s.value}
                  prefix={s.prefix}
                  suffix={s.suffix}
                  duration={1600 + i * 140}
                />
              </div>
              <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════ ASK vs AGENT ═══════════════ */}
      <section id="modes" className="scroll-mt-16 bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-[11.5px] uppercase tracking-[0.2em] text-[#00d3f5] font-mono">
              Two ways to work
            </p>
            <WeightyHeading
              as="h2"
              className={`mt-4 text-[2rem] lowercase leading-[0.95] tracking-tight sm:text-[2.75rem] ${DISPLAY}`}
            >
              ask tells you.{" "}
              <span className="text-[#00d3f5]">agent does it.</span>
            </WeightyHeading>
            <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-relaxed text-muted-foreground">
              Ask answers and plans. Agent runs the whole job — the autonomous
              work your credits pay for.
            </p>
          </Reveal>
          <Reveal delay={120} className="mt-12">
            <AskVsAgent />
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ PRICING (deep band) ═══════════════ */}
      <section
        id="pricing"
        className="scroll-mt-16 border-t border-white/10 bg-[#1b1c1f] py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal className="text-center">
            <p className="text-[11.5px] uppercase tracking-[0.2em] text-[#00d3f5] font-mono">
              Pricing
            </p>
            <WeightyHeading
              as="h2"
              className={`mx-auto mt-4 max-w-2xl text-[2rem] lowercase leading-[0.95] tracking-tight sm:text-[2.75rem] ${DISPLAY}`}
            >
              start free.{" "}
              <span className="text-[#00d3f5]">upgrade when you ship.</span>
            </WeightyHeading>
            <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-muted-foreground">
              Every plan unlocks all three capabilities. Paid plans add a
              monthly pool of credits the agent spends as it works — bigger jobs
              use more, small ones use less.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {PLANS.map((plan, i) => (
              <Reveal
                key={plan.name}
                delay={i * 90}
                className={`relative flex flex-col rounded-2xl border p-7 ${
                  plan.highlight
                    ? "border-[#00d3f5]/50 bg-[#00d3f5]/[0.05] shadow-[0_0_90px_-30px_rgba(0,211,245,0.7)]"
                    : "border-white/10 bg-[#1e2023]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-7 rounded-full bg-[#00d3f5] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0a0e10]">
                    {plan.badge}
                  </span>
                )}
                <h3
                  className={`text-[14px] font-semibold uppercase tracking-[0.14em] ${DISPLAY}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className={`text-[3rem] leading-none ${PIXNUM}`}>
                    {plan.price}
                  </span>
                  <span className="text-[12.5px] text-muted-foreground">
                    {plan.cadence}
                  </span>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                  {plan.blurb}
                </p>
                <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2.5 text-[13px] text-foreground/85"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-[#00d3f5]" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={launch}
                  className={`mt-7 inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[13px] font-medium transition-all ${
                    plan.highlight
                      ? "bg-[#00d3f5] text-[#0a0e10] shadow-[0_0_40px_-8px_rgba(0,211,245,0.7)] hover:bg-[#5fe6ff]"
                      : "border border-white/15 text-foreground hover:border-[#00d3f5]/60 hover:text-[#00d3f5]"
                  }`}
                >
                  {plan.cta}
                </button>
              </Reveal>
            ))}
          </div>

          <Reveal delay={120}>
            <p className="mx-auto mt-8 max-w-2xl text-center text-[12.5px] leading-relaxed text-muted-foreground">
              Need more mid-month? Top up with one-time credits from{" "}
              <span className="text-foreground">$10</span> — they never expire.
              See the full breakdown on the{" "}
              <Link href="/pricing" className="text-[#00d3f5] hover:underline">
                pricing page
              </Link>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-5 sm:px-6">
          <Reveal className="text-center">
            <p className="text-[11.5px] uppercase tracking-[0.2em] text-[#00d3f5] font-mono">
              FAQ
            </p>
            <WeightyHeading
              as="h2"
              className={`mt-4 text-[2rem] lowercase leading-[0.95] tracking-tight sm:text-[2.5rem] ${DISPLAY}`}
            >
              questions, answered.
            </WeightyHeading>
          </Reveal>
          <div className="mt-10 flex flex-col gap-3">
            {FAQ.map(({ q, a }, i) => (
              <Reveal key={q} delay={i * 50}>
                <details className="group rounded-xl border border-white/10 bg-[#1e2023] px-5 py-4 transition-colors open:border-[#00d3f5]/30 hover:border-white/20">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                    <span className={`text-[15px] font-medium ${DISPLAY}`}>
                      {q}
                    </span>
                    <ChevronDown className="size-4 shrink-0 text-[#00d3f5] transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-[13.5px] leading-relaxed text-muted-foreground">
                    {a}
                  </p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CLOSING CTA (cyan glow + dot finale) ═══════════════ */}
      <section className="relative overflow-hidden border-t border-white/10 py-24 sm:py-32">
        <div className="rift-motion pointer-events-none absolute inset-0 animate-[rift-glow-pulse_10s_ease-in-out_infinite] bg-[radial-gradient(ellipse_55%_85%_at_50%_60%,rgba(0,178,214,0.28),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <Reveal>
            <WeightyHeading
              as="h2"
              min={340}
              max={700}
              className={`lowercase leading-[0.95] tracking-tight text-[2.75rem] sm:text-[4rem] ${DISPLAY}`}
            >
              start building with <span className="text-[#00d3f5]">rift.</span>
            </WeightyHeading>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mt-6 max-w-md text-[14.5px] leading-relaxed text-muted-foreground">
              Point RIFT at your next app, image, or security test and let the
              agent do the work. No setup, no install — just results.
            </p>
            <div className="mt-9 flex justify-center">
              <CyanButton onClick={launch}>Start for free</CyanButton>
            </div>
          </Reveal>
        </div>

        {/* full-width growing-dot field — the closing "field" (air.dev signature) */}
        <DotField
          cols={48}
          rows={9}
          gap={34}
          radius={2.4}
          color="rgba(0,213,255,0.4)"
          className="pointer-events-none absolute inset-x-0 bottom-0 left-1/2 h-[240px] w-screen max-w-none -translate-x-1/2 [mask-image:radial-gradient(ellipse_70%_120%_at_50%_100%,black,transparent_75%)]"
        />
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="border-t border-white/10 bg-[#1b1e23] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 sm:px-6">
          <div className="flex items-center gap-6">
            <a
              href="https://x.com/rift_sys"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="RIFT on X"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://github.com/cettocdx/rift"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="RIFT on GitHub"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .322.216.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
              </svg>
            </a>
          </div>

          <div className="flex w-full flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-2">
              <RiftWordmark height={13} className="text-foreground" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                · The professional AI agent
              </span>
            </div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
              {"  ·  "}
              <Link href="/refund-policy" className="hover:text-foreground">
                Refund
              </Link>
              {"  ·  "}
              <Link href="/terms-of-service" className="hover:text-foreground">
                Terms
              </Link>
              {"  ·  "}
              <Link href="/privacy-policy" className="hover:text-foreground">
                Privacy
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
