"use client";

import { useEffect } from "react";
import { MonitorPlay, ArrowUpRight } from "lucide-react";
import { useGlobalState } from "../contexts/GlobalState";

/**
 * Inline result card for the `expose_preview` tool. Surfaces the running app's
 * URL and wires it into the embedded Build preview pane (BuildPreviewPanel via
 * GlobalState). On first appearance of a given URL it auto-opens the pane so a
 * build feels like a live workspace, not a link drop.
 */

// Auto-open each preview URL at most once per page load (don't fight the user
// if they close the pane, and don't re-pop when scrolling history).
const autoOpened = new Set<string>();

export function ExposePreviewCard({
  url,
  error,
}: {
  url?: string;
  error?: string;
}) {
  const { setBuildPreviewUrl, setBuildPreviewOpen, buildPreviewUrl } =
    useGlobalState();

  useEffect(() => {
    if (!url) return;
    setBuildPreviewUrl(url);
    if (!autoOpened.has(url)) {
      autoOpened.add(url);
      setBuildPreviewOpen(true);
    }
  }, [url, setBuildPreviewUrl, setBuildPreviewOpen]);

  if (!url) {
    if (!error) return null;
    return (
      <div className="my-1 rounded-lg border border-border bg-muted/30 px-3.5 py-2.5 text-sm text-muted-foreground">
        Couldn&apos;t open the preview. {error}
      </div>
    );
  }

  const isShown = buildPreviewUrl === url;

  return (
    <button
      type="button"
      onClick={() => {
        setBuildPreviewUrl(url);
        setBuildPreviewOpen(true);
      }}
      className="group my-1 flex w-full max-w-lg items-center gap-3 rounded-xl border border-border bg-card/60 px-3.5 py-3 text-left transition-colors hover:border-[var(--signal)]/40 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--signal-soft)] text-[var(--signal-bright)]">
        <MonitorPlay className="size-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground">
          Your app is running
        </span>
        <span className="block truncate font-mono text-[11px] text-muted-foreground">
          {url}
        </span>
      </span>
      <span className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
        {isShown ? "Shown" : "Open"}
        <ArrowUpRight className="size-3.5" />
      </span>
    </button>
  );
}
