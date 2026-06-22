"use client";

import { Sparkles } from "lucide-react";
import type { ChatMode, SelectedModel } from "@/types/chat";

interface ModelSelectorProps {
  value: SelectedModel;
  onChange: (model: SelectedModel) => void;
  mode: ChatMode;
}

// Single-model product: there is no tier/model choice. Every request runs on the
// one engine (Grok 4.3, resolved in selectModel). This renders a static,
// non-interactive badge in place of the old Recon/Strike/Dominate selector.
// Props are kept so existing call sites (ChatInputToolbar) don't change.
export function ModelSelector(_props: ModelSelectorProps) {
  return (
    <div
      aria-label="Model"
      className="flex h-6 shrink-0 select-none items-center gap-1 rounded-md px-2 text-[11.5px] font-normal text-muted-foreground"
    >
      <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="truncate">RIFT</span>
    </div>
  );
}
