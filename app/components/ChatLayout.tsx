"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGlobalState } from "../contexts/GlobalState";
import { useChats } from "../hooks/useChats";
import { SidebarProvider } from "@/components/ui/sidebar";
import MainSidebar from "./Sidebar";
import SidebarUserNav from "./SidebarUserNav";
import { SettingsDialog } from "./SettingsDialog";
import { ChatTitlebar } from "./ChatTitlebar";
import { onOpenSettingsDialog } from "@/lib/utils/settings-dialog";

/**
 * Shared layout for chat routes: Chat Sidebar (left) + main content slot.
 * Stays mounted across / and /c/[id] navigation so the sidebar does not re-render.
 * Does NOT include the Computer Sidebar (right); that remains in ChatContent.
 */
export function ChatLayout({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const { chatSidebarOpen, setChatSidebarOpen } = useGlobalState();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep chat list subscription in layout so it doesn't refetch when sidebar opens/closes
  const chatListData = useChats();
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Settings dialog — local state, opened via custom event from anywhere
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsDialogTab, setSettingsDialogTab] = useState<string | null>(
    null,
  );

  const handleOpenSettings = useCallback((tab?: string) => {
    setSettingsDialogTab(null);
    // Force a fresh state change even if the same tab is requested again
    queueMicrotask(() => {
      setSettingsDialogTab(tab ?? null);
      setSettingsDialogOpen(true);
    });
  }, []);

  useEffect(
    () => onOpenSettingsDialog(handleOpenSettings),
    [handleOpenSettings],
  );

  // Escape key handler and focus trap for mobile overlay
  useEffect(() => {
    if (!isMobile || !chatSidebarOpen) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus trap: Get all focusable elements within the panel
    const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
      const selector = [
        "a[href]",
        "button:not([disabled])",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(", ");
      return Array.from(container.querySelectorAll<HTMLElement>(selector));
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setChatSidebarOpen(false);
        return;
      }

      if (e.key !== "Tab" || !panelRef.current) return;

      const focusableElements = getFocusableElements(panelRef.current);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift+Tab: if focus is on first element, move to last
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if focus is on last element, move to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    // Focus the first focusable element when overlay opens
    const focusFirstElement = () => {
      if (panelRef.current) {
        const focusableElements = getFocusableElements(panelRef.current);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable elements, focus the panel itself
          panelRef.current.focus();
        }
      }
    };

    // Small delay to ensure panel is rendered
    const timeoutId = setTimeout(focusFirstElement, 0);

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isMobile, chatSidebarOpen, setChatSidebarOpen]);

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-background">
      <ChatTitlebar chatListData={chatListData} />
      <div className="flex min-h-0 flex-1 w-full overflow-hidden">
        {/* Chat Sidebar - Desktop: only mount once isMobile is resolved to avoid flash on mobile */}
        {isMobile === false && (
          <div
            data-testid="sidebar"
            className={`relative flex h-full min-h-0 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ${
              chatSidebarOpen ? "w-[260px]" : "w-0 border-r-0"
            }`}
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SidebarProvider
                open={chatSidebarOpen}
                onOpenChange={setChatSidebarOpen}
                defaultOpen={true}
                className="h-full min-h-0"
                style={{ "--sidebar-width": "260px" } as React.CSSProperties}
              >
                <MainSidebar chatListData={chatListData} />
              </SidebarProvider>
            </div>
            {chatSidebarOpen ? (
              <div
                data-testid="sidebar-session-dock"
                className="shrink-0 border-t border-sidebar-border bg-sidebar px-2 pb-2 pt-2"
              >
                <SidebarUserNav />
              </div>
            ) : null}
          </div>
        )}

        {/* Session dock when sidebar column is hidden (w-0) — stays bottom-left */}
        {isMobile === false && !chatSidebarOpen && (
          <div
            data-testid="sidebar-session-dock-floating"
            className="fixed bottom-0 left-0 z-30 w-[260px] border-r border-t border-sidebar-border bg-sidebar px-2 pb-2 pt-2 shadow-lg"
          >
            <SidebarUserNav />
          </div>
        )}

        {/* Main content slot - pages render here */}
        <div className="rift-cursor-app flex min-h-0 flex-1 min-w-0 flex-col relative bg-background">
          {children}
        </div>

        {/* Overlay Chat Sidebar - Mobile: only when resolved to mobile */}
        {isMobile === true && chatSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/80 flex"
            onClick={() => setChatSidebarOpen(false)}
          >
            <div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              tabIndex={-1}
              className="w-full max-w-80 h-full bg-background terminal-panel shadow-lg transform transition-transform duration-300 ease-in-out terminal-border"
              onClick={(e) => e.stopPropagation()}
            >
              <MainSidebar isMobileOverlay={true} chatListData={chatListData} />
            </div>
          </div>
        )}
        {/* Settings Dialog - rendered here so it's always mounted (including mobile) */}
        <SettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          initialTab={settingsDialogTab}
        />
      </div>
    </div>
  );
}
