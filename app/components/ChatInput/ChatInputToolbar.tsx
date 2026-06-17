"use client";

import { AtSign } from "lucide-react";
import { AttachmentButton } from "@/app/components/AttachmentButton";
import { ChatModeSelector } from "./ChatModeSelector";
import { ModelSelector } from "@/app/components/ModelSelector";
import {
  SubmitStopButton,
  type SubmitStopButtonProps,
} from "./SubmitStopButton";
import {
  ContextUsageIndicator,
  type ContextUsageData,
} from "@/app/components/ContextUsageIndicator";
import { useGlobalState } from "@/app/contexts/GlobalState";

export interface ChatInputToolbarProps extends SubmitStopButtonProps {
  onAttachClick: () => void;
  contextUsage?: ContextUsageData;
  showContextIndicator?: boolean;
  contextUsageVariant?: "tooltip" | "compact-popover";
}

const pillBtn =
  "inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function ChatInputToolbar({
  onAttachClick,
  contextUsage,
  showContextIndicator = false,
  contextUsageVariant = "tooltip",
  chatMode,
  ...submitStopProps
}: ChatInputToolbarProps) {
  const { selectedModel, setSelectedModel } = useGlobalState();

  return (
    <div className="flex items-center gap-0.5 min-w-0">
      <button
        type="button"
        className={pillBtn}
        aria-label="Add context"
        title="Add context"
      >
        <AtSign className="size-3.5" />
      </button>
      <div className="shrink-0">
        <AttachmentButton onAttachClick={onAttachClick} />
      </div>
      <ChatModeSelector />
      <ModelSelector
        value={selectedModel}
        onChange={setSelectedModel}
        mode={chatMode}
      />
      <div className="ml-auto shrink-0 flex items-center gap-2">
        {showContextIndicator && contextUsage && (
          <ContextUsageIndicator
            {...contextUsage}
            variant={contextUsageVariant}
          />
        )}
        <SubmitStopButton {...submitStopProps} chatMode={chatMode} />
      </div>
    </div>
  );
}
