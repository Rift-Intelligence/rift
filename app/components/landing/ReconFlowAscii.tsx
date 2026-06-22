"use client";

import { useEffect, useRef, useState } from "react";

type ColoredLine = {
  text: string;
  tone?: "dim" | "user" | "rift" | "or" | "tool" | "stream" | "crit" | "ok";
};

type Scene = {
  label: string;
  lines: ColoredLine[];
};

const TONE_CLASS: Record<NonNullable<ColoredLine["tone"]>, string> = {
  dim: "text-muted-foreground/55",
  user: "text-foreground",
  rift: "text-signal",
  or: "text-warning",
  tool: "text-info",
  stream: "text-success",
  crit: "text-destructive",
  ok: "text-success",
};

const SCENES: Scene[] = [
  {
    label: "User scopes the target",
    lines: [
      {
        text: "┌─────────────────────────────────────────────────────────────────────┐",
        tone: "dim",
      },
      {
        text: "│  RIFT · request lifecycle                                           │",
        tone: "dim",
      },
      {
        text: "└─────────────────────────────────────────────────────────────────────┘",
        tone: "dim",
      },
      { text: "", tone: "dim" },
      { text: "  ╭──────────────╮", tone: "dim" },
      { text: "  │    USER      │", tone: "user" },
      { text: "  │  pentester   │", tone: "dim" },
      { text: "  ╰──────┬───────╯", tone: "dim" },
      { text: "         │", tone: "dim" },
      {
        text: '         │  "Recon acme.com — live subdomains + obvious vulns"',
        tone: "user",
      },
      { text: "         ▼", tone: "rift" },
      { text: "  ╭──────────────╮", tone: "dim" },
      {
        text: "  │  RIFT Client │  Next.js · Agent mode · chat input",
        tone: "rift",
      },
      { text: "  ╰──────────────╯", tone: "dim" },
    ],
  },
  {
    label: "Request enters the platform",
    lines: [
      { text: "  USER ──POST──▶  /api/agent-long", tone: "user" },
      { text: "                         │", tone: "dim" },
      { text: "                         ▼", tone: "rift" },
      { text: "              ╭──────────────────────╮", tone: "dim" },
      { text: "              │  RIFT API Route      │", tone: "rift" },
      { text: "              │  auth · scope check  │", tone: "dim" },
      { text: "              │  persist → Convex    │", tone: "dim" },
      { text: "              ╰──────────┬───────────╯", tone: "dim" },
      { text: "                         │", tone: "dim" },
      { text: "                         ▼", tone: "rift" },
      { text: "              ╭──────────────────────╮", tone: "dim" },
      { text: "              │  Trigger.dev         │", tone: "rift" },
      { text: "              │  task: agent-long    │", tone: "dim" },
      { text: "              │  status: queued ▪▪▪  │", tone: "stream" },
      { text: "              ╰──────────────────────╯", tone: "dim" },
    ],
  },
  {
    label: "OpenRouter plans the next move",
    lines: [
      { text: "              ╭──────────────────────╮", tone: "dim" },
      { text: "              │  Agent Orchestrator  │", tone: "rift" },
      { text: "              ╰──────────┬───────────╯", tone: "dim" },
      { text: "                         │", tone: "dim" },
      { text: "                         ▼", tone: "or" },
      { text: "              ╭──────────────────────╮", tone: "dim" },
      { text: "              │  OpenRouter          │", tone: "or" },
      { text: "              │  anthropic/claude-*  │", tone: "dim" },
      { text: "              │                      │", tone: "dim" },
      { text: "              │  ◂ system prompt     │", tone: "dim" },
      { text: "              │  ◂ tool definitions  │", tone: "dim" },
      { text: "              │  ◂ recon history     │", tone: "dim" },
      { text: "              │                      │", tone: "dim" },
      { text: '              │  ▸ "run subfinder,   │', tone: "or" },
      { text: '              │     then httpx…"     │', tone: "or" },
      { text: "              ╰──────────────────────╯", tone: "dim" },
    ],
  },
  {
    label: "Real tools execute in sandbox",
    lines: [
      { text: "  OpenRouter ──tool call──▶  run_terminal_cmd", tone: "or" },
      { text: "                                    │", tone: "dim" },
      { text: "                                    ▼", tone: "tool" },
      {
        text: "                         ╭──────────────────────╮",
        tone: "dim",
      },
      {
        text: "                         │  Cloud Sandbox       │",
        tone: "tool",
      },
      {
        text: "                         │  Kali · isolated     │",
        tone: "dim",
      },
      {
        text: "                         │  /home/user          │",
        tone: "dim",
      },
      {
        text: "                         ╰──────────┬───────────╯",
        tone: "dim",
      },
      { text: "                                    │", tone: "dim" },
      {
        text: "                         $ subfinder -d acme.com",
        tone: "tool",
      },
      {
        text: "                         $ httpx -silent -status-code",
        tone: "tool",
      },
      {
        text: "                         ─────────────────────────",
        tone: "dim",
      },
      {
        text: "                           api.acme.com      [200]",
        tone: "ok",
      },
      {
        text: "                           staging.acme.com  [401]",
        tone: "stream",
      },
      {
        text: "                           vpn.acme.com      [200]",
        tone: "crit",
      },
    ],
  },
  {
    label: "Output streams back to you",
    lines: [
      { text: "  Sandbox stdout/stderr", tone: "tool" },
      { text: "         │", tone: "dim" },
      { text: "         ▼", tone: "stream" },
      {
        text: "  ╭──────────────────────╮      ╭──────────────────────╮",
        tone: "dim",
      },
      {
        text: "  │  Agent loop          │ SSE  │  RIFT UI             │",
        tone: "rift",
      },
      {
        text: "  │  tool result → LLM   │─────▶│  live message stream │",
        tone: "stream",
      },
      {
        text: "  │  plan next step      │      │  terminal blocks     │",
        tone: "dim",
      },
      {
        text: "  ╰──────────┬───────────╯      ╰──────────┬───────────╯",
        tone: "dim",
      },
      { text: "             │                             │", tone: "dim" },
      { text: "             ▼                             ▼", tone: "stream" },
      {
        text: '  OpenRouter ◂── "vpn.acme.com outdated OpenVPN — running nuclei…"',
        tone: "or",
      },
      {
        text: "  Convex     ◂── messages · todos · stream chunks persisted",
        tone: "dim",
      },
    ],
  },
  {
    label: "Attack surface updates live",
    lines: [
      {
        text: "  ╭────────────────────────────────────────────────────────────╮",
        tone: "dim",
      },
      {
        text: "  │  ATTACK SURFACE · acme.com                                 │",
        tone: "rift",
      },
      {
        text: "  ├────────────────────────────────────────────────────────────┤",
        tone: "dim",
      },
      {
        text: "  │                                                            │",
        tone: "dim",
      },
      {
        text: "  │         ◉ acme.com                                         │",
        tone: "rift",
      },
      {
        text: "  │        ╱ │ ╲ ╲                                              │",
        tone: "dim",
      },
      {
        text: "  │   api  staging vpn  mail  dev                              │",
        tone: "dim",
      },
      {
        text: "  │   200   401   CVE! 200   403                               │",
        tone: "ok",
      },
      {
        text: "  │              ▲                                             │",
        tone: "crit",
      },
      {
        text: "  │         critical finding                                   │",
        tone: "crit",
      },
      {
        text: "  │                                                            │",
        tone: "dim",
      },
      {
        text: "  │  FINDINGS  +3 hosts  +1 CVE  report ready                  │",
        tone: "stream",
      },
      {
        text: "  ╰────────────────────────────────────────────────────────────╯",
        tone: "dim",
      },
      { text: "", tone: "dim" },
      {
        text: "  USER ◂── structured report · evidence · remediation",
        tone: "user",
      },
    ],
  },
];

function useReducedMotion() {
  return useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )[0];
}

/** High-quality ASCII animation — full RIFT request lifecycle for the recon section. */
export function ReconFlowAscii() {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState(reducedMotion);
  const [sceneIndex, setSceneIndex] = useState(() =>
    reducedMotion ? SCENES.length - 1 : 0,
  );
  const [visibleLines, setVisibleLines] = useState(() =>
    reducedMotion ? SCENES.at(-1)!.lines.length : 0,
  );
  const [cursorOn, setCursorOn] = useState(true);

  const scene = SCENES[sceneIndex]!;

  useEffect(() => {
    if (reducedMotion) return;

    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setActive(entry?.isIntersecting ?? false),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    const id = window.setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, [active, reducedMotion]);

  useEffect(() => {
    if (!active || reducedMotion) return;

    let line = 0;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setVisibleLines(0);
    });

    const reveal = window.setInterval(() => {
      line += 1;
      setVisibleLines(line);
      if (line >= scene.lines.length) clearInterval(reveal);
    }, 55);

    return () => {
      cancelled = true;
      clearInterval(reveal);
    };
  }, [active, reducedMotion, sceneIndex, scene.lines.length]);

  useEffect(() => {
    if (!active || reducedMotion) return;
    if (visibleLines < scene.lines.length) return;

    const hold = window.setTimeout(() => {
      setSceneIndex((i) => (i + 1) % SCENES.length);
    }, 2400);

    return () => clearTimeout(hold);
  }, [active, reducedMotion, visibleLines, scene.lines.length, sceneIndex]);

  const shown = scene.lines.slice(0, visibleLines);
  const typing =
    active &&
    !reducedMotion &&
    visibleLines > 0 &&
    visibleLines < scene.lines.length;

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-b from-signal/10 via-transparent to-transparent opacity-80" />
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-[#070809]/95 shadow-[0_40px_120px_-40px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="flex items-center justify-between border-b border-border/50 bg-surface-1/40 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              rift://recon/pipeline
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <span
              className={`size-1.5 rounded-full ${active ? "animate-pulse bg-signal" : "bg-muted-foreground/40"}`}
            />
            {active ? "live trace" : "paused"}
          </div>
        </div>

        <div className="relative px-3 py-4 sm:px-5 sm:py-5">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 3px)",
            }}
            aria-hidden
          />

          <div className="mb-3 flex items-center justify-between gap-4 border-b border-border/30 pb-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-signal">
              {String(sceneIndex + 1).padStart(2, "0")} · {scene.label}
            </p>
            <div className="hidden gap-1 sm:flex">
              {SCENES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 w-4 rounded-full transition-colors ${
                    i === sceneIndex ? "bg-signal" : "bg-border-strong"
                  }`}
                />
              ))}
            </div>
          </div>

          <pre
            className="relative min-h-[280px] overflow-x-auto font-mono text-[9px] leading-[1.35] sm:min-h-[320px] sm:text-[10px] md:text-[11px]"
            aria-live="polite"
          >
            {shown.map((line, i) => (
              <div
                key={`${sceneIndex}-${i}`}
                className={`whitespace-pre ${TONE_CLASS[line.tone ?? "dim"]}`}
              >
                {line.text || "\u00A0"}
              </div>
            ))}
            {typing ? (
              <span
                className={`inline-block w-[0.55em] ${cursorOn ? "bg-signal/80" : "bg-transparent"}`}
              >
                {" "}
              </span>
            ) : null}
          </pre>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/30 pt-3 font-mono text-[9px] uppercase tracking-[0.12em] sm:text-[10px]">
            <span className="text-muted-foreground">
              <span className="text-foreground">user</span> input
            </span>
            <span className="text-muted-foreground">
              <span className="text-signal">rift</span> api
            </span>
            <span className="text-muted-foreground">
              <span className="text-warning">openrouter</span> llm
            </span>
            <span className="text-muted-foreground">
              <span className="text-info">sandbox</span> tools
            </span>
            <span className="text-muted-foreground">
              <span className="text-success">sse</span> stream
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
