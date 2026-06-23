"use client";

import { useEffect, useRef, useState } from "react";

type Kind = "cmd" | "ok" | "warn" | "crit" | "dim";
type Line = { kind: Kind; text: string };

/**
 * A looping, self-typing terminal that plays a realistic RIFT pentest session —
 * commands are typed character-by-character, output streams in line by line, a
 * cursor blinks, then it resets and runs again. Pure presentation; respects
 * prefers-reduced-motion (renders the full transcript statically).
 */
const SCRIPT: Line[] = [
  { kind: "cmd", text: "rift recon acme.com --fast" },
  { kind: "dim", text: "[*] subfinder · enumerating subdomains" },
  { kind: "ok", text: "  ✓  47 subdomains · 12 live hosts" },
  { kind: "dim", text: "[*] httpx · fingerprinting stack" },
  { kind: "ok", text: "  api.acme.com       200  nginx · Express" },
  { kind: "warn", text: "  staging.acme.com   401  restricted" },
  { kind: "warn", text: "  vpn.acme.com       200  OpenVPN 2.4.6" },
  { kind: "cmd", text: "rift scan vpn.acme.com --nuclei" },
  { kind: "dim", text: "[*] nuclei · 4,200 templates loaded" },
  { kind: "crit", text: "  CRITICAL  CVE-2023-46850 · heap overflow" },
  { kind: "warn", text: "  HIGH      exposed .git/ directory" },
  { kind: "dim", text: "[*] chaining · writing report" },
  { kind: "ok", text: "  ✓  report.md ready — 6 findings" },
];

const COLOR: Record<Kind, string> = {
  cmd: "text-[#f4efe7]",
  ok: "text-[#7fc593]",
  warn: "text-[#e3a53d]",
  crit: "text-[#f0613a]",
  dim: "text-[#8b8275]",
};

export function TerminalLive() {
  const [done, setDone] = useState<Line[]>([]);
  const [typing, setTyping] = useState("");
  const [reduced, setReduced] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        const t = setTimeout(res, ms);
        timers.push(t);
      });

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    async function run() {
      // setState lives inside this async runner (never synchronously in the
      // effect body) so we don't trigger cascading renders.
      if (prefersReduced) {
        setReduced(true);
        setDone(SCRIPT);
        return;
      }
      while (!cancelled) {
        setDone([]);
        setTyping("");
        await wait(500);
        for (let i = 0; i < SCRIPT.length && !cancelled; i++) {
          const ln = SCRIPT[i];
          if (ln.kind === "cmd") {
            for (let c = 1; c <= ln.text.length && !cancelled; c++) {
              setTyping(ln.text.slice(0, c));
              await wait(24 + Math.random() * 34);
            }
            await wait(320);
          } else {
            await wait(150 + Math.random() * 120);
          }
          if (cancelled) break;
          setDone((prev) => [...prev, ln]);
          setTyping("");
        }
        await wait(2800);
      }
    }
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [done, typing]);

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#100e0b] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="size-3 rounded-full bg-[#f0613a]/80" />
        <span className="size-3 rounded-full bg-[#e3a53d]/80" />
        <span className="size-3 rounded-full bg-[#7fc593]/80" />
        <span className="ml-3 font-mono text-[11px] text-[#8b8275]">
          rift@sandbox — live trace
        </span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#f26a20]">
          <span className="relative flex size-1.5">
            {!reduced && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#f26a20] opacity-70" />
            )}
            <span className="relative inline-flex size-1.5 rounded-full bg-[#f26a20]" />
          </span>
          live
        </span>
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        className="h-[300px] overflow-hidden px-4 py-4 font-mono text-[12.5px] leading-[1.7] sm:h-[340px] sm:text-[13px]"
      >
        {done.map((ln, i) => (
          <div key={i} className={`whitespace-pre-wrap ${COLOR[ln.kind]}`}>
            {ln.kind === "cmd" ? (
              <>
                <span className="text-[#f26a20]">$ </span>
                {ln.text}
              </>
            ) : (
              ln.text
            )}
          </div>
        ))}
        {typing && (
          <div className="whitespace-pre-wrap text-[#f4efe7]">
            <span className="text-[#f26a20]">$ </span>
            {typing}
            <span className="ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-[cursor-blink_1.1s_step-end_infinite] bg-[#f26a20] align-text-bottom" />
          </div>
        )}
        {!typing && !reduced && (
          <div className="whitespace-pre-wrap text-[#f4efe7]">
            <span className="text-[#f26a20]">$ </span>
            <span className="inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-[cursor-blink_1.1s_step-end_infinite] bg-[#f26a20] align-text-bottom" />
          </div>
        )}
      </div>
    </div>
  );
}
