"use client";

import { useEffect, useRef, useState } from "react";

type Kind = "cmd" | "ok" | "warn" | "crit" | "dim";
type Line = { kind: Kind; text: string };

/**
 * A looping, self-typing terminal that plays a realistic RIFT build session —
 * commands are typed character-by-character, output streams in line by line, a
 * cursor blinks, then it resets and runs again. Pure presentation; respects
 * prefers-reduced-motion (renders the full transcript statically).
 */
const SCRIPT: Line[] = [
  { kind: "cmd", text: 'rift build "a landing page with a waitlist"' },
  { kind: "dim", text: "planning the build, Next.js and Tailwind" },
  { kind: "cmd", text: "pnpm create next-app site --ts --tailwind" },
  { kind: "ok", text: "  scaffolded 24 files" },
  { kind: "cmd", text: "write app/page.tsx, components/Waitlist.tsx" },
  { kind: "ok", text: "  hero, features and pricing wired" },
  { kind: "dim", text: "adding the /api/waitlist route" },
  { kind: "ok", text: "  route ready, validation added" },
  { kind: "dim", text: "starting the dev server" },
  { kind: "ok", text: "  preview live at localhost:3000" },
  { kind: "ok", text: "  ready to edit or deploy" },
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
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#1b1e23] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      {/* title bar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
        <span className="size-3 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[11px] text-white/40">
          rift — sandbox
        </span>
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        className="h-[264px] overflow-hidden px-4 py-3.5 font-mono text-[11px] leading-[1.75] sm:h-[300px] sm:text-[11.5px]"
      >
        {done.map((ln, i) => (
          <div key={i} className={`whitespace-pre-wrap ${COLOR[ln.kind]}`}>
            {ln.kind === "cmd" ? (
              <>
                <span className="text-[#00d3f5]">$ </span>
                {ln.text}
              </>
            ) : (
              ln.text
            )}
          </div>
        ))}
        {typing && (
          <div className="whitespace-pre-wrap text-[#f4efe7]">
            <span className="text-[#00d3f5]">$ </span>
            {typing}
            <span className="ml-0.5 inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-[cursor-blink_1.1s_step-end_infinite] bg-[#00d3f5] align-text-bottom" />
          </div>
        )}
        {!typing && !reduced && (
          <div className="whitespace-pre-wrap text-[#f4efe7]">
            <span className="text-[#00d3f5]">$ </span>
            <span className="inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-[cursor-blink_1.1s_step-end_infinite] bg-[#00d3f5] align-text-bottom" />
          </div>
        )}
      </div>
    </div>
  );
}
