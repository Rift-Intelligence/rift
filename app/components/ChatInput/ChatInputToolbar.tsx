"use client";

import { AttachmentButton } from "@/app/components/AttachmentButton";
import { ChatModeSelector } from "./ChatModeSelector";
import { ModelSelector } from "@/app/components/ModelSelector";
import { BuildModelSelector } from "./BuildModelSelector";
import { ImageModelSelector } from "./ImageModelSelector";
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

export function ChatInputToolbar({
  onAttachClick,
  contextUsage,
  showContextIndicator = false,
  contextUsageVariant = "tooltip",
  chatMode,
  ...submitStopProps
}: ChatInputToolbarProps) {
  const { selectedModel, setSelectedModel, chatPurpose } = useGlobalState();

  return (
    <div className="flex items-center gap-0.5 min-w-0">
      <div className="shrink-0">
        <AttachmentButton onAttachClick={onAttachClick} />
      </div>
      {/* Image mode has no Agent/Ask choice — it always runs generate_image —
          so the mode toggle is hidden there; only the image model picker shows. */}
      {chatPurpose !== "image" && <ChatModeSelector />}
      {chatPurpose === "app" ? (
        <BuildModelSelector value={selectedModel} onChange={setSelectedModel} />
      ) : chatPurpose === "image" ? (
        <ImageModelSelector value={selectedModel} onChange={setSelectedModel} />
      ) : (
        <ModelSelector
          value={selectedModel}
          onChange={setSelectedModel}
          mode={chatMode}
        />
      )}
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
