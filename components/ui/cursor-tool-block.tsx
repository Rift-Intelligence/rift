"use client";

import React, { useState } from "react";
import { Terminal } from "lucide-react";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FormattedTerminalOutput } from "@/components/ui/format-terminal-output";

interface CursorToolBlockProps {
  label: string;
  status: "running" | "done" | "error" | "stopped";
  command?: string;
  output?: string;
  defaultOpen?: boolean;
  isShimmer?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

const STATUS_LABEL: Record<CursorToolBlockProps["status"], string> = {
  running: "Running…",
  done: "Done",
  error: "Error",
  stopped: "Stopped",
};

const STATUS_CLASS: Record<CursorToolBlockProps["status"], string> = {
  running: "text-[var(--warning)]",
  done: "text-[var(--success)]",
  error: "text-[var(--destructive)]",
  stopped: "text-[var(--muted-foreground)]",
};

export function CursorToolBlock({
  label,
  status,
  command,
  output,
  defaultOpen = false,
  isShimmer = false,
  isClickable = false,
  onClick,
  onKeyDown,
}: CursorToolBlockProps) {
  const isRunning = status === "running";
  const hasBody = Boolean(command || output);
  const canToggle = hasBody && !isRunning;
  const [open, setOpen] = useState(
    defaultOpen || (status === "done" && Boolean(output)),
  );

  const handleHeaderClick = () => {
    if (canToggle) setOpen((v) => !v);
    if (isClickable) onClick?.();
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (canToggle && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen((v) => !v);
    }
    onKeyDown?.(e);
  };

  return (
    <div className="my-3 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card)]">
      <div
        role={canToggle || isClickable ? "button" : undefined}
        tabIndex={canToggle || isClickable ? 0 : undefined}
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
        className="flex cursor-pointer select-none items-center gap-2 px-2.5 py-2 text-xs text-[var(--muted-foreground)] hover:bg-[var(--accent)]"
      >
        {canToggle || isRunning ? (
          <span
            className={`text-[10px] text-[var(--muted-foreground)] transition-transform ${open && !isRunning ? "rotate-90" : ""}`}
            aria-hidden
          >
            ▶
          </span>
        ) : (
          <span className="w-2.5" aria-hidden />
        )}
        <Terminal
          className="size-3.5 shrink-0 text-[var(--muted-foreground)]"
          strokeWidth={1.75}
        />
        <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--foreground)]">
          {isShimmer ? <Shimmer>{label}</Shimmer> : label}
        </span>
        <span className={`shrink-0 text-[11px] ${STATUS_CLASS[status]}`}>
          {STATUS_LABEL[status]}
        </span>
      </div>
      {open && hasBody && !isRunning ? (
        <div className="max-h-[180px] overflow-auto border-t border-[var(--border)] bg-[var(--muted)] px-3 py-2.5 font-mono text-[11.5px] leading-[1.7] text-[var(--foreground)] whitespace-pre-wrap">
          {command ? (
            <>
              <span className="text-[var(--muted-foreground)]">$ </span>
              {command}
              {output ? "\n\n" : ""}
            </>
          ) : null}
          {output ? <FormattedTerminalOutput text={output} /> : null}
        </div>
      ) : null}
    </div>
  );
}

export default CursorToolBlock;
