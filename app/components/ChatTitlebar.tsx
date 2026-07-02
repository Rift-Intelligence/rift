"use client";

import { PanelLeft } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import { useGlobalState } from "@/app/contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ChatListData } from "./Sidebar";

interface ChatTitlebarProps {
  chatListData: ChatListData;
}

/**
 * Minimal native window strip. Reserves space for the macOS traffic lights and
 * provides the draggable region plus the sidebar toggle (left). Settings now
 * lives in the bottom user menu (see SidebarUserNav).
 */
export function ChatTitlebar(_props: ChatTitlebarProps) {
  const { user, loading } = useAuth();
  const { toggleChatSidebar, chatSidebarOpen } = useGlobalState();
  const isMobile = useIsMobile();

  if (loading || !user) return null;

  const btn =
    "pointer-events-auto flex h-[26px] w-[26px] items-center justify-center rounded bg-background/60 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-foreground";

  // Transparent, absolutely-positioned drag strip overlaying the very top of the
  // app — instead of a full-width bar that pushes everything down and paints a
  // seam over the content. The sidebar (bg-sidebar) and the content
  // (bg-background) now each fill up to the very top with no cut, while this
  // still reserves the macOS traffic-light area (pl-[78px]) and provides the
  // window drag region on desktop. pointer-events-none lets clicks fall through
  // to whatever is beneath; only the reopen toggle re-enables pointer events.
  return (
    <header
      className="rift-titlebar pointer-events-none absolute inset-x-0 top-0 z-30 flex h-9 items-center gap-1 px-3 pl-[78px] max-md:pl-3"
      data-testid="chat-titlebar"
    >
      {/* The toggle now lives next to New Chat in the sidebar header, and the
          collapsed SidebarRail (desktop) has its own expand affordance on the
          logo. Only show this floating one on mobile, where closing the
          sidebar hides it completely with no rail left behind. */}
      {isMobile !== false && !chatSidebarOpen && (
        <button
          type="button"
          onClick={toggleChatSidebar}
          aria-label="Toggle sidebar"
          className={btn}
        >
          <PanelLeft className="size-4" />
        </button>
      )}
    </header>
  );
}
