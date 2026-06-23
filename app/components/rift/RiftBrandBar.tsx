"use client";

import { RiftMascot } from "./RiftMascot";
import { RiftWordmark } from "@/components/icons/rift-wordmark";

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
  return (
    <div
      className={`flex w-full shrink-0 items-center gap-3 overflow-visible border-b border-sidebar-border bg-background px-5 py-3 ${className}`}
      data-testid="rift-brand-bar"
    >
      <div className="flex shrink-0 items-end overflow-visible pb-0.5">
        <RiftMascot variant="banner" className="rift-mascot-glow shrink-0" />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-baseline gap-1.5">
          <RiftWordmark height={11} className="text-foreground" />
          <span className="text-[11px] font-normal text-muted-foreground">
            {version}
          </span>
        </div>
        <div className="truncate text-[11px] text-muted-foreground">{cwd}</div>
      </div>
      {status ? (
        <span
          className={`ml-auto shrink-0 text-[11px] ${
            status.tone === "warn"
              ? "text-amber-400/90"
              : status.tone === "ok"
                ? "text-emerald-400/80"
                : "text-muted-foreground"
          }`}
        >
          {status.label}
        </span>
      ) : null}
    </div>
  );
}
