"use client";

import { useEffect, useRef } from "react";
import { useGlobalState } from "@/app/contexts/GlobalState";
import { useInputValue, useInputApi } from "@/app/contexts/InputContext";
import { TodoPanel } from "../TodoPanel";
import type { ChatStatus } from "@/types";
import { FileUploadPreview } from "../FileUploadPreview";
import { QueuedMessagesPanel } from "../QueuedMessagesPanel";
import { ScrollToBottomButton } from "../ScrollToBottomButton";
import { useFileUpload } from "@/app/hooks/useFileUpload";
import { removeDraft } from "@/lib/utils/client-storage";
import {
  RateLimitWarning,
  type RateLimitWarningData,
} from "../RateLimitWarning";
import { isAgentMode } from "@/lib/utils/mode-helpers";
import { toast } from "sonner";
import { NULL_THREAD_DRAFT_ID } from "@/lib/utils/client-storage";
import { SandboxSelector } from "../SandboxSelector";
import { ChatInputTextarea } from "./ChatInputTextarea";
import { ChatInputToolbar } from "./ChatInputToolbar";
import { type ContextUsageData } from "../ContextUsageIndicator";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatPurpose } from "@/types/chat";

/** Placeholder copy for the composer, per chat purpose (mode). */
function purposePlaceholder(purpose: ChatPurpose): string {
  if (purpose === "app") return "Describe an app or game to build…";
  if (purpose === "image") return "Describe an image to generate…";
  return "Plan, @ for context, / for commands";
}

interface ChatInputProps {
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  onSendNow: (messageId: string) => void;
  status: ChatStatus;
  isCentered?: boolean;
  hasMessages?: boolean;
  isAtBottom?: boolean;
  onScrollToBottom?: () => void;
  hideStop?: boolean;
  isNewChat?: boolean;
  clearDraftOnSubmit?: boolean;
  chatId?: string;
  rateLimitWarning?: RateLimitWarningData;
  onDismissRateLimitWarning?: () => void;
  contextUsage?: ContextUsageData;
  placeholder?: string;
  autoFocus?: boolean;
}

export const ChatInput = ({
  onSubmit,
  onStop,
  onSendNow,
  status,
  isCentered = false,
  hasMessages = false,
  isAtBottom = true,
  onScrollToBottom,
  hideStop = false,
  isNewChat = false,
  clearDraftOnSubmit = true,
  chatId,
  rateLimitWarning,
  onDismissRateLimitWarning,
  contextUsage,
  placeholder,
  autoFocus,
}: ChatInputProps) => {
  const input = useInputValue();
  const { setInput } = useInputApi();
  const {
    chatMode,
    setChatMode,
    chatPurpose,
    uploadedFiles,
    isUploadingFiles,
    messageQueue,
    removeQueuedMessage,
    queueBehavior,
    setQueueBehavior,
    sandboxPreference,
    setSandboxPreference,
    selectedModel,
    setSelectedModel,
    subscription,
    temporaryChatsEnabled,
    hasLocalSandbox,
    defaultLocalSandboxPreference,
  } = useGlobalState();
  const isMobile = useIsMobile();
  const {
    fileInputRef,
    handleFileUploadEvent,
    handleRemoveFile,
    handleAttachClick,
  } = useFileUpload(chatMode);

  const isGenerating = status === "submitted" || status === "streaming";
  const showContextIndicator =
    (subscription !== "free" || isAgentMode(chatMode)) && !!contextUsage;
  const isAgent = isAgentMode(chatMode);

  const draftId = isNewChat ? "new" : chatId || NULL_THREAD_DRAFT_ID;

  // Free agent mode constraints:
  // 1. Requires local sandbox — fall back to ask mode if disconnected
  // 2. Force local sandbox preference (not e2b)
  // 3. Force auto model selection
  //
  // Subscription tiers were removed, so every signed-in user can run cloud
  // (E2B) Agent mode. The old "free Agent requires a local sandbox, else fall
  // back to Ask" downgrade no longer applies.
  const isFreeAgent = false;

  const prevHasLocalSandboxRef = useRef(hasLocalSandbox);
  useEffect(() => {
    const wasConnected = prevHasLocalSandboxRef.current;
    prevHasLocalSandboxRef.current = hasLocalSandbox;

    if (!isFreeAgent) return;
    // Only show toast on actual disconnect (true → false), not on
    // initial mount or logout where hasLocalSandbox starts as false.
    if (!hasLocalSandbox) {
      setChatMode("ask");
      if (wasConnected) {
        toast.info("Local sandbox disconnected. Switched to Ask mode.", {
          description: "Reconnect your sandbox to use Agent mode.",
          duration: 5000,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreeAgent, hasLocalSandbox]);

  useEffect(() => {
    if (!isFreeAgent) return;
    if (
      (!sandboxPreference || sandboxPreference === "e2b") &&
      defaultLocalSandboxPreference
    ) {
      setSandboxPreference(defaultLocalSandboxPreference);
    }
    if (selectedModel !== "auto") {
      setSelectedModel("auto");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreeAgent]);

  // Fallback to 'ask' mode when temporary chats are enabled (agent modes not allowed)
  useEffect(() => {
    if (temporaryChatsEnabled && isAgentMode(chatMode)) {
      setChatMode("ask");
    }
  }, [temporaryChatsEnabled, chatMode, setChatMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const canSubmit =
      (status === "ready" || status === "streaming") &&
      !isUploadingFiles &&
      (input.trim() || uploadedFiles.length > 0);

    if (canSubmit) {
      onSubmit(e);
      if (clearDraftOnSubmit) {
        removeDraft(draftId);
        setTimeout(() => setInput(""), 0);
      }
    }
  };

  return (
    <div
      className={`relative min-w-0 px-4 ${isCentered ? "" : "pb-4 bg-gradient-to-b from-transparent via-background/80 to-background"}`}
    >
      <div className="mx-auto w-full max-w-full min-w-0 sm:max-w-[768px] sm:min-w-[390px] flex flex-col flex-1">
        {rateLimitWarning && onDismissRateLimitWarning && (
          <RateLimitWarning
            data={rateLimitWarning}
            onDismiss={onDismissRateLimitWarning}
          />
        )}

        <TodoPanel status={status} />

        {messageQueue.length > 0 && (
          <QueuedMessagesPanel
            messages={messageQueue}
            onSendNow={onSendNow}
            onDelete={removeQueuedMessage}
            isStreaming={status === "streaming"}
            queueBehavior={queueBehavior}
            onQueueBehaviorChange={setQueueBehavior}
          />
        )}

        {/* Sandbox selector for new chats on mobile: shown above input & file upload.
            Once the first message is sent, switches to below-input placement immediately
            (isNewChat doesn't flip until the stream finishes, so we also check hasMessages).
            On desktop, it's shown below the input (order-3). */}
        {isMobile && isNewChat && !hasMessages && isAgentMode(chatMode) && (
          <div className="flex px-1 pb-2 min-h-9">
            <SandboxSelector
              value={sandboxPreference}
              onChange={setSandboxPreference}
            />
          </div>
        )}

        {uploadedFiles && uploadedFiles.length > 0 && (
          <FileUploadPreview
            uploadedFiles={uploadedFiles}
            onRemoveFile={handleRemoveFile}
          />
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="*"
          multiple
          className="hidden"
          aria-label="Upload files"
          onChange={handleFileUploadEvent}
        />

        <div
          className={`order-2 sm:order-1 flex max-h-[300px] min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-input-chat transition-[border-color] duration-200 focus-within:border-border-strong ${uploadedFiles && uploadedFiles.length > 0 ? "border-t-0" : ""}`}
        >
          <div className="flex flex-col gap-2 px-3 py-2.5 pb-2">
            <ChatInputTextarea
              draftId={draftId}
              chatMode={chatMode}
              onEnterSubmit={handleSubmit}
              minRows={isCentered ? 3 : 1}
              placeholder={placeholder ?? purposePlaceholder(chatPurpose)}
              autoFocus={autoFocus}
            />
            <ChatInputToolbar
              onAttachClick={handleAttachClick}
              isGenerating={isGenerating}
              hideStop={hideStop}
              onStop={onStop}
              onSubmit={handleSubmit}
              status={status}
              isUploadingFiles={isUploadingFiles}
              input={input}
              uploadedFiles={uploadedFiles}
              chatMode={chatMode}
              contextUsage={contextUsage}
              showContextIndicator={showContextIndicator}
              contextUsageVariant={isMobile ? "compact-popover" : "tooltip"}
            />
          </div>
        </div>

        {/* Sandbox selector below input.
            Desktop centered new chats (no messages yet): absolutely positioned to avoid
            shifting the centered layout.
            Existing chats / after first message sent (all screens): normal flow.
            Mobile new chats with no messages: hidden (uses above-input placement). */}
        {isAgent && (!isMobile || !isNewChat || hasMessages) && (
          <div
            className={`order-3 flex items-center px-1 pt-2 md:hidden ${isNewChat && !hasMessages ? "absolute left-4 right-4 top-full" : ""}`}
          >
            <SandboxSelector
              value={sandboxPreference}
              onChange={setSandboxPreference}
            />
          </div>
        )}

        {onScrollToBottom && (
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-40">
            <ScrollToBottomButton
              onClick={onScrollToBottom}
              hasMessages={hasMessages}
              isAtBottom={isAtBottom}
            />
          </div>
        )}
      </div>
    </div>
  );
};
