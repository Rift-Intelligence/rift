"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  ArrowLeft,
  Settings2,
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
  MCP_CATALOG,
  MCP_CATEGORY_ORDER,
  normalizeMcpUrl,
  type McpCatalogCategory,
  type McpCatalogEntry,
} from "./mcpCatalog";

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function EntryBadge({
  entry,
  size = 40,
}: {
  entry: McpCatalogEntry;
  size?: number;
}) {
  const [imgOk, setImgOk] = useState(true);

  // Real brand logo via Google's favicon service (loads in the user's browser).
  // Falls back to a coloured initials/emoji tile if the logo fails to load.
  if (entry.domain && imgOk) {
    return (
      <div
        className="flex shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-border bg-white"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://www.google.com/s2/favicons?domain=${entry.domain}&sz=128`}
          alt={`${entry.name} logo`}
          width={Math.round(size * 0.64)}
          height={Math.round(size * 0.64)}
          className="object-contain"
          loading="lazy"
          onError={() => setImgOk(false)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-[11px] font-semibold"
      style={{
        width: size,
        height: size,
        backgroundColor: entry.bg,
        color: entry.fg ?? "#ffffff",
        fontSize: entry.emoji ? size * 0.5 : size * 0.4,
      }}
    >
      {entry.emoji ?? entry.initials}
    </div>
  );
}

type ConnectState =
  | { mode: "catalog"; entry: McpCatalogEntry }
  | { mode: "custom" }
  | null;

export function McpMarketplace() {
  const router = useRouter();
  const servers = useQuery(api.mcpServers.listForUser, {});
  const addServer = useMutation(api.mcpServers.addServer);
  const setEnabled = useMutation(api.mcpServers.setServerEnabled);
  const removeServer = useMutation(api.mcpServers.removeServer);

  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<McpCatalogCategory | "All">("All");
  const [connect, setConnect] = useState<ConnectState>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [manageInstalled, setManageInstalled] = useState(false);

  const installedByUrl = useMemo(() => {
    const map = new Map<string, NonNullable<typeof servers>[number]>();
    for (const s of servers ?? []) map.set(normalizeMcpUrl(s.url), s);
    return map;
  }, [servers]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MCP_CATALOG.filter((e) => {
      if (activeCat !== "All" && e.category !== activeCat) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  const grouped = useMemo(() => {
    const groups: Array<{
      category: McpCatalogCategory;
      items: McpCatalogEntry[];
    }> = [];
    for (const category of MCP_CATEGORY_ORDER) {
      const items = visible.filter((e) => e.category === category);
      if (items.length) groups.push({ category, items });
    }
    return groups;
  }, [visible]);

  const connectServer = async (
    name: string,
    url: string,
    transport: "http" | "sse",
    token?: string,
    entryId?: string,
  ) => {
    if (entryId) setInstallingId(entryId);
    setSubmitting(true);
    try {
      const headers = token?.trim()
        ? [{ key: "Authorization", value: `Bearer ${token.trim()}` }]
        : undefined;
      const result = await addServer({ name, url, transport, headers });
      if (!result.success) {
        toast.error(result.error ?? "Failed to connect");
        return;
      }
      toast.success(`Connected ${name}`);
      setConnect(null);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to connect"));
    } finally {
      setSubmitting(false);
      setInstallingId(null);
    }
  };

  const handleInstall = (entry: McpCatalogEntry) => {
    // "none" connects in one click; "token" and "oauth" open the connect
    // dialog (token entry, or URL + token for oauth until one-click lands).
    if (entry.auth === "none") {
      void connectServer(
        entry.name,
        entry.url,
        entry.transport,
        undefined,
        entry.id,
      );
      return;
    }
    setConnect({ mode: "catalog", entry });
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
      await removeServer({ id: id as never });
      toast.success(`Removed ${label}`);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to remove"));
    } finally {
      setBusyId(null);
    }
  };

  const installedServers = servers ?? [];
  const chips: Array<McpCatalogCategory | "All"> = [
    "All",
    ...MCP_CATEGORY_ORDER,
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 md:px-8 md:py-8">
        {/* Header */}
        <div className="mb-5 flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            aria-label="Back"
            className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex-1">
            <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
              Plugins
            </h1>
            <p className="mt-1 text-[13.5px] text-muted-foreground">
              Work with RIFT across your favorite tools. Connect an MCP server
              and its tools show up in every chat — Build, Security and Image.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-10 -mx-1 bg-background/95 px-1 pb-3 pt-1 backdrop-blur">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 100+ plugins…"
              className="h-11 pl-10 text-[14px]"
            />
          </div>
          {/* Category chips */}
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

        {/* Installed — a compact icon strip by default; a gear toggles the
            detailed manage view (enable / disable / remove). */}
        {installedServers.length > 0 && activeCat === "All" && !query && (
          <div className="mb-7 mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                Installed
                <span className="ml-1.5 text-muted-foreground/60">
                  {installedServers.length}
                </span>
              </h2>
              <button
                type="button"
                onClick={() => setManageInstalled((v) => !v)}
                aria-label={
                  manageInstalled ? "Done managing" : "Manage installed"
                }
                className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                  manageInstalled
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Settings2 className="size-4" />
              </button>
            </div>

            {!manageInstalled ? (
              <div className="flex flex-wrap gap-2.5">
                {installedServers.map((server) => {
                  const match = MCP_CATALOG.find(
                    (e) =>
                      normalizeMcpUrl(e.url) === normalizeMcpUrl(server.url),
                  );
                  return (
                    <button
                      key={server._id}
                      type="button"
                      onClick={() => setManageInstalled(true)}
                      title={`${server.name}${server.enabled ? "" : " · disabled"}`}
                      className={`transition-opacity hover:opacity-80 ${
                        server.enabled ? "" : "opacity-35"
                      }`}
                    >
                      {match ? (
                        <EntryBadge entry={match} size={44} />
                      ) : (
                        <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[11px] border border-border bg-muted text-[13px] font-semibold text-muted-foreground">
                          {server.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {installedServers.map((server) => {
                  const match = MCP_CATALOG.find(
                    (e) =>
                      normalizeMcpUrl(e.url) === normalizeMcpUrl(server.url),
                  );
                  return (
                    <div
                      key={server._id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-card/40 px-3 py-2.5"
                    >
                      {match ? (
                        <EntryBadge entry={match} size={34} />
                      ) : (
                        <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-muted text-[12px] font-semibold text-muted-foreground">
                          {server.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          {server.name}
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {server.url}
                        </div>
                      </div>
                      <Switch
                        checked={server.enabled}
                        disabled={busyId === server._id}
                        onCheckedChange={(c) => handleToggle(server._id, c)}
                        aria-label={server.enabled ? "Disable" : "Enable"}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemove(server._id, server.name)}
                        disabled={busyId === server._id}
                        aria-label="Remove"
                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                      >
                        {busyId === server._id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Catalog grid grouped by category */}
        {grouped.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            No plugins match “{query}”.
          </div>
        ) : (
          grouped.map(({ category, items }) => (
            <div key={category} className="mb-7">
              <h2 className="mb-2.5 text-[13px] font-semibold text-muted-foreground">
                {category}
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((entry) => {
                  const installed = installedByUrl.has(
                    normalizeMcpUrl(entry.url),
                  );
                  const isInstalling = installingId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-3 transition-colors hover:border-foreground/20"
                    >
                      <EntryBadge entry={entry} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium text-foreground">
                          {entry.name}
                        </div>
                        <div className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-muted-foreground">
                          {entry.description}
                        </div>
                        <div className="mt-2">
                          {installed ? (
                            <span className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground">
                              <Check className="size-3" />
                              Installed
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant={
                                entry.auth === "oauth" ? "outline" : "default"
                              }
                              onClick={() => handleInstall(entry)}
                              disabled={isInstalling}
                              className="h-7 px-3 text-[12px]"
                            >
                              {isInstalling ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : entry.auth === "oauth" ? (
                                "Connect"
                              ) : (
                                "Install"
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
          ))
        )}

        {/* Custom server CTA */}
        <button
          type="button"
          onClick={() => setConnect({ mode: "custom" })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="size-4" />
          Add a custom MCP server
        </button>
      </div>

      <ConnectDialog
        state={connect}
        submitting={submitting}
        onClose={() => setConnect(null)}
        onConnect={connectServer}
      />
    </div>
  );
}

function ConnectDialog({
  state,
  submitting,
  onClose,
  onConnect,
}: {
  state: ConnectState;
  submitting: boolean;
  onClose: () => void;
  onConnect: (
    name: string,
    url: string,
    transport: "http" | "sse",
    token?: string,
    entryId?: string,
  ) => Promise<void>;
}) {
  const open = state !== null;
  const isCatalog = state?.mode === "catalog";
  const entry = isCatalog ? state.entry : null;

  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [prevKey, setPrevKey] = useState<string | null>(null);

  // Reset fields when the dialog target changes.
  const key = entry
    ? `c:${entry.id}`
    : state?.mode === "custom"
      ? "custom"
      : null;
  if (key !== prevKey) {
    setPrevKey(key);
    setName(entry ? entry.name : "");
    setUrl(entry ? entry.url : "");
    setToken("");
  }

  // OAuth catalog entries don't ship a working one-click endpoint yet, so we
  // surface the URL field (prefilled where known) and let the user connect with
  // a URL + token today. Token entries hide the URL (endpoint is known).
  const isOauth = isCatalog && entry?.auth === "oauth";
  const needUrl = !isCatalog || isOauth;
  const canSubmit =
    (!needUrl || url.trim().length > 0) &&
    (isCatalog || name.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {isCatalog ? `Connect ${entry?.name}` : "Add a custom server"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            {isOauth
              ? "One-click OAuth sign-in is coming soon. Connect now by pasting this server’s MCP endpoint URL and an API token."
              : isCatalog
                ? (entry?.tokenHint ?? "Paste an API token to connect.")
                : "Any remote MCP server (Streamable HTTP or SSE). Its tools are added to every chat."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5">
          {!isCatalog && (
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="h-9 text-[13px]"
            />
          )}
          {needUrl && (
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Server URL (https://…/mcp)"
              className="h-9 text-[13px]"
              spellCheck={false}
            />
          )}
          <Input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={
              isCatalog
                ? (entry?.tokenLabel ?? "API token")
                : "Auth token (optional — sent as Bearer)"
            }
            type="password"
            spellCheck={false}
            className="h-9 text-[13px]"
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSubmit && !submitting) {
                void onConnect(
                  name.trim(),
                  url.trim(),
                  entry?.transport ?? "http",
                  token,
                  entry?.id,
                );
              }
            }}
          />
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
              onClick={() =>
                onConnect(
                  name.trim(),
                  url.trim(),
                  entry?.transport ?? "http",
                  token,
                  entry?.id,
                )
              }
              disabled={!canSubmit || submitting}
              className="h-9 gap-1.5 text-[13px]"
            >
              {submitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Plus className="size-3.5" />
              )}
              Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
