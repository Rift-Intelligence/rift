"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  PanelLeft,
  Plus,
  Search,
  Blocks,
  Images,
  NotebookText,
  type LucideIcon,
} from "lucide-react";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { useGlobalState } from "../contexts/GlobalState";
import SidebarUserNav from "./SidebarUserNav";
import { MessageSearchDialog } from "./MessageSearchDialog";
import { useState } from "react";

/**
 * Collapsed sidebar rail — a thin icon column (à la Mistral) shown when the
 * sidebar is closed, instead of hiding it entirely. Each icon expands the
 * sidebar or navigates directly.
 */
export function SidebarRail() {
  const router = useRouter();
  const pathname = usePathname();
  const { toggleChatSidebar, initializeNewChat, setTemporaryChatsEnabled } =
    useGlobalState();
  const [searchOpen, setSearchOpen] = useState(false);

  const newChat = () => {
    initializeNewChat("security");
    setTemporaryChatsEnabled(false);
    router.push("/");
  };

  const items: Array<{
    key: string;
    Icon: LucideIcon;
    label: string;
    onClick: () => void;
    active?: boolean;
  }> = [
    { key: "new", Icon: Plus, label: "New chat", onClick: newChat },
    {
      key: "search",
      Icon: Search,
      label: "Search",
      onClick: () => setSearchOpen(true),
    },
    {
      key: "plugins",
      Icon: Blocks,
      label: "Plugins",
      onClick: () => router.push("/plugins"),
      active: pathname === "/plugins",
    },
    {
      key: "artifacts",
      Icon: Images,
      label: "Artifacts",
      onClick: () => router.push("/artifacts"),
      active: pathname === "/artifacts",
    },
    {
      key: "notebook",
      Icon: NotebookText,
      label: "Pentest Notebook",
      onClick: () => router.push("/notebook"),
      active: pathname === "/notebook",
    },
  ];

  return (
    <div
      data-testid="sidebar-rail"
      className="relative flex h-full w-[52px] shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-2"
    >
      {/* Logo + expand toggle */}
      <button
        type="button"
        onClick={toggleChatSidebar}
        aria-label="Expand sidebar"
        title="Expand sidebar"
        className="group relative mb-2 flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-sidebar-accent"
      >
        <RiftPixelMark size={22} className="group-hover:opacity-0" />
        <PanelLeft
          className="absolute size-[18px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          strokeWidth={1.5}
        />
      </button>

      <div className="flex flex-1 flex-col items-center gap-1">
        {items.map(({ key, Icon, label, onClick, active }) => (
          <button
            key={key}
            type="button"
            onClick={onClick}
            aria-label={label}
            title={label}
            className={`flex size-9 items-center justify-center rounded-lg transition-colors ${
              active
                ? "bg-sidebar-accent text-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={1.5} />
          </button>
        ))}
      </div>

      {/* Account menu at the bottom */}
      <div className="mt-1 w-full px-1">
        <SidebarUserNav isCollapsed />
      </div>

      <MessageSearchDialog
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </div>
  );
}
