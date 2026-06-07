import { useEffect, useCallback } from "react";
import { useGlobalState } from "../contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SidebarContent } from "@/types/chat";

/**
 * Module-level guard so the agent activity panel auto-opens at most once per
 * page load. After the first tool runs we surface the live activity, but we
 * never fight the operator if they choose to close it again.
 */
let hasAutoOpenedToolSidebar = false;

interface UseToolSidebarOptions {
  /** The toolCallId for this tool invocation */
  toolCallId: string;
  /**
   * The sidebar content to display. Return null if not yet ready to show.
   * IMPORTANT: Must be memoized with useMemo to prevent unnecessary updates.
   */
  content: SidebarContent | null;
  /** Type guard to check if current sidebar content matches this tool type */
  typeGuard: (content: SidebarContent) => boolean;
  /** Set to true to disable sidebar functionality entirely (e.g., open_url tool) */
  disabled?: boolean;
}

interface UseToolSidebarResult {
  /** Open this tool's content in the sidebar */
  handleOpenInSidebar: () => void;
  /** Keyboard handler (Enter/Space) to open sidebar */
  handleKeyDown: (e: React.KeyboardEvent) => void;
  /** Whether the sidebar is currently showing this tool's content */
  isSidebarActive: boolean;
}

/**
 * Reusable hook for tool sidebar integration. Handles:
 * - Opening sidebar with tool content on click/keyboard
 * - Detecting if sidebar is currently showing this tool
 * - Auto-updating sidebar content in real-time when active
 */
export function useToolSidebar({
  toolCallId,
  content,
  typeGuard,
  disabled = false,
}: UseToolSidebarOptions): UseToolSidebarResult {
  const {
    openSidebar,
    closeSidebar,
    sidebarOpen,
    sidebarContent,
    updateSidebarContent,
  } = useGlobalState();
  const isMobile = useIsMobile();

  const isSidebarActive =
    !disabled &&
    sidebarOpen &&
    sidebarContent != null &&
    typeGuard(sidebarContent) &&
    "toolCallId" in sidebarContent &&
    (sidebarContent as { toolCallId?: string }).toolCallId === toolCallId;

  const handleOpenInSidebar = useCallback(() => {
    if (disabled || !content) return;
    openSidebar(content);
  }, [disabled, content, openSidebar]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleOpenInSidebar();
        return;
      }

      if (e.key === "Escape" && isSidebarActive) {
        e.preventDefault();
        closeSidebar();
      }
    },
    [closeSidebar, handleOpenInSidebar, isSidebarActive],
  );

  // Auto-update sidebar content in real-time when active
  useEffect(() => {
    if (!isSidebarActive || !content) return;
    updateSidebarContent(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSidebarActive, content]);

  // Surface the agent activity panel the first time a tool produces content,
  // so the live terminal/file/command stream is prominent. Desktop only, and
  // only once per page load so we never repeatedly fight the operator.
  useEffect(() => {
    if (hasAutoOpenedToolSidebar) return;
    // Require an explicit desktop result (isMobile is undefined on first render).
    if (disabled || !content || isMobile !== false) return;
    hasAutoOpenedToolSidebar = true;
    if (!sidebarOpen) openSidebar(content);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, content, isMobile]);

  return { handleOpenInSidebar, handleKeyDown, isSidebarActive };
}
