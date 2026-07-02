"use client";

import { Check, ChevronDown, Cpu } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BUILD_MODELS, DEFAULT_BUILD_MODEL } from "@/types/chat";
import type { SelectedModel } from "@/types/chat";

interface BuildModelSelectorProps {
  value: SelectedModel;
  onChange: (model: SelectedModel) => void;
}

/**
 * Model picker shown in the composer when Build mode (purpose="app") is active.
 * Lets the user pick which codegen model RIFT builds with — Fast (Gemini Flash)
 * through Premium (Fable 5). The selection is stored in `selectedModel` and
 * mapped to an OpenRouter model server-side (see selectModel / providers.ts).
 */
export function BuildModelSelector({
  value,
  onChange,
}: BuildModelSelectorProps) {
  // Highlight the active option; anything that isn't a build-* id (e.g. the
  // initial "auto") resolves to the default so the default model reads as
  // selected.
  const active =
    BUILD_MODELS.find((m) => m.id === value) ??
    BUILD_MODELS.find((m) => m.id === DEFAULT_BUILD_MODEL)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Build model: ${active.model}`}
          title={`${active.model} — ${active.desc}`}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Cpu className="size-3.5" />
          <span className="max-w-[8rem] truncate">{active.model}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-52 rounded-xl p-1"
      >
        <DropdownMenuLabel className="px-2 py-0.5 text-[10px] font-normal text-muted-foreground/70">
          Build model
        </DropdownMenuLabel>
        {BUILD_MODELS.map((m) => {
          const isActive = m.id === active.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => onChange(m.id)}
              className="flex items-center gap-2 rounded-md px-2 py-1"
            >
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[12px] text-foreground">
                  {m.model}
                </span>
                <span className="block text-[10px] text-muted-foreground">
                  {m.desc}
                </span>
              </span>
              <Check
                className={`size-3 shrink-0 ${
                  isActive ? "text-foreground" : "text-transparent"
                }`}
              />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
