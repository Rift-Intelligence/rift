"use client";

import React from "react";
import Link from "next/link";

/** Scrollable marketing sections shown below the landing hero. */

function SectionHeading({ index, title }: { index: string; title: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-3">
      <span className="hud-label text-primary">{index}</span>
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h2>
    </div>
  );
}

function Panel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`hud bg-surface/70 p-5 ${className ?? ""}`}>
      <span className="hud-corners" aria-hidden />
      {children}
    </div>
  );
}

export function LandingSections({ onLaunch }: { onLaunch: () => void }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-24">
      {/* SECURITY */}
      <section id="security" className="scroll-mt-24 py-16">
        <SectionHeading index="01 // SECURITY" title="Isolated by design" />
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Every operation runs inside its own disposable cloud sandbox. Nothing
          touches your machine, and the environment is destroyed when the run
          ends. EYE only acts inside the scope you point it at.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Panel>
            <div className="text-xs font-semibold tracking-widest text-primary">
              SANDBOXED
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Disposable per-run container. No persistence, no lateral access.
            </p>
          </Panel>
          <Panel>
            <div className="text-xs font-semibold tracking-widest text-primary">
              SCOPED
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Acts only against the target you authorize. Nothing outside it.
            </p>
          </Panel>
          <Panel>
            <div className="text-xs font-semibold tracking-widest text-primary">
              AUDITABLE
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Every command and finding is logged for review and reporting.
            </p>
          </Panel>
        </div>
      </section>

      {/* DOCS */}
      <section id="docs" className="scroll-mt-24 py-16">
        <SectionHeading index="02 // DOCS" title="How it works" />
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Three steps. Point, launch, watch.
        </p>
        <Panel className="font-mono text-[13px] leading-relaxed">
          <div className="text-muted-foreground">
            <span className="text-primary">$</span> eye target{" "}
            <span className="text-foreground">acme.example.com</span>
          </div>
          <div className="mt-1 text-muted-foreground">
            <span className="text-primary">›</span> recon ............ mapping
            attack surface
          </div>
          <div className="text-muted-foreground">
            <span className="text-primary">›</span> exploit .......... testing
            candidate vulns
          </div>
          <div className="text-muted-foreground">
            <span className="text-primary">›</span> report ........... writing
            findings + remediation
          </div>
          <div className="mt-1 text-primary">✓ done — 1 critical, 3 medium</div>
        </Panel>
        <div className="mt-6 flex flex-wrap gap-3">
          <Panel className="flex-1">
            <div className="text-xs font-semibold tracking-widest text-primary">
              ASK MODE
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Talk to EYE — questions, guidance, payloads, explanations.
            </p>
          </Panel>
          <Panel className="flex-1">
            <div className="text-xs font-semibold tracking-widest text-primary">
              AGENT MODE
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Hand EYE a goal and it executes end-to-end in the sandbox.
            </p>
          </Panel>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="scroll-mt-24 py-16">
        <SectionHeading index="03 // PRICING" title="Simple while in beta" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel className="border-primary/40">
            <div className="hud-label text-primary">CURRENT</div>
            <div className="mt-2 text-3xl font-semibold text-foreground">
              Free
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Full agent + cloud sandbox, no card required during the beta.
            </p>
            <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
              <li>
                <span className="text-primary">▸</span> Ask & Agent modes
              </li>
              <li>
                <span className="text-primary">▸</span> Cloud E2B sandbox
              </li>
              <li>
                <span className="text-primary">▸</span> Full reporting
              </li>
            </ul>
            <button
              type="button"
              onClick={onLaunch}
              className="mt-5 w-full border border-primary/60 bg-primary/10 px-4 py-2.5 text-sm font-semibold uppercase tracking-widest text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Launch App ▸
            </button>
          </Panel>
          <Panel>
            <div className="hud-label text-muted-foreground">LATER</div>
            <div className="mt-2 text-3xl font-semibold text-foreground/70">
              Team
            </div>
            <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
              Higher limits, shared workspaces, and audit exports. Coming after
              beta.
            </p>
            <ul className="mt-4 space-y-1.5 text-[12px] text-muted-foreground">
              <li>
                <span className="text-muted-foreground">▸</span> Everything in
                Free
              </li>
              <li>
                <span className="text-muted-foreground">▸</span> Priority
                sandboxes
              </li>
              <li>
                <span className="text-muted-foreground">▸</span> SSO + audit log
              </li>
            </ul>
            <div className="mt-5 w-full border border-border px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Not yet
            </div>
          </Panel>
        </div>
      </section>

      {/* PRIVACY */}
      <section id="privacy" className="scroll-mt-24 py-16">
        <SectionHeading index="04 // PRIVACY" title="Your data stays yours" />
        <Panel>
          <p className="text-sm leading-relaxed text-muted-foreground">
            EYE doesn&apos;t sell your data or train models on your operations.
            Sandboxes are destroyed after each run; conversation history is
            yours to delete at any time. Full details in the{" "}
            <Link
              href="/privacy-policy"
              className="text-primary underline underline-offset-4"
            >
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link
              href="/terms-of-service"
              className="text-primary underline underline-offset-4"
            >
              Terms
            </Link>
            .
          </p>
        </Panel>
      </section>
    </div>
  );
}
