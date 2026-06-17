"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, PanelLeft, Settings, Plus, X } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useGlobalState } from "@/app/contexts/GlobalState";
import type { ChatListData } from "./Sidebar";
import { openSettingsDialog } from "@/lib/utils/settings-dialog";

interface ChatTitlebarProps {
  chatListData: ChatListData;
}

function getChatIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/c\/([^/]+)/);
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
    router.push("/");
  };

  const shortTitle = (title?: string | null) => {
    const t = title?.trim() || "New Chat";
    return t.length > 28 ? `${t.slice(0, 26)}…` : t;
  };

  return (
    <header
      className="rift-titlebar flex h-[35px] shrink-0 items-center border-b border-sidebar-border bg-sidebar px-3 pl-[78px] max-md:pl-3"
      data-testid="chat-titlebar"
    >
      <div className="flex min-w-0 flex-1 items-center gap-0.5">
        {tabChats.map((chat) => {
          const isActive =
            chat.id === currentChatId ||
            (!currentChatId && pathname === "/" && tabChats[0]?.id === chat.id);
          return (
            <button
              key={chat.id}
              type="button"
              onClick={() => router.push(`/c/${chat.id}`)}
              className={`group flex h-[26px] max-w-[200px] items-center gap-1.5 rounded px-2.5 text-xs transition-colors ${
                isActive
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
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
        {!currentChatId && pathname === "/" && tabChats.length === 0 && (
          <div className="flex h-[26px] items-center gap-1.5 rounded bg-background px-2.5 text-xs text-foreground">
            <MessageCircle className="size-3.5 shrink-0 opacity-70" />
            <span>New Chat</span>
          </div>
        )}
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="New chat"
          className="flex h-[26px] w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-4" />
        </button>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={toggleChatSidebar}
          aria-label="Toggle sidebar"
          className="flex h-[26px] w-[26px] items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <PanelLeft className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => openSettingsDialog()}
          aria-label="Settings"
          className="flex h-[26px] w-[26px] items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Settings className="size-4" />
        </button>
      </div>
    </header>
  );
}
