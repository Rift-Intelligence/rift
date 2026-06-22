"use client";

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
  return null;
}
