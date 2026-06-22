"use client";

import { useEffect, useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";

type ItemStatus = "pending" | "running" | "done";

type Item = { id: string; label: string; status: ItemStatus };

const STEPS: Omit<Item, "status">[] = [
  { id: "1", label: "subfinder -d acme.com" },
  { id: "2", label: "httpx probe — 4 live hosts" },
  { id: "3", label: "nuclei scan — CVE templates" },
  { id: "4", label: "Generate report" },
];

function buildItems(activeIndex: number, allDone: boolean): Item[] {
  return STEPS.map((step, i) => {
    if (allDone || i < activeIndex) return { ...step, status: "done" };
    if (i === activeIndex) return { ...step, status: "running" };
    return { ...step, status: "pending" };
  });
}

function StatusIcon({ status }: { status: ItemStatus }) {
  if (status === "done") {
    return <Check className="size-3.5 text-success" strokeWidth={2.5} />;
  }
  if (status === "running") {
    return <Loader2 className="size-3.5 animate-spin text-signal" />;
  }
  return <Circle className="size-3 text-muted-foreground/40" />;
}

/** Animated checklist panel — mimics RIFT Agent progress (x.ai /goal style). */
export function ReconProgressDemo() {
  const reducedMotion = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )[0];
  const [activeIndex, setActiveIndex] = useState(() =>
    reducedMotion ? STEPS.length : 0,
  );
  const [allDone, setAllDone] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return;
    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      if (index >= STEPS.length) {
        setAllDone(true);
        setActiveIndex(STEPS.length);
        clearInterval(id);
      } else {
        setActiveIndex(index);
      }
    }, 2200);

    return () => clearInterval(id);
  }, [reducedMotion]);

  const items = buildItems(activeIndex, allDone);
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface-2">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="text-[13px] font-medium text-foreground">
          {allDone ? "Complete" : "Task progress"}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {doneCount} / {STEPS.length}
        </span>
      </div>
      <ul className="space-y-2.5 p-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-2.5">
            <span className="mt-0.5 shrink-0">
              <StatusIcon status={item.status} />
            </span>
            <span
              className={`font-mono text-[12px] leading-relaxed ${
                item.status === "pending"
                  ? "text-muted-foreground/50"
                  : item.status === "running"
                    ? "text-foreground"
                    : "text-muted-foreground line-through decoration-muted-foreground/40"
              }`}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
