import React from "react";
import { Shimmer } from "@/components/ai-elements/shimmer";

interface ToolBlockProps {
  icon: React.ReactNode;
  action: string;
  target?: string;
  isShimmer?: boolean;
  isClickable?: boolean;
  onClick?: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

/**
 * ToolBlock — RIFT terminal-native action line.
 *
 * Renders a single agent action as a command-log row: a cyan `$` prompt, the
 * tool's glyph, the action verb, and an optional mono target. Square corners +
 * left cyan rule instead of the old rounded SaaS pill, so it reads like a line
 * in a real terminal rather than a generic chat tool-chip.
 */
const ToolBlock: React.FC<ToolBlockProps> = ({
  icon,
  action,
  target,
  isShimmer = false,
  isClickable = false,
  onClick,
  onKeyDown,
}) => {
  const baseClasses =
    "group/tb inline-flex h-[34px] max-w-full items-center gap-2 overflow-hidden border border-border/60 border-l-2 border-l-primary/40 bg-black/30 pl-2 pr-3 font-mono transition-[background-color,border-color] relative";
  const clickableClasses = isClickable
    ? "cursor-pointer hover:border-l-primary hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
    : "";

  return (
    <div className="min-w-0 flex-1">
      <button
        className={`${baseClasses} ${clickableClasses}`}
        onClick={isClickable ? onClick : undefined}
        onKeyDown={isClickable ? onKeyDown : undefined}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? "button" : undefined}
        aria-label={
          isClickable && target ? `Open ${target} in sidebar` : undefined
        }
      >
        <span
          aria-hidden
          className="select-none text-[13px] leading-none text-primary"
        >
          $
        </span>
        <span className="inline-flex w-[17px] flex-shrink-0 items-center text-muted-foreground/70 [&>svg]:h-[15px] [&>svg]:w-[15px]">
          {icon}
        </span>
        <span className="max-w-full truncate">
          <span className="text-[12.5px] tracking-tight text-foreground/85">
            {isShimmer ? <Shimmer>{action}</Shimmer> : action}
          </span>
          {target && (
            <span className="ml-2 text-[11.5px] text-primary/70">{target}</span>
          )}
        </span>
        {isClickable && (
          <span
            aria-hidden
            className="ml-auto select-none pl-2 text-[11px] text-muted-foreground/0 transition-colors group-hover/tb:text-primary/60"
          >
            ↗
          </span>
        )}
      </button>
    </div>
  );
};

export default ToolBlock;
