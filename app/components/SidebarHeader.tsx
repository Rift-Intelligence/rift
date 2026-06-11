"use client";

import { useState, useEffect, useMemo, FC } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  Sidebar as SidebarIcon,
  SquarePen,
  Search,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { RiftLogo } from "@/components/icons/rift-logo";
import { useGlobalState } from "../contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChats } from "../hooks/useChats";
import { MessageSearchDialog } from "./MessageSearchDialog";

interface SidebarHeaderContentProps {
  /** Function to handle closing the sidebar */
  handleCloseSidebar: () => void;
  /** Whether the sidebar is collapsed */
  isCollapsed: boolean;
  /** Whether this is being used in mobile overlay (without SidebarProvider) */
  isMobileOverlay?: boolean;
}

// Shared implementation component
interface SidebarHeaderContentImplProps {
  handleCloseSidebar: () => void;
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarHeaderContentImpl: FC<SidebarHeaderContentImplProps> = ({
  handleCloseSidebar,
  isCollapsed,
  toggleSidebar,
}) => {
  const isMobile = useIsMobile();
  const router = useRouter();
  const {
    setChatSidebarOpen,
    closeSidebar,
    initializeNewChat,
    setTemporaryChatsEnabled,
  } = useGlobalState();

  // Search dialog state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Fetch chats when search dialog is opened to ensure data is available
  // This handles the case where user opens search without opening sidebar first
  useChats(isSearchOpen);

  // Detect if user is on Mac
  const isMac = useMemo(
    () => /macintosh|mac os x/i.test(navigator.userAgent),
    [],
  );

  // Platform-specific modifier key
  const modifierKey = isMac ? "⌘" : "Ctrl+";

  // Add keyboard shortcut for search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNewChat = () => {
    // Close computer sidebar when creating new chat
    closeSidebar();

    // Close chat sidebar when creating new chat on mobile screens
    // On desktop, keep it open for better UX on large screens
    // On mobile screens, close it to give more space for the chat
    if (isMobile) {
      setChatSidebarOpen(false);
    }

    // Reset chat state while current Chat is still mounted (so chatResetRef is set)
    initializeNewChat();
    setTemporaryChatsEnabled(false);
    router.push("/");
  };

  const handleSearchOpen = () => {
    setIsSearchOpen(true);
  };

  const handleSearchClose = () => {
    setIsSearchOpen(false);
  };

  if (isCollapsed) {
    return (
      <>
        <div className="flex flex-col items-center p-2">
          {/* RIFT Logo with hover sidebar toggle */}
          <div
            data-testid="sidebar-toggle"
            className="relative flex items-center justify-center mb-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terminal-green focus-visible:ring-offset-2 rounded p-1"
            onClick={toggleSidebar}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                if (e.key === " ") {
                  e.preventDefault();
                }
                toggleSidebar();
              }
            }}
            tabIndex={0}
            role="button"
            aria-label="Expand sidebar"
          >
            <RiftLogo size={26} className="text-terminal-green" glow />
            {/* Sidebar icon shown on hover over entire collapsed sidebar */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar/80 rounded">
              <SidebarIcon className="w-5 h-5" />
            </div>
          </div>

          {/* Sidebar Actions - Collapsed */}
          <div className="flex flex-col items-center">
            {/* New Chat Button - Collapsed */}
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-sidebar-accent/50"
                onClick={handleNewChat}
                aria-label="Start new chat"
              >
                <SquarePen className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Button - Collapsed */}
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-sidebar-accent/50"
                onClick={handleSearchOpen}
                aria-label="Search chats"
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Search Dialog */}
        <MessageSearchDialog
          isOpen={isSearchOpen}
          onClose={handleSearchClose}
        />
      </>
    );
  }

  return (
    <>
      {/* Brand row + collapse */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={handleNewChat}
          className="group flex items-center gap-2 focus-visible:outline-none"
          aria-label="RIFT home"
        >
          <RiftLogo
            size={20}
            className="text-primary transition-transform group-hover:scale-110"
            glow
          />
          <span className="font-mono text-sm font-semibold tracking-[0.2em] text-foreground">
            RIFT
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            v1.0
          </span>
        </button>
        <Button
          data-testid="sidebar-toggle"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={handleCloseSidebar}
          aria-label="Collapse sidebar"
        >
          <PanelLeft className="size-4" />
        </Button>
      </div>

      {/* Terminal command actions */}
      <div className="px-2 pb-1 font-mono text-[13px]">
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className="group flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          <span className="text-primary/70 group-hover:text-primary">▸</span>
          <SquarePen className="size-3.5 opacity-70" />
          <span className="flex-1">new session</span>
          <kbd className="rounded-[2px] border border-sidebar-border px-1 text-[10px] text-muted-foreground">
            ⏎
          </kbd>
        </button>

        <button
          type="button"
          onClick={handleSearchOpen}
          aria-label="Search chats"
          className="group flex w-full items-center gap-2 border border-transparent px-2 py-1.5 text-left text-foreground/85 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
        >
          <span className="text-primary/70 group-hover:text-primary">▸</span>
          <Search className="size-3.5 opacity-70" />
          <span className="flex-1">search logs</span>
          <kbd className="rounded-[2px] border border-sidebar-border px-1 text-[10px] text-muted-foreground">
            {modifierKey}K
          </kbd>
        </button>
      </div>

      {/* Search Dialog */}
      <MessageSearchDialog isOpen={isSearchOpen} onClose={handleSearchClose} />
    </>
  );
};

// Desktop sidebar header component (requires SidebarProvider)
const DesktopSidebarHeaderContent: FC<
  Omit<SidebarHeaderContentProps, "isMobileOverlay">
> = ({ handleCloseSidebar, isCollapsed }) => {
  const { toggleSidebar } = useSidebar();
  return (
    <SidebarHeaderContentImpl
      handleCloseSidebar={handleCloseSidebar}
      isCollapsed={isCollapsed}
      toggleSidebar={toggleSidebar}
    />
  );
};

// Mobile sidebar header component (doesn't use SidebarProvider)
const MobileSidebarHeaderContent: FC<
  Omit<SidebarHeaderContentProps, "isMobileOverlay">
> = ({ handleCloseSidebar, isCollapsed }) => {
  const toggleSidebar = () => {}; // No-op for mobile
  return (
    <SidebarHeaderContentImpl
      handleCloseSidebar={handleCloseSidebar}
      isCollapsed={isCollapsed}
      toggleSidebar={toggleSidebar}
    />
  );
};

// Main component that conditionally renders based on context
const SidebarHeaderContent: FC<SidebarHeaderContentProps> = ({
  handleCloseSidebar,
  isCollapsed,
  isMobileOverlay = false,
}) => {
  if (isMobileOverlay) {
    return (
      <MobileSidebarHeaderContent
        handleCloseSidebar={handleCloseSidebar}
        isCollapsed={isCollapsed}
      />
    );
  }

  return (
    <DesktopSidebarHeaderContent
      handleCloseSidebar={handleCloseSidebar}
      isCollapsed={isCollapsed}
    />
  );
};

export default SidebarHeaderContent;
