"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Radar,
  Bug,
  FileText,
  Scan,
  Lock,
  Eye,
  Check,
} from "lucide-react";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { LandingHeader } from "./LandingHeader";
import { TerminalLive } from "./TerminalLive";
import { AttackSurfaceCanvas } from "./AttackSurfaceCanvas";
import { AnimatedCounter } from "./AnimatedCounter";
import { Reveal } from "./Reveal";
import { navigateToAuth } from "@/app/hooks/useTauri";
import { TOKEN_PACKAGES } from "@/lib/billing/token-packages";

/**
 * snulja-faithful shell: neutral near-black (#1C1C1C), a vivid orange signal
 * (#FF6309), pixel display face for the brand + accents, Montserrat for copy.
 * Forced so the marketing page reads the same regardless of app theme.
 */
const SHELL: React.CSSProperties = {
  ["--background" as string]: "#1c1c1c",
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "#a1a1a1",
  ["--card" as string]: "#232323",
  ["--popover" as string]: "#232323",
  ["--border" as string]: "#3a3a3a",
  ["--surface-1" as string]: "#202020",
  ["--surface-2" as string]: "#262626",
  ["--signal" as string]: "#ff6309",
  ["--primary" as string]: "#ff6309",
};

const PIXEL = "font-pixel";
const MONT = "font-montserrat";

const TOOLS = [
  "subfinder",
  "httpx",
  "nuclei",
  "nmap",
  "ffuf",
  "sqlmap",
  "amass",
  "katana",
  "naabu",
  "dalfox",
];

const PIPELINE = [
  {
    icon: Radar,
    n: "01",
    title: "Recon",
    desc: "Subdomains, live hosts, ports, and tech fingerprints — the full attack surface, mapped in minutes.",
  },
  {
    icon: Bug,
    n: "02",
    title: "Exploit",
    desc: "Targeted nuclei templates, fuzzing, and chained attacks — only ever on the hosts you scope.",
  },
  {
    icon: FileText,
    n: "03",
    title: "Report",
    desc: "Findings with severity, proof, and remediation — structured and ready to hand to your client.",
  },
  {
    icon: Scan,
    n: "04",
    title: "Ask",
    desc: "CVE breakdowns, payload ideas, and methodology — a second opinion, with no execution.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the target",
    desc: "Paste a domain, an IP range, or just say what you need. RIFT scopes the operation with you.",
  },
  {
    n: "02",
    title: "The agent runs the tools",
    desc: "Real pentest tooling fires in an isolated cloud sandbox — and you watch every step live.",
  },
  {
    n: "03",
    title: "Read the report",
    desc: "Structured findings with evidence, CVSS context, and clear fixes — written while you watched.",
  },
];

const PILLARS = [
  {
    icon: Lock,
    title: "Sandboxed",
    desc: "Every run lives in a disposable cloud container. Nothing touches your machine; nothing persists.",
  },
  {
    icon: Radar,
    title: "Scoped",
    desc: "RIFT only ever reaches the targets you authorize. Boundaries are enforced, never assumed.",
  },
  {
    icon: Eye,
    title: "Auditable",
    desc: "Every command and response is logged — replay the whole operation, step by step.",
  },
];

const STATS = [
  { value: 40, prefix: "", suffix: "+", label: "Offensive tools" },
  { value: 12400, prefix: "", suffix: "+", label: "Hosts mapped" },
  { value: 847, prefix: "", suffix: "+", label: "Vulns surfaced" },
  { value: 3, prefix: "<", suffix: " min", label: "Avg. recon" },
] as const;

/** Compact token label for the pricing cards (200K, 1.1M…). */
function fmtTokens(n: number): string {
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${m % 1 === 0 ? m : m.toFixed(1)}M`;
  }
  return `${Math.round(n / 1000)}K`;
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground ${PIXEL}`}
    >
      <span className="size-1.5 rounded-full bg-[#ff6309]" />
      {children}
    </span>
  );
}

/** Crosshair "+" marks at a block's corners (snulja modular grid). */
function Corners() {
  const m =
    "pointer-events-none absolute z-10 font-mono text-[13px] leading-none text-[#ff6309]/70 select-none";
  return (
    <div aria-hidden>
      <span className={`${m} -left-[6px] -top-[7px]`}>+</span>
      <span className={`${m} -right-[6px] -top-[7px]`}>+</span>
      <span className={`${m} -bottom-[5px] -left-[6px]`}>+</span>
      <span className={`${m} -bottom-[5px] -right-[6px]`}>+</span>
    </div>
  );
}

function PillButton({
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
      className={`group inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] transition-colors ${MONT} ${
        variant === "solid"
          ? "bg-[#ff6309] text-[#1c1c1c] hover:bg-[#ff7e28]"
          : "border border-white/20 text-foreground hover:border-[#ff6309] hover:text-[#ff6309]"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

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
      className={`min-h-full bg-background text-foreground ${MONT}`}
    >
      <LandingHeader />

      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_-2%,rgba(255,99,9,0.16),transparent_70%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6309]/30 to-transparent" />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-16 text-center sm:px-6 sm:pt-24">
          <Reveal>
            <Kicker>AI · Offensive security · 2026</Kicker>
          </Reveal>

          <Reveal delay={100}>
            <h1
              className={`mt-8 leading-[0.82] text-[#ff6309] ${PIXEL}`}
              style={{ fontSize: "clamp(4.5rem, 17vw, 11rem)" }}
            >
              RIFT
            </h1>
          </Reveal>

          <Reveal delay={180}>
            <p
              className={`mx-auto mt-4 max-w-md text-[15px] uppercase tracking-[0.05em] text-foreground/90 sm:text-[16px] ${PIXEL}`}
            >
              The agent that breaks in.
            </p>
          </Reveal>

          <Reveal delay={240}>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-[16px]">
              Point RIFT at a target. It runs recon, hunts vulnerabilities, and
              writes the report — autonomously, inside an isolated cloud
              sandbox.
            </p>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <PillButton onClick={launch}>Start for free</PillButton>
              <PillButton variant="ghost" onClick={() => scrollTo("how")}>
                See how it works
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </PillButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── LIVE TERMINAL — orange stage (device showcase) ─────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#ff6309_0%,#e0560f_42%,#1c1c1c_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_30%,rgba(255,180,120,0.35),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Reveal>
              <p
                className={`text-[11px] uppercase tracking-[0.22em] text-[#1c1c1c]/70 ${PIXEL}`}
              >
                Watch it work
              </p>
              <h2
                className={`mt-3 text-[2rem] font-semibold leading-[1.05] tracking-tight text-[#1c1c1c] sm:text-[2.9rem] ${MONT}`}
              >
                A real session, running live.
              </h2>
            </Reveal>
          </div>
          <Reveal delay={120} className="mx-auto max-w-3xl">
            <TerminalLive />
          </Reveal>
        </div>
      </section>

      {/* ─────────── TOOLS STRIP ─────────── */}
      <section className="border-b border-border bg-surface-1">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 py-5 sm:px-6">
          <span
            className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
          >
            Real tooling
          </span>
          {TOOLS.map((t) => (
            <span
              key={t}
              className="font-mono text-[11px] text-muted-foreground/70"
            >
              {t}
              <span className="ml-3 text-border">/</span>
            </span>
          ))}
        </div>
      </section>

      {/* ─────────── PIPELINE (crosshair cards) ─────────── */}
      <section id="features" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
            >
              Full offensive pipeline
            </p>
            <h2
              className={`mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] ${MONT}`}
            >
              From footprint to final report —{" "}
              <span className="text-[#ff6309]">one conversation.</span>
            </h2>
          </Reveal>

          <div className="mt-12 grid border border-border sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map(({ icon: Icon, n, title, desc }, i) => (
              <Reveal
                key={title}
                delay={i * 80}
                className={`group relative p-7 transition-colors hover:bg-white/[0.02] ${
                  i % 2 === 1
                    ? "border-t border-border sm:border-l sm:border-t-0"
                    : ""
                } ${i >= 2 ? "border-t border-border lg:border-t-0 lg:border-l" : ""} ${
                  i === 1 ? "lg:border-l" : ""
                } ${i === 3 ? "sm:border-l" : ""}`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-md border border-border text-[#ff6309]">
                    <Icon className="size-5" />
                  </span>
                  <span
                    className={`text-[15px] text-muted-foreground/50 ${PIXEL}`}
                  >
                    {n}
                  </span>
                </div>
                <h3 className={`text-[19px] font-semibold ${MONT}`}>{title}</h3>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── STAT BAND ─────────── */}
      <section className="border-y border-border bg-surface-1">
        <div className="mx-auto grid max-w-6xl grid-cols-2 sm:grid-cols-4">
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`px-5 py-12 text-center ${i > 0 ? "border-l border-border" : ""} ${
                i >= 2 ? "border-t border-border sm:border-t-0" : ""
              } ${i === 2 ? "border-l-0 sm:border-l" : ""}`}
            >
              <div
                className={`text-[2.5rem] text-[#ff6309] sm:text-[3.25rem] ${PIXEL}`}
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

      {/* ─────────── LIVE ATTACK SURFACE ─────────── */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <Reveal>
              <p
                className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
              >
                Live attack surface
              </p>
              <h2
                className={`mt-4 text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] ${MONT}`}
              >
                Watch the map{" "}
                <span className="text-[#ff6309]">build itself.</span>
              </h2>
            </Reveal>
          </div>
          <Reveal className="relative">
            <Corners />
            <AttackSurfaceCanvas />
          </Reveal>
        </div>
      </section>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <section
        id="how"
        className="scroll-mt-16 border-t border-border bg-surface-1 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
            >
              How it works
            </p>
            <h2
              className={`mt-4 text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] ${MONT}`}
            >
              You scope it.{" "}
              <span className="text-[#ff6309]">RIFT executes.</span>
            </h2>
          </Reveal>
          <div className="mt-14 grid gap-12 sm:grid-cols-3 sm:gap-8">
            {STEPS.map(({ n, title, desc }, i) => (
              <Reveal key={n} delay={i * 100}>
                <div
                  className={`text-[3rem] leading-none text-[#ff6309] ${PIXEL}`}
                >
                  {n}
                </div>
                <h3 className={`mt-5 text-[19px] font-semibold ${MONT}`}>
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── SECURITY (crosshair cards) ─────────── */}
      <section id="security" className="scroll-mt-16 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
            >
              Isolated by design
            </p>
            <h2
              className={`mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] ${MONT}`}
            >
              Aggressive on targets.{" "}
              <span className="text-[#ff6309]">Safe by default.</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid border border-border sm:grid-cols-3">
            {PILLARS.map(({ icon: Icon, title, desc }, i) => (
              <Reveal
                key={title}
                delay={i * 80}
                className={`p-7 ${i > 0 ? "border-t border-border sm:border-l sm:border-t-0" : ""}`}
              >
                <span className="flex size-10 items-center justify-center rounded-md border border-border text-[#ff6309]">
                  <Icon className="size-5" />
                </span>
                <h3 className={`mt-5 text-[19px] font-semibold ${MONT}`}>
                  {title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── PRICING ─────────── */}
      <section
        id="pricing"
        className="scroll-mt-16 border-t border-border bg-surface-1 py-20 sm:py-28"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-6">
          <Reveal>
            <p
              className={`text-[11px] uppercase tracking-[0.2em] text-[#ff6309] ${PIXEL}`}
            >
              Pricing
            </p>
            <h2
              className={`mt-4 max-w-2xl text-[2rem] font-semibold leading-[1.1] tracking-tight sm:text-[2.75rem] ${MONT}`}
            >
              Pay as you go.{" "}
              <span className="text-[#ff6309]">No subscriptions.</span>
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
              Start free with 10 messages a day. Need more, top up with tokens —
              they never expire, and you only pay for what the agent actually
              runs.
            </p>
          </Reveal>

          {/* Free tier */}
          <Reveal className="mt-12 flex flex-col gap-5 rounded-2xl border border-[#ff6309]/40 bg-[#ff6309]/[0.06] p-7 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-[2rem] leading-none text-[#ff6309] ${PIXEL}`}
                >
                  FREE
                </span>
                <span className="rounded-full border border-border px-3 py-1 text-[12px] text-muted-foreground">
                  10 messages / day
                </span>
              </div>
              <p className="mt-3 max-w-md text-[14px] leading-relaxed text-muted-foreground">
                Full Ask + Agent access in an isolated cloud sandbox. No credit
                card, no install.
              </p>
            </div>
            <button
              type="button"
              onClick={launch}
              className={`shrink-0 rounded-full bg-[#ff6309] px-6 py-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#1c1c1c] transition-colors hover:bg-[#ff7e28] ${MONT}`}
            >
              Start for free
            </button>
          </Reveal>

          {/* Token packages */}
          <p
            className={`mt-10 text-[11px] uppercase tracking-[0.2em] text-muted-foreground ${PIXEL}`}
          >
            Token top-ups
          </p>
          <div className="mt-5 grid border border-border sm:grid-cols-2 lg:grid-cols-4">
            {TOKEN_PACKAGES.map((p, i) => (
              <Reveal
                key={p.id}
                delay={i * 80}
                className={`group relative flex flex-col p-7 transition-colors hover:bg-white/[0.02] ${
                  i % 2 === 1
                    ? "border-t border-border sm:border-l sm:border-t-0"
                    : ""
                } ${i >= 2 ? "border-t border-border lg:border-t-0 lg:border-l" : ""} ${
                  i === 1 ? "lg:border-l" : ""
                } ${i === 3 ? "sm:border-l" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-[16px] font-semibold ${MONT}`}>
                    {p.name}
                  </h3>
                  {p.bonusPct > 0 ? (
                    <span className="rounded-full bg-[#ff6309]/15 px-2 py-0.5 text-[11px] font-medium text-[#ff6309]">
                      +{p.bonusPct}%
                    </span>
                  ) : null}
                </div>
                <div
                  className={`mt-4 text-[2.75rem] leading-none text-foreground ${PIXEL}`}
                >
                  ${p.priceUsd}
                </div>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span
                    className={`text-[1.5rem] leading-none text-[#ff6309] ${PIXEL}`}
                  >
                    {fmtTokens(p.totalTokens)}
                  </span>
                  <span className="text-[12px] text-muted-foreground">
                    tokens
                  </span>
                </div>
                <p className="mt-2 text-[12px] text-muted-foreground/70">
                  {p.totalTokens.toLocaleString()} tokens
                  {p.bonusPct > 0
                    ? ` · incl. ${p.bonusTokens.toLocaleString()} bonus`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={launch}
                  className={`mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-foreground transition-colors hover:border-[#ff6309] hover:text-[#ff6309] ${MONT}`}
                >
                  <Check className="size-3.5" />
                  Buy tokens
                </button>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-muted-foreground/70">
            1 token ≈ $0.0001 of usage. Tokens burn as the agent runs; larger
            top-ups include bonus tokens at no extra cost.
          </p>
        </div>
      </section>

      {/* ─────────── CLOSING CTA ─────────── */}
      <section className="relative overflow-hidden border-t border-border py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_80%_at_50%_50%,rgba(255,99,9,0.18),transparent_65%)]" />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-6">
          <Reveal>
            <h2
              className={`leading-[0.85] text-[#ff6309] ${PIXEL}`}
              style={{ fontSize: "clamp(3rem, 9vw, 6rem)" }}
            >
              Start now
            </h2>
          </Reveal>
          <Reveal delay={80}>
            <p className="mx-auto mt-6 max-w-md text-[16px] leading-relaxed text-muted-foreground">
              Launch RIFT, point it at a target, and let the agent work. No
              setup, no install — just results.
            </p>
            <div className="mt-9 flex justify-center">
              <PillButton onClick={launch}>Start for free</PillButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 text-center sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <RiftWordmark height={13} className="text-foreground" />
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              · Offensive security agent
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
            <Link href="/terms-of-service" className="hover:text-foreground">
              Terms
            </Link>
            {"  ·  "}
            <Link href="/privacy-policy" className="hover:text-foreground">
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
