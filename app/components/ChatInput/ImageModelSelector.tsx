"use client";

import { Check, ChevronDown, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IMAGE_MODELS, DEFAULT_IMAGE_MODEL } from "@/types/chat";
import type { SelectedModel } from "@/types/chat";

interface ImageModelSelectorProps {
  value: SelectedModel;
  onChange: (model: SelectedModel) => void;
}

/**
 * Image-mode model picker (composer). Chooses which image model generate_image
 * renders with. Minimal, Claude-style: just the model name + a short strength.
 */
export function ImageModelSelector({
  value,
  onChange,
}: ImageModelSelectorProps) {
  const active =
    IMAGE_MODELS.find((m) => m.id === value) ??
    IMAGE_MODELS.find((m) => m.id === DEFAULT_IMAGE_MODEL)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Image model: ${active.name}`}
          title={`${active.name} — ${active.desc}`}
          className="inline-flex h-6 items-center gap-1 rounded-md px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Palette className="size-3.5" />
          <span className="max-w-[7rem] truncate">{active.name}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="w-48 rounded-xl p-1"
      >
        <DropdownMenuLabel className="px-2 py-0.5 text-[10px] font-normal text-muted-foreground/70">
          Image model
        </DropdownMenuLabel>
        {IMAGE_MODELS.map((m) => {
          const isActive = m.id === active.id;
          return (
            <DropdownMenuItem
              key={m.id}
              onSelect={() => onChange(m.id)}
              className="flex items-center gap-2 rounded-md px-2 py-1"
            >
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[12px] text-foreground">
                  {m.name}
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
