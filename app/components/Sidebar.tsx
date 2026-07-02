"use client";

import { FC, useRef } from "react";
import { useGlobalState } from "../contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChats } from "../hooks/useChats";
import {
  Sidebar,
  SidebarContent,
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
import { SidebarProjects } from "./SidebarProjects";

/** Chat list data lifted from parent so the subscription stays active when sidebar closes. */
export type ChatListData = ReturnType<typeof useChats>;

// ChatList component content - receives data from parent to avoid refetch on open/close
const ChatListContent: FC<{ chatListData: ChatListData }> = ({
  chatListData,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { chatPurpose } = useGlobalState();
  // Operations (the pentest arsenal) is Security-only; Build & Image get a
  // simpler sidebar (Projects + recent).
  const isSecurity = chatPurpose === "security";

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Operations — the primary surface in Security mode, so it sits at the
          very top, above Projects. Hidden in Build / Image modes. */}
      {isSecurity && <PentestArsenal />}

      {/* Projects — its own section, below Operations. */}
      <SidebarProjects />

      {/* Chat history — pinned small under Operations in Security mode; grows to
          fill the sidebar when Operations is hidden (Build / Image). */}
      <div
        className={`overflow-y-auto overflow-x-hidden terminal-scrollbar ${
          isSecurity ? "max-h-[180px] shrink-0" : "min-h-0 flex-1"
        }`}
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
      collapsible="none"
      className={`${isMobile ? "w-full" : "w-[260px]"}`}
    >
      <SidebarHeader>
        <SidebarHeaderContent
          handleCloseSidebar={handleCloseSidebar}
          isCollapsed={isCollapsed}
        />
      </SidebarHeader>

      <SidebarContent className="min-h-0 flex-1">
        <SidebarGroup className="min-h-0 flex-1 overflow-hidden">
          <SidebarGroupContent className="h-full min-h-0">
            <ChatListContent chatListData={chatListData} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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

          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatListContent chatListData={chatListData} />
          </div>

          {/* Footer */}
          <div className="p-2 pb-3">
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
