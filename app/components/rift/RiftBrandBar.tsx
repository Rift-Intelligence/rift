"use client";

import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { useAppShell } from "@/app/contexts/AppShellContext";

interface RiftBrandBarProps {
  version?: string;
  cwd?: string;
  status?: { label: string; tone?: "ok" | "warn" | "muted" };
  className?: string;
}

export function RiftBrandBar({
  version = "v1.0",
  cwd = "~/session",
  status,
  className = "",
}: RiftBrandBarProps) {
  const { panelClass, displayClass } = useAppShell();

  return (
    <div
      className={`${panelClass} flex w-full shrink-0 items-center gap-3 border-b border-border/40 px-5 py-2.5 ${className}`}
      data-testid="rift-brand-bar"
    >
      <RiftPixelMark size={22} className="shrink-0" />
      <div className="min-w-0 leading-tight">
        <div className="flex items-baseline gap-2">
          <RiftWordmark height={11} className="text-foreground" />
          <span
            className={`${displayClass} text-[10px] font-normal text-muted-foreground`}
          >
            {version}
          </span>
        </div>
        <div className="truncate font-mono text-[10px] text-muted-foreground">
          {cwd}
        </div>
      </div>
      {status ? (
        <span className="ml-auto flex shrink-0 items-center gap-2 rounded-full border border-border/60 bg-surface-2/80 px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-muted-foreground backdrop-blur-sm">
          <span
            className={`size-1.5 rounded-full ${
              status.tone === "warn"
                ? "bg-warning"
                : status.tone === "ok"
                  ? "bg-success"
                  : "bg-muted-foreground"
            }`}
            aria-hidden
          />
          {status.label}
        </span>
      ) : null}
    </div>
  );
}
