"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { useGlobalState } from "@/app/contexts/GlobalState";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import {
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  Shield,
  Hammer,
  Image as ImageIcon,
  Folder,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatPurpose } from "@/types/chat";
import { SIDEBAR_SECTION_LABEL_CLASS } from "./SidebarHeader";

type ProjectType = "security" | "app" | "image";

const TYPE_META: Record<
  ProjectType,
  { label: string; Icon: LucideIcon; color: string }
> = {
  security: { label: "Security", Icon: Shield, color: "text-primary" },
  app: { label: "Build", Icon: Hammer, color: "text-primary" },
  image: { label: "Image", Icon: ImageIcon, color: "text-primary" },
};

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * "Projects" sidebar section — named workspaces of a chosen type. A self-
 * contained section (like Operations): create a project (Security / Build /
 * Image), see your list, and click one to start work in that mode.
 */
export function SidebarProjects() {
  const projects = useQuery(api.projects.listForUser, {});
  const createProject = useMutation(api.projects.createProject);
  const removeProject = useMutation(api.projects.removeProject);

  const router = useRouter();
  const isMobile = useIsMobile();
  const {
    initializeNewChat,
    closeSidebar,
    setChatSidebarOpen,
    setTemporaryChatsEnabled,
  } = useGlobalState();

  // Open a project = start a fresh chat in its mode (mirrors the sidebar's
  // launchMode). Kept internal so this section can render anywhere.
  const openProject = (type: ChatPurpose) => {
    closeSidebar();
    if (isMobile) setChatSidebarOpen(false);
    initializeNewChat(type);
    setTemporaryChatsEnabled(false);
    router.push("/");
  };

  const [open, setOpen] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRemove = async (id: string, name: string) => {
    setBusyId(id);
    try {
      await removeProject({ id: id as never });
      toast.success(`Removed ${name}`);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to remove"));
    } finally {
      setBusyId(null);
    }
  };

  const list = projects ?? [];

  return (
    <div className="border-b border-sidebar-border/60 px-1.5 py-1">
      {/* Section header — shared canonical section-label style. */}
      <div className="flex items-center justify-between px-2 pb-1 pt-2.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`flex flex-1 items-center gap-1 ${SIDEBAR_SECTION_LABEL_CLASS}`}
        >
          <ChevronDown
            className={`size-3 transition-transform ${open ? "" : "-rotate-90"}`}
            strokeWidth={1.75}
          />
          Projects
        </button>
        <button
          type="button"
          onClick={() => setDialogOpen(true)}
          aria-label="New project"
          title="New project"
          className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>

      {open && (
        <div className="space-y-px pb-0.5">
          {list.length === 0 ? (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-[12px] text-muted-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-foreground"
            >
              <Folder className="size-[15px] shrink-0" strokeWidth={1.5} />
              New project
            </button>
          ) : (
            list.map((p) => {
              const meta = TYPE_META[p.type];
              const Icon = meta.Icon;
              return (
                <div
                  key={p._id}
                  className="group flex items-center gap-2 rounded-lg px-2 py-1 text-[12.5px] text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
                >
                  <button
                    type="button"
                    onClick={() => openProject(p.type)}
                    title={`${p.name} · ${meta.label}`}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <Icon
                      className={`size-[15px] shrink-0 ${meta.color}`}
                      strokeWidth={1.5}
                    />
                    <span className="truncate">{p.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(p._id, p.name)}
                    disabled={busyId === p._id}
                    aria-label="Remove project"
                    className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/70 hover:!text-destructive"
                  >
                    {busyId === p._id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Trash2 className="size-3" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      <NewProjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreate={async (name, type) => {
          const res = await createProject({ name, type });
          if (!res.success) {
            toast.error(res.error ?? "Failed to create project");
            return false;
          }
          toast.success(`Created ${name}`);
          return true;
        }}
      />
    </div>
  );
}

function NewProjectDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, type: ProjectType) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ProjectType>("app");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setType("app");
    }
  }

  const canSubmit = name.trim().length > 0;
  const types: ProjectType[] = ["security", "app", "image"];

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onCreate(name.trim(), type);
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">New project</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Name it and choose what kind of project this is. Opening it starts
            work in that mode.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Project name"
            className="h-9 text-[13px]"
            onKeyDown={(e) => {
              if (e.key === "Enter") void submit();
            }}
            autoFocus
          />
          <div>
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">
              Type
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {types.map((t) => {
                const meta = TYPE_META[t];
                const Icon = meta.Icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-[12px] font-medium transition-colors ${
                      active
                        ? "border-foreground/30 bg-accent text-foreground"
                        : "border-border bg-card/40 text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`size-5 ${active ? meta.color : ""}`}
                      strokeWidth={1.75}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-1 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 gap-1.5 text-[13px]"
            >
              <X className="size-3.5" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="h-9 gap-1.5 text-[13px]"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Create project
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
