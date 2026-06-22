"use client";

import { useGlobalState } from "@/app/contexts/GlobalState";
import { useAuth } from "@/app/hooks/useAuth";
import { toast } from "sonner";
import { navigateToAuth } from "@/app/hooks/useTauri";
import type { ChatMode } from "@/types/chat";

export interface ChatModeSelectorProps {
  className?: string;
}

const pillBase =
  "inline-flex h-6 items-center gap-1.5 rounded-md border-0 px-2 text-[11.5px] transition-colors";

export function ChatModeSelector({ className }: ChatModeSelectorProps) {
  const {
    chatMode,
    setChatMode,
    temporaryChatsEnabled,
    hasLocalSandbox,
    defaultLocalSandboxPreference,
    sandboxPreference,
    setSandboxPreference,
    selectedModel,
    setSelectedModel,
  } = useGlobalState();
  const { user } = useAuth();

  const handleAgentModeClick = () => {
    if (!user) {
      navigateToAuth("/signup", { preferSignInForReturningUser: true });
      return;
    }
    if (temporaryChatsEnabled) {
      toast.info("Agent mode requires chat history", {
        description: "Turn off temporary chat to use Agent mode.",
      });
      return;
    }
    setChatMode("agent");
    if (hasLocalSandbox) {
      if (sandboxPreference === "e2b" || !sandboxPreference) {
        if (defaultLocalSandboxPreference) {
          setSandboxPreference(defaultLocalSandboxPreference);
        }
      }
      if (selectedModel !== "auto") {
        setSelectedModel("auto");
      }
    }
  };

  const setMode = (mode: ChatMode) => {
    if (mode === "agent") handleAgentModeClick();
    else setChatMode("ask");
  };

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>
      <button
        type="button"
        data-testid="mode-agent-pill"
        onClick={() => setMode("agent")}
        className={`${pillBase} ${
          chatMode === "agent"
            ? "bg-accent text-foreground"
            : "bg-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`}
      >
        Agent
      </button>
      <button
        type="button"
        data-testid="mode-ask-pill"
        onClick={() => setMode("ask")}
        className={`${pillBase} ${
          chatMode === "ask"
            ? "bg-accent text-foreground"
            : "bg-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        }`}
      >
        Ask
      </button>
    </div>
  );
}
