"use client";

import { Cloud } from "lucide-react";

interface SandboxSelectorProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function SandboxSelector({ size = "sm" }: SandboxSelectorProps) {
  const iconClassName = size === "md" ? "h-4 w-4 shrink-0" : "h-3 w-3 shrink-0";
  const textClassName =
    size === "md"
      ? "h-9 px-3 gap-2 text-sm font-medium inline-flex items-center rounded-md text-muted-foreground"
      : "h-7 px-2 gap-1 text-xs font-medium inline-flex items-center rounded-md text-muted-foreground";

  return (
    <span className={textClassName}>
      <Cloud className={iconClassName} />
      <span className="truncate">Cloud</span>
    </span>
  );
}
