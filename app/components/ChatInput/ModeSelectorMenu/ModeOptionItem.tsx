"use client";

import { type LucideIcon, Lock } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export interface ModeOptionItemProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  "data-testid"?: string;
  showLock?: boolean;
  showProBadge?: boolean;
}

export function ModeOptionItem({
  icon: Icon,
  title,
  description,
  onClick,
  "data-testid": testId,
  showLock = false,
  showProBadge = false,
}: ModeOptionItemProps) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className="cursor-pointer group font-mono"
      data-testid={testId}
    >
      <span className="text-primary mr-2 text-xs">▸</span>
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium uppercase tracking-wider text-xs">
            {title}
          </span>
          {showLock && <Lock className="w-3 h-3 text-muted-foreground" />}
          {showProBadge && (
            <span className="text-[9px] uppercase tracking-widest text-primary/70 border border-primary/30 px-1">
              PRO
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground/70 tracking-wide">
          {description}
        </span>
      </div>
    </DropdownMenuItem>
  );
}
