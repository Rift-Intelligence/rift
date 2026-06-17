"use client";

import React, { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import ChatItem from "./ChatItem";
import Loading from "@/components/ui/loading";
import { groupChatsByDate } from "@/lib/utils/chat-date-groups";

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

  const groups = groupChatsByDate(chats);

  return (
    <div className="px-1 py-0.5" data-testid="sidebar-chat-list">
      {groups.map((group) => (
        <div key={group.label} className="mb-1">
          <div className="px-2 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground/70">
            {group.label}
          </div>
          <div className="space-y-0.5">
            {group.chats.map((chat: any) => (
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
        </div>
      ))}

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
