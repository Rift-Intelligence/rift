"use client";

import { FC, useRef } from "react";
import { useGlobalState } from "../contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChats } from "../hooks/useChats";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import SidebarUserNav from "./SidebarUserNav";
import SidebarHistory from "./SidebarHistory";
import SidebarHeaderContent from "./SidebarHeader";
import { PentestArsenal } from "./PentestArsenal";

/** Chat list data lifted from parent so the subscription stays active when sidebar closes. */
export type ChatListData = ReturnType<typeof useChats>;

// ChatList component content - receives data from parent to avoid refetch on open/close
const ChatListContent: FC<{ chatListData: ChatListData }> = ({
  chatListData,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="h-full min-w-0 overflow-y-auto overflow-x-hidden terminal-scrollbar"
      ref={scrollContainerRef}
      data-testid="sidebar-chat-list-scroll-container"
    >
      <SidebarHistory
        chats={chatListData.results || []}
        paginationStatus={chatListData.status}
        loadMore={chatListData.loadMore}
        containerRef={scrollContainerRef}
      />
    </div>
  );
};

// Desktop-only sidebar content (requires SidebarProvider context)
const DesktopSidebarContent: FC<{
  isMobile: boolean;
  handleCloseSidebar: () => void;
  chatListData: ChatListData;
}> = ({ isMobile, handleCloseSidebar, chatListData }) => {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      side="left"
      collapsible="icon"
      className={`${isMobile ? "w-full" : "w-72"} terminal-sidebar`}
    >
      <SidebarHeader>
        <SidebarHeaderContent
          handleCloseSidebar={handleCloseSidebar}
          isCollapsed={isCollapsed}
        />
      </SidebarHeader>

      <SidebarContent>
        {!isCollapsed && (
          <SidebarGroup className="pb-1">
            <SidebarGroupContent>
              <div className="mx-2 mb-1 font-mono">
                {/* framed system-status readout */}
                <div className="hud scanlines bg-black/40 px-2.5 py-2">
                  <span className="hud-corners" aria-hidden />
                  <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span>{"// status"}</span>
                    <span className="text-primary/70">0x1F</span>
                  </div>
                  <div className="space-y-0.5 text-[10px] leading-tight text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block size-1.5 rounded-full bg-primary eye-live" />
                      <span className="tracking-wider text-foreground/80">
                        SYS
                      </span>
                      <span className="ml-auto text-primary">ONLINE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-primary/60">▸</span> SANDBOX
                      <span className="ml-auto text-primary">READY</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-primary/60">▸</span> LINK
                      <span className="ml-auto text-primary">SECURE</span>
                      <span className="terminal-cursor inline-block !h-2.5 !w-1.5" />
                    </div>
                  </div>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {!isCollapsed && (
          <SidebarGroup className="pb-1">
            <SidebarGroupContent>
              <PentestArsenal />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        {/* Chat history is intentionally hidden from the sidebar; it is
            reachable via the "Search chats" dialog in the header. This group is
            just a flexible spacer so the footer sits at the bottom. */}
        <SidebarGroup className="min-h-0 flex-1" />
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserNav isCollapsed={isCollapsed} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const MainSidebar: FC<{
  isMobileOverlay?: boolean;
  /** When provided (e.g. from ChatLayout), avoids refetching when sidebar opens/closes */
  chatListData?: ChatListData;
}> = ({ isMobileOverlay = false, chatListData: chatListDataProp }) => {
  const isMobile = useIsMobile();
  const { setChatSidebarOpen } = useGlobalState();
  // Use lifted data when provided; otherwise subscribe here (e.g. SharedChatView)
  const chatListDataFromHook = useChats();
  const chatListData = chatListDataProp ?? chatListDataFromHook;

  const handleCloseSidebar = () => {
    setChatSidebarOpen(false);
  };

  // Mobile overlay version - simplified without Sidebar wrapper
  if (isMobileOverlay) {
    return (
      <>
        <div className="flex flex-col h-full w-full bg-sidebar border-r">
          {/* Header with Actions */}
          <SidebarHeaderContent
            handleCloseSidebar={handleCloseSidebar}
            isCollapsed={false}
            isMobileOverlay={true}
          />

          {/* Pentest Arsenal */}
          <div className="border-b border-sidebar-border/60 pb-1">
            <PentestArsenal />
          </div>

          {/* Chat history hidden — reachable via the "Search chats" dialog. */}
          <div className="flex-1 overflow-hidden" />

          {/* Footer */}
          <div className="p-2">
            <SidebarUserNav isCollapsed={false} />
          </div>
        </div>
      </>
    );
  }

  return (
    <DesktopSidebarContent
      isMobile={isMobile ?? false}
      handleCloseSidebar={handleCloseSidebar}
      chatListData={chatListData}
    />
  );
};

export default MainSidebar;
