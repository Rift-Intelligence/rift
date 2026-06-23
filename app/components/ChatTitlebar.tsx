"use client";

import { PanelLeft } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useGlobalState } from "@/app/contexts/GlobalState";
import type { ChatListData } from "./Sidebar";

interface ChatTitlebarProps {
  chatListData: ChatListData;
}

/**
 * Minimal native window strip. Intentionally (almost) empty — it exists to
 * (1) reserve space for the macOS traffic lights, (2) provide the draggable
 * region for the desktop window, and (3) offer a single, subtle control to
 * re-open the sidebar when it's collapsed (otherwise there'd be no affordance
 * to bring it back). New-chat, settings and tab switching all live in the
 * sidebar, so nothing else needs to clutter the top.
 */
export function ChatTitlebar(_props: ChatTitlebarProps) {
  const { user, loading } = useAuth();
  const { toggleChatSidebar, chatSidebarOpen } = useGlobalState();

  if (loading || !user) return null;

  return (
    <header
      className="rift-titlebar flex h-[35px] shrink-0 items-center bg-sidebar px-3 pl-[78px] max-md:pl-3"
      data-testid="chat-titlebar"
    >
      {!chatSidebarOpen && (
        <button
          type="button"
          onClick={toggleChatSidebar}
          aria-label="Open sidebar"
          className="flex h-[26px] w-[26px] items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
      )}
    </header>
  );
}
