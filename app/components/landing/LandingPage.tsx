"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Shield,
  Terminal,
  FileText,
  Radar,
  Bug,
  Lock,
  Zap,
} from "lucide-react";
import { RiftMascot } from "../rift/RiftMascot";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { LandingHeader } from "./LandingHeader";
import { navigateToAuth } from "@/app/hooks/useTauri";

const TOOLS = ["subfinder", "httpx", "nuclei", "nmap", "ffuf", "sqlmap"];

const FEATURES = [
  {
    icon: Radar,
    title: "Recon",
    desc: "Subdomains, live hosts, port scan, tech fingerprint — mapped in minutes.",
  },
  {
    icon: Bug,
    title: "Exploit",
    desc: "Targeted nuclei templates, fuzzing, and chained attacks on scoped hosts.",
  },
  {
    icon: FileText,
    title: "Report",
    desc: "Findings with severity, proof, and remediation — ready for your client.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Describe the target",
    desc: "Paste a domain, IP range, or describe what you need. RIFT scopes the operation.",
  },
  {
    n: "02",
    title: "Agent runs the tools",
    desc: "Real pentest tooling executes in an isolated cloud sandbox — you watch live.",
  },
  {
    n: "03",
    title: "Review the report",
    desc: "Structured output with evidence, CVSS context, and fix recommendations.",
  },
];

function CtaButton({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        variant === "primary"
          ? "inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          : "inline-flex items-center gap-2 rounded-lg border border-border bg-transparent px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:bg-accent"
      }
    >
      {children}
    </button>
  );
}

export function LandingPage() {
  const launch = () =>
    navigateToAuth("/signup", { preferSignInForReturningUser: true });

  React.useEffect(() => {
    const checkHash = () => {
      if (
        window.location.hash === "#pricing" ||
        window.location.hash === "#team-pricing-seat-selection"
      ) {
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
    <div className="landing-grid-bg min-h-full bg-background text-foreground">
      <LandingHeader />

      <section className="relative overflow-hidden border-b border-border/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(255,255,255,0.08),transparent)]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-14 text-center sm:px-6 sm:pt-20 md:pb-28">
          <div className="relative mb-8 sm:mb-10">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl sm:h-64 sm:w-64"
              aria-hidden
            />
            <div className="relative scale-[1.5] sm:scale-[2.1] md:scale-[2.6]">
              <RiftMascot
                cell={7}
                variant="hero"
                className="drop-shadow-[0_12px_48px_rgba(255,255,255,0.2)]"
              />
            </div>
          </div>

          <p className="mb-4 text-[12px] font-medium uppercase tracking-[0.14em] text-emerald-400/90">
            Autonomous pentest AI
          </p>

          <h1 className="max-w-3xl text-balance text-[2rem] font-semibold leading-[1.08] tracking-tight sm:text-5xl md:text-[3.25rem]">
            The agent that breaks in
            <span className="text-muted-foreground">
              {" "}
              — so you don&apos;t have to
            </span>
          </h1>

          <p className="mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
            Point RIFT at a target. It runs recon, hunts vulnerabilities, and
            writes the report — on its own, inside an isolated cloud sandbox.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <CtaButton onClick={launch}>
              Start for free
              <ArrowRight className="size-4" />
            </CtaButton>
            <CtaButton
              variant="secondary"
              onClick={() =>
                document
                  .getElementById("how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See how it works
            </CtaButton>
          </div>

          <p className="mt-5 text-[12px] text-muted-foreground/80">
            No credit card · Cloud sandbox included · Beta access
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
            {TOOLS.map((t) => (
              <span
                key={t}
                className="rounded-md border border-border/60 bg-card/50 px-2.5 py-1 font-mono text-[11px] text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-16 border-b border-border/40 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Full offensive pipeline
          </h2>
          <p className="mt-2 max-w-lg text-[15px] text-muted-foreground">
            From footprint to final report — one conversation, one sandbox, zero
            local setup.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-border hover:bg-card/70"
              >
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-accent text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="how"
        className="scroll-mt-16 border-b border-border/40 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                How it works
              </h2>
              <p className="mt-2 text-[15px] text-muted-foreground">
                Three steps. You scope it — RIFT executes.
              </p>
              <ol className="mt-8 space-y-6">
                {STEPS.map(({ n, title, desc }) => (
                  <li key={n} className="flex gap-4">
                    <span className="font-mono text-[12px] font-medium text-muted-foreground">
                      {n}
                    </span>
                    <div>
                      <h3 className="text-[15px] font-medium text-foreground">
                        {title}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {desc}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-[#252526] shadow-2xl">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
                <RiftMascot cell={2} />
                <div className="text-left leading-tight">
                  <div className="text-[12px] font-semibold text-foreground">
                    RIFT
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    ~/session · Agent
                  </div>
                </div>
                <span className="ml-auto text-[10px] text-emerald-400/90">
                  sandbox ready
                </span>
              </div>
              <div className="space-y-4 p-4 text-left text-[13px]">
                <p className="text-foreground/90">
                  Do recon on{" "}
                  <code className="rounded bg-background/60 px-1.5 py-0.5 font-mono text-[12px] text-[#ce9178]">
                    acme.com
                  </code>{" "}
                  — subdomains and web vulns, keep it fast.
                </p>
                <div className="rounded-lg border border-border/60 bg-background/40">
                  <div className="flex items-center gap-2 border-b border-border/40 px-3 py-2 text-[11px] text-muted-foreground">
                    <Terminal className="size-3.5" />
                    <span className="truncate font-mono">
                      Ran terminal command
                    </span>
                    <span className="ml-auto text-emerald-400/90">Done</span>
                  </div>
                  <pre className="overflow-x-auto p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
                    <span className="text-emerald-400/90">
                      https://api.acme.com
                    </span>{" "}
                    [200] nginx, Express{"\n"}
                    <span className="text-emerald-400/90">
                      https://staging.acme.com
                    </span>{" "}
                    [401] Restricted{"\n"}
                    <span className="text-muted-foreground/60">
                      4 live hosts · 1.8s
                    </span>
                  </pre>
                </div>
                <p className="text-muted-foreground">
                  Found outdated OpenVPN on{" "}
                  <code className="rounded bg-background/60 px-1 font-mono text-[12px]">
                    vpn.acme.com
                  </code>
                  . Running nuclei…
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card/30 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" />
                <span className="text-[13px] font-semibold">Ask mode</span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Security Q&amp;A — CVE breakdowns, payload ideas, methodology.
                No execution.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <div className="mb-2 flex items-center gap-2">
                <span className="size-2 rounded-full bg-emerald-400" />
                <span className="text-[13px] font-semibold">Agent mode</span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">
                Full autonomous operation — RIFT plans, runs tools, adapts, and
                delivers a report.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        id="security"
        className="scroll-mt-16 border-b border-border/40 py-20 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-start gap-3">
            <Shield className="mt-1 size-5 shrink-0 text-muted-foreground" />
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Isolated by design
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] text-muted-foreground">
                Every operation runs in a disposable cloud sandbox. Nothing
                touches your machine.
              </p>
            </div>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: Lock,
                title: "Sandboxed",
                desc: "Per-run container. No persistence.",
              },
              {
                icon: Radar,
                title: "Scoped",
                desc: "Only targets you authorize.",
              },
              {
                icon: FileText,
                title: "Auditable",
                desc: "Every command logged for review.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border/60 bg-card/30 p-5"
              >
                <Icon className="mb-3 size-4 text-muted-foreground" />
                <h3 className="text-[14px] font-medium">{title}</h3>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-16 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Simple pricing
          </h2>
          <p className="mt-2 text-[15px] text-muted-foreground">
            Full access during beta. No credit card.
          </p>
          <div className="mt-10 grid gap-4 sm:max-w-2xl sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card/50 p-6">
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                Beta
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight">Free</p>
              <ul className="mt-5 space-y-2 text-[13px] text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ChevronRight className="size-3.5 shrink-0" />
                  Ask &amp; Agent modes
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="size-3.5 shrink-0" />
                  Cloud sandbox included
                </li>
                <li className="flex items-center gap-2">
                  <ChevronRight className="size-3.5 shrink-0" />
                  Full reporting export
                </li>
              </ul>
              <button
                type="button"
                onClick={launch}
                className="mt-6 w-full rounded-lg bg-foreground py-2.5 text-[13px] font-medium text-background hover:opacity-90"
              >
                Get started
              </button>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/20 p-6 opacity-80">
              <p className="text-[12px] font-medium uppercase tracking-wide text-muted-foreground">
                Team
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-muted-foreground">
                Soon
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-4 text-center sm:px-6">
          <div className="mb-6 scale-125">
            <RiftMascot cell={4} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Ready to run your first op?
          </h2>
          <p className="mt-3 max-w-md text-[15px] text-muted-foreground">
            Launch RIFT, point it at a target, and let the agent work.
          </p>
          <button
            type="button"
            onClick={launch}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-3 text-[14px] font-medium text-background hover:opacity-90"
          >
            Start for free <ArrowRight className="size-4" />
          </button>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-[12px] text-muted-foreground sm:flex-row sm:px-6 sm:text-left">
          <div className="flex items-center gap-2">
            <RiftPixelMark size={18} />
            <span>RIFT · Autonomous pentest AI</span>
          </div>
          <p>
            <Link
              href="/terms-of-service"
              className="underline hover:text-foreground"
            >
              Terms
            </Link>
            {" · "}
            <Link
              href="/privacy-policy"
              className="underline hover:text-foreground"
            >
              Privacy
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
