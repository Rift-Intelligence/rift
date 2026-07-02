"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import ChatItem from "./ChatItem";
import Loading from "@/components/ui/loading";
import { SIDEBAR_SECTION_LABEL_CLASS } from "./SidebarHeader";

interface SidebarHistoryProps {
  chats: any[];
  paginationStatus?:
    | "LoadingFirstPage"
    | "CanLoadMore"
    | "LoadingMore"
    | "Exhausted";
  loadMore?: (numItems: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

const SidebarHistory: React.FC<SidebarHistoryProps> = ({
  chats,
  paginationStatus,
  loadMore,
}) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const statusRef = useRef(paginationStatus);
  // Collapsed date-group labels (e.g. "Today"). Empty = all expanded.
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const toggleGroup = (label: string) =>
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });

  // IntersectionObserver for infinite scroll – reliable vs scroll listener on ref that can be null
  useEffect(() => {
    statusRef.current = paginationStatus;
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (paginationStatus === "CanLoadMore" && chats.length > 0 && loadMore) {
      const options: IntersectionObserverInit = {
        root: null,
        rootMargin: "50px",
        threshold: 0.1,
      };

      observerRef.current = new IntersectionObserver((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && statusRef.current === "CanLoadMore") {
          loadMore(28);
        }
      }, options);

      const currentLoader = loaderRef.current;
      if (currentLoader) {
        observerRef.current.observe(currentLoader);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [paginationStatus, loadMore, chats.length]);

  if (paginationStatus === "LoadingFirstPage") {
    // Loading state
    return (
      <div className="p-2">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!chats || chats.length === 0) {
    // Empty state
    return (
      <div
        className="flex flex-col items-center justify-center h-full p-6 text-center"
        data-testid="sidebar-chat-empty"
      >
        <p className="text-sm text-muted-foreground">No chats yet</p>
      </div>
    );
  }

  // A single "Recent" list (no Today/Yesterday date groups). Chats already come
  // sorted by recency; render them flat under one small, collapsible header.
  const recentOpen = !collapsedGroups.has("Recent");

  return (
    <div className="px-1 py-0.5" data-testid="sidebar-chat-list">
      {chats.length > 0 && (
        <div className="mb-0.5">
          <button
            type="button"
            onClick={() => toggleGroup("Recent")}
            aria-expanded={recentOpen}
            className={`flex w-full items-center justify-between rounded-md px-2 pb-1 pt-2.5 ${SIDEBAR_SECTION_LABEL_CLASS}`}
          >
            Recent
            <ChevronDown
              className={`size-3 transition-transform ${
                recentOpen ? "" : "-rotate-90"
              }`}
              strokeWidth={1.75}
            />
          </button>
          {recentOpen && (
            <div className="space-y-px">
              {chats.map((chat: any) => (
                <ChatItem
                  key={chat._id}
                  id={chat.id}
                  title={chat.title}
                  isBranched={!!chat.branched_from_chat_id}
                  branchedFromTitle={chat.branched_from_title}
                  shareId={chat.share_id}
                  shareDate={chat.share_date}
                  isPinned={chat.pinned_at != null}
                  isStreaming={!!chat.active_stream_id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading indicator when loading more */}
      {paginationStatus === "LoadingMore" && (
        <div className="flex justify-center py-2">
          <Loading size={6} />
        </div>
      )}

      {/* Sentinel for IntersectionObserver – load more when scrolled into view */}
      {paginationStatus === "CanLoadMore" && chats.length > 0 && (
        <div
          ref={loaderRef}
          data-testid="sidebar-load-more-sentinel"
          className="flex justify-center py-2 text-sidebar-accent-foreground"
          aria-hidden
        >
          <span className="text-xs">Scroll for more</span>
        </div>
      )}
    </div>
  );
};

export default SidebarHistory;
