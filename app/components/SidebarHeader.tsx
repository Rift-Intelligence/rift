"use client";

import { useState, useEffect, useMemo, useSyncExternalStore, FC } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  PanelLeft,
  Sidebar as SidebarIcon,
  Plus,
  Search,
  Shield,
  Hammer,
  Image as ImageIcon,
  Blocks,
  Images,
  NotebookText,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { useGlobalState } from "../contexts/GlobalState";
import type { ChatPurpose } from "@/types/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChats } from "../hooks/useChats";
import { isTauriEnvironment } from "@/app/hooks/useTauri";
import { MessageSearchDialog } from "./MessageSearchDialog";

/**
 * The three chat modes the user can launch from the sidebar. Each opens a fresh
 * chat with the matching ChatPurpose (which drives the system prompt, model, and
 * execution path on the backend).
 */
const MODES: ReadonlyArray<{
  purpose: ChatPurpose;
  label: string;
  Icon: LucideIcon;
  title: string;
}> = [
  {
    purpose: "security",
    label: "Security",
    Icon: Shield,
    title: "New security chat — recon, vulns, exploitation",
  },
  {
    purpose: "app",
    label: "Build",
    Icon: Hammer,
    title: "New app build — describe an app or game, RIFT builds & runs it",
  },
  {
    purpose: "image",
    label: "Image",
    Icon: ImageIcon,
    title: "New image — describe a picture, RIFT generates it",
  },
];

/**
 * Shared style for the primary sidebar nav rows (New chat / Projects / Plugins /
 * Artifacts / Pentest Notebook) so they read as one uniform, tightly-stacked
 * list — same size, same padding, same weight. Also reused by SidebarProjects.
 */
export function sidebarNavRowClass(active: boolean): string {
  return `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] font-medium transition-colors ${
    active
      ? "bg-sidebar-accent text-foreground"
      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
  }`;
}

/**
 * Canonical style for a collapsible sidebar SECTION label (Operations /
 * Projects / Recent). One shared token keeps every section header identical —
 * same size, tracking, weight, and colour — for a calm, professional rhythm.
 */
export const SIDEBAR_SECTION_LABEL_CLASS =
  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground/55 transition-colors hover:text-muted-foreground";

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
  const pathname = usePathname();
  const {
    setChatSidebarOpen,
    closeSidebar,
    initializeNewChat,
    setTemporaryChatsEnabled,
    chatPurpose,
    toggleChatSidebar,
  } = useGlobalState();

  // Search dialog state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // On the desktop app the macOS traffic lights overlay the sidebar's top-left,
  // so the header needs extra top padding to clear them. In the browser there
  // are no traffic lights, so the header sits flush at the top (Mistral-like).
  // useSyncExternalStore keeps the server snapshot (false) distinct from the
  // client value, avoiding a hydration mismatch without a setState-in-effect.
  const isDesktop = useSyncExternalStore(
    () => () => {},
    () => isTauriEnvironment(),
    () => false,
  );

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

  // Launch a fresh chat in a specific mode (purpose). initializeNewChat sets the
  // purpose + forces the matching execution path (app→agent, image→ask).
  const launchMode = (purpose: ChatPurpose) => {
    // Close computer sidebar when creating new chat
    closeSidebar();

    // Close chat sidebar when creating new chat on mobile screens
    // On desktop, keep it open for better UX on large screens
    // On mobile screens, close it to give more space for the chat
    if (isMobile) {
      setChatSidebarOpen(false);
    }

    // Reset chat state while current Chat is still mounted (so chatResetRef is set)
    initializeNewChat(purpose);
    setTemporaryChatsEnabled(false);
    router.push("/");
  };

  // The generic "New Chat" button defaults to the security agent.
  const handleNewChat = () => launchMode("security");

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
            <RiftPixelMark size={26} />
            {/* Sidebar icon shown on hover over entire collapsed sidebar */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar/80 rounded">
              <SidebarIcon className="w-5 h-5" />
            </div>
          </div>

          {/* Sidebar Actions - Collapsed */}
          <div className="flex flex-col items-center">
            {/* Mode launchers - Collapsed (Security / Build / Image) */}
            {MODES.map(({ purpose, label, Icon, title }) => (
              <div key={purpose} className="p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 w-8 p-0 ${
                    chatPurpose === purpose
                      ? "bg-sidebar-accent text-foreground"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                  onClick={() => launchMode(purpose)}
                  aria-label={`New ${label} chat`}
                  title={title}
                >
                  <Icon className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {/* Plugins (MCP marketplace) - Collapsed */}
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${
                  pathname === "/plugins"
                    ? "bg-sidebar-accent text-foreground"
                    : "hover:bg-sidebar-accent/50"
                }`}
                onClick={() => router.push("/plugins")}
                aria-label="Plugins"
                title="Plugins — connect MCP servers & tools"
              >
                <Blocks className="w-4 h-4" />
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
      {/* Mode switcher — at the VERY TOP: three DISTINCT workspaces (Security /
          Build / Image) as a Claude-style segmented control (à la Code / Cowork
          / Ask). The active one is raised; clicking a segment opens a fresh chat
          in that mode. Carries the desktop traffic-light clearance as the
          topmost element. */}
      {/* Collapse toggle — slim top control; carries the desktop traffic-light
          clearance as the topmost element. */}
      <div
        className={`flex items-center justify-end gap-1 px-2.5 ${isDesktop ? "pt-9 pb-1" : "pt-2 pb-1"}`}
      >
        <button
          type="button"
          onClick={handleSearchOpen}
          aria-label="Search chats"
          title={`Search chats (${modifierKey}K)`}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Search className="size-[15px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={toggleChatSidebar}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <PanelLeft className="size-[15px]" strokeWidth={1.75} />
        </button>
      </div>

      {/* Mode switcher — three DISTINCT workspaces (Security / Build / Image) as
          a Claude-style segmented control. */}
      <div className="px-2 pb-2.5">
        <div
          role="tablist"
          aria-label="Workspace mode"
          className="flex items-center gap-1 rounded-xl bg-black/15 p-1 dark:bg-black/25"
        >
          {MODES.map(({ purpose, label, Icon, title }) => {
            const isActive = chatPurpose === purpose;
            return (
              <button
                key={purpose}
                type="button"
                role="tab"
                onClick={() => launchMode(purpose)}
                aria-label={`Switch to ${label} mode`}
                aria-selected={isActive}
                title={title}
                className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-lg px-0.5 py-2 text-[10.5px] font-medium transition-colors ${
                  isActive
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-card/50 hover:text-foreground"
                }`}
              >
                <Icon className="size-[15px] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary nav — one uniform, tightly-stacked list (New chat / Plugins /
          Artifacts / Pentest Notebook), all the same size & style. Search moved
          to an icon by the collapse toggle; Projects to its own section below. */}
      <div className="space-y-px px-2 pb-1">
        <button
          type="button"
          onClick={handleNewChat}
          aria-label="Start new chat"
          className={sidebarNavRowClass(false)}
        >
          <Plus className="size-[15px] shrink-0" strokeWidth={1.5} />
          New chat
        </button>

        <button
          type="button"
          onClick={() => router.push("/plugins")}
          aria-pressed={pathname === "/plugins"}
          title="Plugins — connect MCP servers & tools"
          className={sidebarNavRowClass(pathname === "/plugins")}
        >
          <Blocks className="size-[15px] shrink-0" strokeWidth={1.5} />
          Plugins
        </button>

        {/* Artifacts — image gallery. Only relevant to Build & Image modes. */}
        {chatPurpose !== "security" && (
          <button
            type="button"
            onClick={() => router.push("/artifacts")}
            aria-pressed={pathname === "/artifacts"}
            title="Artifacts — all your images, sent & generated"
            className={sidebarNavRowClass(pathname === "/artifacts")}
          >
            <Images className="size-[15px] shrink-0" strokeWidth={1.5} />
            Artifacts
          </button>
        )}

        {/* Pentest Notebook — only in Security mode. */}
        {chatPurpose === "security" && (
          <button
            type="button"
            onClick={() => router.push("/notebook")}
            aria-pressed={pathname === "/notebook"}
            title="Pentest Notebook — findings, methodology & report notes"
            className={sidebarNavRowClass(pathname === "/notebook")}
          >
            <NotebookText className="size-[15px] shrink-0" strokeWidth={1.5} />
            Pentest Notebook
          </button>
        )}
      </div>

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
