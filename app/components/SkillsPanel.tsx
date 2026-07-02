"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
  Search,
  Check,
  Plus,
  Loader2,
  Trash2,
  X,
  Sparkles,
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
import { Switch } from "@/components/ui/switch";
import {
  SKILL_CATALOG,
  SKILL_CATEGORY_ORDER,
  type SkillCatalogEntry,
  type SkillCategory,
  type SkillScope,
} from "./skillCatalog";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

const SCOPE_LABEL: Record<SkillScope, string> = {
  all: "All modes",
  security: "Security",
  app: "Build",
  image: "Image",
};

function SkillBadge({
  entry,
  size = 40,
}: {
  entry: SkillCatalogEntry;
  size?: number;
}) {
  const Icon = entry.Icon;
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[11px] text-white"
      style={{ width: size, height: size, backgroundColor: entry.bg }}
    >
      <Icon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2} />
    </div>
  );
}

export function SkillsPanel() {
  const skills = useQuery(api.skills.listForUser, {});
  const install = useMutation(api.skills.installFromCatalog);
  const createCustom = useMutation(api.skills.createCustom);
  const setEnabled = useMutation(api.skills.setSkillEnabled);
  const remove = useMutation(api.skills.removeSkill);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<SkillCategory | "All">("All");
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const installedByCatalog = useMemo(() => {
    const map = new Map<string, NonNullable<typeof skills>[number]>();
    for (const s of skills ?? []) if (s.catalog_id) map.set(s.catalog_id, s);
    return map;
  }, [skills]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SKILL_CATALOG.filter((e) => {
      if (activeCat !== "All" && e.category !== activeCat) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const out: Array<{ category: SkillCategory; items: SkillCatalogEntry[] }> =
      [];
    for (const category of SKILL_CATEGORY_ORDER) {
      const items = visible.filter((e) => e.category === category);
      if (items.length) out.push({ category, items });
    }
    return out;
  }, [visible]);

  const handleInstall = async (entry: SkillCatalogEntry) => {
    setInstallingId(entry.id);
    try {
      const res = await install({
        catalogId: entry.id,
        name: entry.name,
        description: entry.description,
        instructions: entry.instructions,
        scope: entry.scope,
      });
      if (!res.success) {
        toast.error(res.error ?? "Failed to add skill");
        return;
      }
      toast.success(`Added ${entry.name}`);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to add skill"));
    } finally {
      setInstallingId(null);
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    setBusyId(id);
    try {
      await setEnabled({ id: id as never, enabled });
    } catch (error) {
      toast.error(errorMessage(error, "Failed to update"));
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = async (id: string, label: string) => {
    setBusyId(id);
    try {
      await remove({ id: id as never });
      toast.success(`Removed ${label}`);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to remove"));
    } finally {
      setBusyId(null);
    }
  };

  const installed = skills ?? [];
  const chips: Array<SkillCategory | "All"> = ["All", ...SKILL_CATEGORY_ORDER];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 md:px-8 md:py-8">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
              Skills
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Loadable instruction packs that shape how RIFT works. Enable one
              and its guidance is applied automatically in matching chats.
            </p>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-9 shrink-0 gap-1.5 text-[13px]"
          >
            <Plus className="size-3.5" />
            Create skill
          </Button>
        </div>

        {/* Search + chips */}
        <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-3 pt-1 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search skills…"
              className="h-11 pl-10 text-[14px]"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {chips.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCat(c)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  activeCat === c
                    ? "border-transparent bg-foreground text-background"
                    : "border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Installed */}
        {installed.length > 0 && activeCat === "All" && !query && (
          <div className="mb-6 mt-3">
            <h2 className="mb-2 text-[13px] font-semibold text-muted-foreground">
              Enabled
            </h2>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
              {installed.map((s) => {
                const cat = SKILL_CATALOG.find((e) => e.id === s.catalog_id);
                return (
                  <div
                    key={s._id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5"
                  >
                    {cat ? (
                      <SkillBadge entry={cat} size={34} />
                    ) : (
                      <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-violet-500/15 text-violet-400">
                        <Sparkles className="size-4" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {s.name}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {SCOPE_LABEL[s.scope]}
                        {s.catalog_id ? "" : " · custom"}
                      </div>
                    </div>
                    <Switch
                      checked={s.enabled}
                      disabled={busyId === s._id}
                      onCheckedChange={(c) => handleToggle(s._id, c)}
                      aria-label={s.enabled ? "Disable" : "Enable"}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemove(s._id, s.name)}
                      disabled={busyId === s._id}
                      aria-label="Remove"
                      className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                    >
                      {busyId === s._id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Catalog */}
        {grouped.map(({ category, items }) => (
          <div key={category} className="mb-7">
            <h2 className="mb-2.5 text-[13px] font-semibold text-muted-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((entry) => {
                const added = installedByCatalog.has(entry.id);
                const isInstalling = installingId === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3 transition-colors hover:border-foreground/20"
                  >
                    <SkillBadge entry={entry} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-medium text-foreground">
                          {entry.name}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          {SCOPE_LABEL[entry.scope]}
                        </span>
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                        {entry.description}
                      </div>
                      <div className="mt-2">
                        {added ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-500">
                            <Check className="size-3" />
                            Added
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleInstall(entry)}
                            disabled={isInstalling}
                            className="h-7 px-3 text-[12px]"
                          >
                            {isInstalling ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              "Add skill"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <CreateSkillDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={async (name, description, instructions, scope) => {
          const res = await createCustom({
            name,
            description,
            instructions,
            scope,
          });
          if (!res.success) {
            toast.error(res.error ?? "Failed to create skill");
            return false;
          }
          toast.success(`Created ${name}`);
          return true;
        }}
      />
    </div>
  );
}

function CreateSkillDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    instructions: string,
    scope: SkillScope,
  ) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [scope, setScope] = useState<SkillScope>("all");
  const [submitting, setSubmitting] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName("");
      setDescription("");
      setInstructions("");
      setScope("all");
    }
  }

  const canSubmit = name.trim().length > 0 && instructions.trim().length > 0;
  const scopes: SkillScope[] = ["all", "security", "app", "image"];

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const ok = await onCreate(
        name.trim(),
        description.trim(),
        instructions.trim(),
        scope,
      );
      if (ok) onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">Create a skill</DialogTitle>
          <DialogDescription className="text-[12.5px]">
            Write instructions RIFT should follow. While enabled, they’re
            applied in matching chats.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name (e.g. Cold Email Writer)"
            className="h-9 text-[13px]"
          />
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description (optional)"
            className="h-9 text-[13px]"
          />
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Instructions — tell RIFT how to behave for this skill…"
            rows={6}
            className="min-h-[120px] w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div>
            <div className="mb-1.5 text-[11.5px] font-medium text-muted-foreground">
              Applies to
            </div>
            <div className="flex flex-wrap gap-1.5">
              {scopes.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                    scope === s
                      ? "border-transparent bg-foreground text-background"
                      : "border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {SCOPE_LABEL[s]}
                </button>
              ))}
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
              Create
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
