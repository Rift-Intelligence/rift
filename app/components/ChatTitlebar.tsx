"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, PanelLeft, Settings, Plus, X } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useGlobalState } from "@/app/contexts/GlobalState";
import type { ChatListData } from "./Sidebar";
import { openSettingsDialog } from "@/lib/utils/settings-dialog";
import {
  chatRoute,
  isHomePath,
  useAppShell,
} from "@/app/contexts/AppShellContext";

interface ChatTitlebarProps {
  chatListData: ChatListData;
}

function getChatIdFromPath(pathname: string): string | null {
  const match = pathname.match(/\/c\/([^/]+)/);
  return match?.[1] ?? null;
}

export function ChatTitlebar({ chatListData }: ChatTitlebarProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const {
    toggleChatSidebar,
    initializeNewChat,
    closeSidebar,
    chatSidebarOpen,
  } = useGlobalState();

  const { titlebarClass, basePath, variant } = useAppShell();
  const currentChatId = getChatIdFromPath(pathname);
  const chats = chatListData.results ?? [];

  const tabChats = useMemo(() => {
    if (!currentChatId) {
      return chats.slice(0, 2);
    }
    const current = chats.find((c) => c.id === currentChatId);
    const others = chats.filter((c) => c.id !== currentChatId).slice(0, 1);
    if (current) return [current, ...others];
    return chats.slice(0, 2);
  }, [chats, currentChatId]);

  if (loading || !user) return null;

  const handleNewChat = () => {
    closeSidebar();
    initializeNewChat();
    router.push(basePath);
  };

  const shortTitle = (title?: string | null) => {
    const t = title?.trim() || "New Chat";
    return t.length > 28 ? `${t.slice(0, 26)}…` : t;
  };

  return (
    <header
      className={`${titlebarClass} flex h-10 shrink-0 items-center border-b px-3 pl-[78px] max-md:pl-3`}
      data-testid="chat-titlebar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {tabChats.map((chat) => {
          const isActive =
            chat.id === currentChatId ||
            (!currentChatId &&
              isHomePath(pathname, basePath) &&
              tabChats[0]?.id === chat.id);
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => router.push(chatRoute(basePath, chat.id))}
              className={`group flex h-7 max-w-[200px] items-center gap-1.5 px-3 text-[11px] transition-colors ${
                variant === "studio"
                  ? "studio-title-pill rounded-md"
                  : "rounded-full"
              } ${
                isActive
                  ? "border border-border/60 bg-background/80 text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
              }`}
            >
              <MessageCircle className="size-3.5 shrink-0 opacity-70" />
              <span className="truncate">{shortTitle(chat.title)}</span>
              <span className="ml-0.5 text-sm opacity-0 transition-opacity group-hover:opacity-60">
                <X className="size-3" aria-hidden />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="New chat"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2/60 hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={toggleChatSidebar}
          aria-label="Toggle sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2/60 hover:text-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => openSettingsDialog()}
          aria-label="Settings"
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2/60 hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
