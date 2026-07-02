"use client";

import { useState } from "react";
import {
  RefreshCw,
  ExternalLink,
  Minimize2,
  Monitor,
  Smartphone,
} from "lucide-react";
import { useGlobalState } from "../contexts/GlobalState";

/**
 * Build-mode live preview pane. Embeds the running dev-server URL (exposed by
 * the agent's expose_preview tool) in an iframe, so a user building an app sees
 * it render live next to the chat — instead of a bare link. Lives in the same
 * right-pane slot as the computer sidebar (see chat.tsx).
 */
export function BuildPreviewPanel() {
  const { buildPreviewUrl, setBuildPreviewOpen } = useGlobalState();
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  // Bump to force the iframe to remount (hard reload of the embedded app).
  const [reloadKey, setReloadKey] = useState(0);

  if (!buildPreviewUrl) return null;

  return (
    <div className="h-full w-full top-0 left-0 desktop:top-auto desktop:left-auto desktop:right-auto z-50 fixed desktop:relative desktop:h-full desktop:mr-4 flex-shrink-0">
      <div className="flex h-full w-full flex-col overflow-hidden rounded-[22px] border border-border/20 bg-background shadow-[0px_0px_8px_0px_rgba(0,0,0,0.02)] dark:border-border">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <span className="text-lg font-semibold text-foreground">
            Live Preview
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-terminal-green/50 bg-terminal-green/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] text-terminal-green">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terminal-green" />
            running
          </span>

          <div className="ml-auto flex items-center gap-1">
            {/* Device toggle */}
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                device === "desktop"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              aria-label="Desktop width"
              aria-pressed={device === "desktop"}
            >
              <Monitor className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`flex size-7 items-center justify-center rounded-md transition-colors ${
                device === "mobile"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted/50"
              }`}
              aria-label="Mobile width"
              aria-pressed={device === "mobile"}
            >
              <Smartphone className="size-4" />
            </button>

            <div className="mx-1 h-4 w-px bg-border/60" />

            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Reload preview"
            >
              <RefreshCw className="size-4" />
            </button>
            <a
              href={buildPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Open in new tab"
            >
              <ExternalLink className="size-4" />
            </a>
            <button
              type="button"
              onClick={() => setBuildPreviewOpen(false)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              aria-label="Close preview"
            >
              <Minimize2 className="size-4" />
            </button>
          </div>
        </div>

        {/* URL bar */}
        <div className="border-b border-border/40 px-4 py-2">
          <div className="truncate rounded-md bg-muted/40 px-2.5 py-1 font-mono text-[11px] text-muted-foreground">
            {buildPreviewUrl}
          </div>
        </div>

        {/* Embedded app */}
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden bg-muted/20 p-3">
          <iframe
            key={reloadKey}
            src={buildPreviewUrl}
            title="Live app preview"
            className={`h-full rounded-lg border border-border/40 bg-white transition-[max-width] ${
              device === "mobile" ? "w-full max-w-[390px]" : "w-full"
            }`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        </div>
      </div>
    </div>
  );
}
