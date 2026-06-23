"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Search,
  Terminal,
  ArrowUp,
  Paperclip,
  AtSign,
} from "lucide-react";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";

const USER_PROMPT =
  "Recon acme.com — live subdomains and obvious web vulns. Keep it fast.";
const INTRO =
  "Starting with passive subdomain discovery, then liveness + tech fingerprint.";
const FOLLOWUP =
  "vpn.acme.com runs an outdated OpenVPN — flagging it. Running nuclei…";

const TOOL_LINES = [
  {
    host: "https://api.acme.com",
    code: "[200]",
    detail: "nginx · Express",
    tone: "success" as const,
  },
  {
    host: "https://staging.acme.com",
    code: "[401]",
    detail: "restricted",
    tone: "warning" as const,
  },
  {
    host: "https://vpn.acme.com",
    code: "[200]",
    detail: "OpenVPN 2.4.6",
    tone: "destructive" as const,
  },
  { host: "4 live hosts · 1.8s", code: "", detail: "", tone: "muted" as const },
];

const TONE_CLASS = {
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
  muted: "text-muted-foreground/50",
};

function useReducedMotion() {
  return useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )[0];
}

function useTypewriter(
  text: string,
  active: boolean,
  reduced: boolean,
  speed = 20,
  cycle = 0,
) {
  const [chars, setChars] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    if (!active || reduced) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setChars(0);
    });
    const gen = ++generation.current;
    let i = 0;

    const id = window.setInterval(() => {
      i += 1;
      if (gen === generation.current) setChars(i);
      if (i >= text.length) clearInterval(id);
    }, speed);

    return () => {
      cancelled = true;
      clearInterval(id);
      generation.current += 1;
    };
  }, [text, active, reduced, speed, cycle]);

  if (!active) return "";
  if (reduced) return text;
  return text.slice(0, Math.min(chars, text.length));
}

/**
 * Live product preview — assistant response types in, tool output streams line
 * by line. Purely presentational hero product shot.
 */
export function AppPreview({
  autoStart = false,
  live = false,
  variant = "default",
}: {
  autoStart?: boolean;
  live?: boolean;
  variant?: "default" | "hero";
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const shouldAnimate = autoStart || live;
  const [started, setStarted] = useState(() => reducedMotion && shouldAnimate);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState(() => (reducedMotion ? 3 : 0));
  const [visibleLines, setVisibleLines] = useState(() =>
    reducedMotion ? TOOL_LINES.length : 0,
  );

  const userPrompt = useTypewriter(
    USER_PROMPT,
    started && phase === 0,
    reducedMotion,
    16,
    cycle,
  );
  const intro = useTypewriter(
    INTRO,
    started && phase >= 1,
    reducedMotion,
    20,
    cycle,
  );
  const followup = useTypewriter(
    FOLLOWUP,
    started && phase >= 3,
    reducedMotion,
    20,
    cycle,
  );

  useEffect(() => {
    if (reducedMotion) return;
    if (!shouldAnimate) return;

    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, shouldAnimate]);

  useEffect(() => {
    if (shouldAnimate || reducedMotion) return;

    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setStarted(true);
          setPhase(1);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion, shouldAnimate]);

  useEffect(() => {
    if (!started || reducedMotion) return;
    if (phase !== 0) return;
    if (userPrompt.length < USER_PROMPT.length) return;
    const t = window.setTimeout(() => setPhase(1), 350);
    return () => clearTimeout(t);
  }, [started, reducedMotion, phase, userPrompt.length]);

  useEffect(() => {
    if (!started || reducedMotion || phase !== 1 || intro.length < INTRO.length)
      return;
    const t = window.setTimeout(() => setPhase(2), 280);
    return () => clearTimeout(t);
  }, [started, reducedMotion, phase, intro.length]);

  useEffect(() => {
    if (!started || reducedMotion || phase !== 2) return;

    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setVisibleLines(i);
      if (i >= TOOL_LINES.length) {
        clearInterval(id);
        window.setTimeout(() => setPhase(3), 400);
      }
    }, 320);

    return () => clearInterval(id);
  }, [started, reducedMotion, phase, cycle]);

  useEffect(() => {
    if (!live || !started || reducedMotion || phase !== 3) return;
    if (followup.length < FOLLOWUP.length) return;
    const t = window.setTimeout(() => {
      setVisibleLines(0);
      setPhase(0);
      setCycle((c) => c + 1);
    }, 4500);
    return () => clearTimeout(t);
  }, [live, started, reducedMotion, phase, followup.length, cycle]);

  useEffect(() => {
    if (!live) return;
    const el = scrollRef.current;
    if (!el) return;
    if (phase === 0 && cycle > 0) {
      el.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [
    live,
    phase,
    userPrompt.length,
    intro.length,
    visibleLines,
    followup.length,
    cycle,
  ]);

  const shellClass = live
    ? "relative mx-auto flex h-[400px] w-full max-w-none flex-col overflow-hidden rounded-xl border border-border bg-surface-2 text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)] sm:h-[440px]"
    : variant === "hero"
      ? "relative mx-auto flex h-full min-h-[360px] w-full max-w-none flex-col overflow-hidden rounded-2xl border border-border-strong bg-surface-2 text-left shadow-[0_60px_140px_-40px_rgba(0,0,0,0.85),0_0_100px_-30px_rgba(217, 119, 87,0.22)] sm:min-h-[420px] lg:min-h-0 lg:rounded-[20px]"
      : "relative mx-auto w-full max-w-4xl overflow-hidden rounded-xl border border-border bg-surface-2 text-left shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]";

  return (
    <div ref={rootRef} className={shellClass}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-signal/60 to-transparent" />

      <div className="flex h-9 items-center gap-3 border-b border-border bg-surface-1 px-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
          <span className="size-2.5 rounded-full bg-border-strong" />
        </div>
        <div className="ml-2 flex h-6 items-center gap-2 rounded-lg border border-border bg-background px-2.5 text-[11px] text-foreground">
          <RiftPixelMark size={13} />
          acme.com — recon
        </div>
        <div className="hidden h-6 items-center gap-2 rounded-lg px-2.5 text-[11px] text-muted-foreground sm:flex">
          CVE-2024-3094
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden sm:flex-row">
        <aside className="hidden w-[176px] shrink-0 flex-col overflow-hidden border-r border-border bg-surface-1 p-2.5 sm:flex">
          <div className="flex items-center gap-1.5 rounded-lg border border-border bg-gradient-to-b from-surface-3 to-surface-2 px-2.5 py-1.5 text-[11.5px] font-medium text-foreground shadow-sm">
            <Plus className="size-3.5 text-signal" /> New session
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted-foreground">
            <Search className="size-3" /> Search…
          </div>
          <div className="mt-4 px-1 font-mono text-[9px] uppercase tracking-wider text-muted-foreground/70">
            Today
          </div>
          <div className="mt-1 space-y-0.5">
            <div className="relative rounded-lg bg-surface-4 px-2.5 py-1.5 text-[11.5px] text-foreground">
              <span className="absolute inset-y-1.5 left-0 w-0.5 rounded bg-signal" />
              acme.com — recon
            </div>
            <div className="rounded-lg px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
              CVE-2024-3094 explain
            </div>
            <div className="rounded-lg px-2.5 py-1.5 text-[11.5px] text-muted-foreground">
              JWT none-alg exploit
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center gap-2.5 border-b border-border px-4 py-2.5">
            <RiftPixelMark size={20} />
            <div className="leading-tight">
              <div className="text-[12px] font-semibold text-foreground">
                RIFT{" "}
                <span className="text-[10px] font-normal text-muted-foreground">
                  v1.0
                </span>
              </div>
              <div className="font-mono text-[10px] text-muted-foreground">
                ~/session
              </div>
            </div>
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2.5 py-1 text-[10px] text-muted-foreground">
              <span
                className={`size-1.5 rounded-full ${
                  started && phase >= 1 && phase < 3
                    ? "animate-pulse bg-signal"
                    : "bg-success"
                }`}
              />{" "}
              {started && phase >= 1 && phase < 3 ? "Running" : "Sandbox ready"}
            </span>
          </div>

          <div
            ref={scrollRef}
            className={`min-h-0 flex-1 ${live ? "overflow-y-auto overflow-x-hidden scroll-smooth" : ""}`}
          >
            <div className="space-y-5 px-4 py-5 sm:px-5">
              <div className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-border-strong bg-gradient-to-br from-surface-4 to-surface-2 text-[9px] font-bold text-foreground">
                  AC
                </span>
                <p
                  className={`text-[13px] leading-relaxed text-foreground ${live ? "" : "min-h-[2.6rem]"}`}
                >
                  {shouldAnimate && started ? (
                    <>
                      {userPrompt}
                      {phase === 0 && userPrompt.length < USER_PROMPT.length ? (
                        <span className="ml-0.5 inline-block w-0.5 animate-pulse bg-foreground align-middle" />
                      ) : null}
                    </>
                  ) : (
                    <>
                      Recon{" "}
                      <code className="rounded-md border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[11.5px] text-signal-bright">
                        acme.com
                      </code>{" "}
                      — live subdomains and obvious web vulns. Keep it fast.
                    </>
                  )}
                </p>
              </div>

              {started && phase >= 1 ? (
                <div className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border border-border bg-gradient-to-b from-surface-3 to-surface-2">
                    <RiftPixelMark size={13} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[13px] leading-relaxed text-foreground ${live ? "" : "min-h-[2.6rem]"}`}
                    >
                      {intro}
                      {phase === 1 && intro.length < INTRO.length ? (
                        <span className="ml-0.5 inline-block w-0.5 animate-pulse bg-signal align-middle" />
                      ) : null}
                    </p>

                    {phase >= 2 ? (
                      <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface-2">
                        <div className="flex items-center gap-2.5 px-3 py-2">
                          <span className="grid size-5 place-items-center rounded-md border border-border bg-surface-4 text-signal">
                            <Terminal className="size-3" />
                          </span>
                          <span className="font-mono text-[11.5px] text-muted-foreground">
                            subfinder -d acme.com | httpx
                          </span>
                          <span
                            className={`ml-auto flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              visibleLines >= TOOL_LINES.length
                                ? "bg-success/10 text-success"
                                : "bg-signal/10 text-signal"
                            }`}
                          >
                            <span
                              className={`size-1 rounded-full ${
                                visibleLines >= TOOL_LINES.length
                                  ? "bg-success"
                                  : "animate-pulse bg-signal"
                              }`}
                            />
                            {visibleLines >= TOOL_LINES.length
                              ? "Done"
                              : "Running"}
                          </span>
                        </div>
                        <div className="border-t border-border bg-background px-3 py-2.5 font-mono text-[11px] leading-relaxed">
                          {TOOL_LINES.slice(0, visibleLines).map((line, idx) =>
                            line.tone === "muted" ? (
                              <div
                                key={`${cycle}-${idx}-${line.host}`}
                                className={TONE_CLASS.muted}
                              >
                                {line.host}
                              </div>
                            ) : (
                              <div key={`${cycle}-${idx}-${line.host}`}>
                                <span className={TONE_CLASS[line.tone]}>
                                  {line.host}
                                </span>{" "}
                                <span className="text-muted-foreground/60">
                                  {line.code}
                                </span>{" "}
                                {line.detail}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ) : null}

                    {phase >= 3 ? (
                      <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                        {followup.split("vpn.acme.com")[0]}
                        {followup.includes("vpn.acme.com") ? (
                          <>
                            <span className="font-mono text-[11.5px] text-foreground">
                              vpn.acme.com
                            </span>
                            {followup.split("vpn.acme.com")[1]}
                          </>
                        ) : null}
                        {followup.length < FOLLOWUP.length ? (
                          <span className="ml-0.5 inline-block w-0.5 animate-pulse bg-signal align-middle" />
                        ) : null}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 px-4 pb-4 sm:px-5">
            <div className="rounded-xl border border-border-strong bg-surface-2 px-3.5 py-3 shadow-md">
              <div className="text-[13px] text-muted-foreground/70">
                Plan an attack, @ to add context…
              </div>
              <div className="mt-3 flex items-center gap-1.5">
                <div className="flex gap-0.5 rounded-lg border border-border bg-surface-1 p-0.5">
                  <span className="flex items-center gap-1.5 rounded-md bg-surface-4 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm">
                    <span className="size-1.5 rounded-full bg-signal" /> Agent
                  </span>
                  <span className="px-2.5 py-1 text-[11px] text-muted-foreground">
                    Ask
                  </span>
                </div>
                <span className="grid size-7 place-items-center rounded-lg text-muted-foreground">
                  <AtSign className="size-4" />
                </span>
                <span className="grid size-7 place-items-center rounded-lg text-muted-foreground">
                  <Paperclip className="size-4" />
                </span>
                <span className="ml-auto grid size-7 place-items-center rounded-lg bg-gradient-to-b from-signal-bright to-signal text-background shadow-[0_2px_10px_-2px_rgba(217, 119, 87,0.5)]">
                  <ArrowUp className="size-4" strokeWidth={2.5} />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
