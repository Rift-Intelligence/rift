"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ChatMode } from "@/types/chat";

const MODE_VARIANT_CLASSES: Record<ChatMode, string> = {
  ask: "bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
  agent: "bg-accent text-foreground",
};

const baseClasses =
  "h-6 px-2 text-[11.5px] font-medium rounded-md focus-visible:ring-1 shrink-0";

export interface ModeSelectorTriggerProps {
  chatMode: ChatMode;
}

export function ModeSelectorTrigger({ chatMode }: ModeSelectorTriggerProps) {
  return (
    <DropdownMenuTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        data-testid="mode-selector"
        className={`${baseClasses} ${MODE_VARIANT_CLASSES[chatMode]}`}
      >
        {chatMode === "agent" ? (
          <>
            <span className="mr-1 inline-block size-1.5 rounded-full bg-emerald-400/90" />
            <span className="hidden md:inline">Agent</span>
          </>
        ) : (
          <>
            <span className="hidden md:inline">Ask</span>
          </>
        )}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>
  );
}
