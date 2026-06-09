"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MessageSquare, Infinity, ChevronDown } from "lucide-react";
import type { ChatMode } from "@/types/chat";

const MODE_VARIANT_CLASSES: Record<ChatMode, string> = {
  ask: "bg-muted hover:bg-muted/50",
  // Agent = weapon-hot offensive mode → primary cyan signal (not red; red is
  // reserved strictly for alarm/stop states in the EYE system).
  agent:
    "bg-primary/10 text-primary hover:bg-primary/20 ring-1 ring-primary/30",
};

const baseClasses =
  "h-7 px-2 text-xs font-medium rounded-md focus-visible:ring-1 shrink-0";

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
            <Infinity className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">Agent</span>
          </>
        ) : (
          <>
            <MessageSquare className="w-3 h-3 md:mr-1" />
            <span className="hidden md:inline">Ask</span>
          </>
        )}
        <ChevronDown className="w-3 h-3 ml-1" />
      </Button>
    </DropdownMenuTrigger>
  );
}
