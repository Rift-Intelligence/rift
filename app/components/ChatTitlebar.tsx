"use client";

import { PanelLeft, Settings } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useGlobalState } from "@/app/contexts/GlobalState";
import { openSettingsDialog } from "@/lib/utils/settings-dialog";
import type { ChatListData } from "./Sidebar";

interface ChatTitlebarProps {
  chatListData: ChatListData;
}

/**
 * Minimal native window strip. Reserves space for the macOS traffic lights and
 * provides the draggable region, plus the two persistent window controls:
 * toggle the sidebar (left) and open settings (right).
 */
export function ChatTitlebar(_props: ChatTitlebarProps) {
  const { user, loading } = useAuth();
  const { toggleChatSidebar } = useGlobalState();

  if (loading || !user) return null;

  const btn =
    "flex h-[26px] w-[26px] items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <header
      className="rift-titlebar flex h-[35px] shrink-0 items-center gap-1 bg-sidebar px-3 pl-[78px] max-md:pl-3"
      data-testid="chat-titlebar"
    >
      <button
        type="button"
        onClick={toggleChatSidebar}
        aria-label="Toggle sidebar"
        className={btn}
      >
        <PanelLeft className="size-4" />
      </button>

      <button
        type="button"
        onClick={() => openSettingsDialog()}
        aria-label="Settings"
        className={`${btn} ml-auto`}
      >
        <Settings className="size-4" />
      </button>
    </header>
  );
}
