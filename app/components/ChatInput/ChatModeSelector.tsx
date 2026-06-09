"use client";

import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { ModeSelectorTrigger, ModeSelectorContent } from "./ModeSelectorMenu";
import { useGlobalState } from "@/app/contexts/GlobalState";
import { useAuth } from "@/app/hooks/useAuth";
import { toast } from "sonner";
import { navigateToAuth } from "@/app/hooks/useTauri";

export interface ChatModeSelectorProps {
  className?: string;
}

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
    // Agent mode is available to every signed-in user (billing/tiers removed).
    // Cloud E2B is the default sandbox; if a local sandbox is configured, honor
    // the user's local preference.
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

  return (
    <div
      className={`flex items-center gap-1.5 min-w-0 overflow-hidden ${className ?? ""}`}
    >
      <DropdownMenu>
        <ModeSelectorTrigger chatMode={chatMode} />
        <ModeSelectorContent
          setChatMode={setChatMode}
          onAgentModeClick={handleAgentModeClick}
          temporaryChatsEnabled={temporaryChatsEnabled}
        />
      </DropdownMenu>
    </div>
  );
}
