"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Images,
  Loader2,
  Sparkles,
  Upload,
  ExternalLink,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type Artifact = {
  url: string;
  mediaType: string;
  kind: "generated" | "uploaded";
  chat_id: string;
  time: number;
};

/**
 * Artifacts — a gallery of every image the user has sent (uploaded) or received
 * (generated), gathered from their messages. Click one to view it full-size.
 */
export function ArtifactsGallery() {
  const artifacts = useQuery(api.artifacts.listForUser, {});
  const [active, setActive] = useState<Artifact | null>(null);
  const [filter, setFilter] = useState<"all" | "generated" | "uploaded">("all");

  const loading = artifacts === undefined;
  const all = artifacts ?? [];
  const items = filter === "all" ? all : all.filter((a) => a.kind === filter);

  const counts = {
    all: all.length,
    generated: all.filter((a) => a.kind === "generated").length,
    uploaded: all.filter((a) => a.kind === "uploaded").length,
  };

  const chips: Array<{ id: typeof filter; label: string; n: number }> = [
    { id: "all", label: "All", n: counts.all },
    { id: "generated", label: "Generated", n: counts.generated },
    { id: "uploaded", label: "Uploaded", n: counts.uploaded },
  ];

  return (
    <div className="h-full min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1180px] px-5 py-6 md:px-8 md:py-8">
        <div className="mb-1 flex items-center gap-2">
          <Images className="size-5 text-muted-foreground" />
          <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
            Artifacts
          </h1>
        </div>
        <p className="mb-5 text-[13.5px] text-muted-foreground">
          Every image you&apos;ve sent or RIFT has generated, kept in one place.
        </p>

        {/* Filter chips */}
        <div className="mb-5 flex gap-1.5">
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
                filter === c.id
                  ? "border-transparent bg-foreground text-background"
                  : "border-border bg-card/40 text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {c.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  filter === c.id ? "bg-background/20" : "bg-muted"
                }`}
              >
                {c.n}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
            <Images className="mb-3 size-8 text-muted-foreground/50" />
            <p className="text-[14px] font-medium text-foreground">
              No images yet
            </p>
            <p className="mt-1 max-w-xs text-[12.5px] text-muted-foreground">
              Generate an image in Image mode, or attach one in a chat —
              it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((a, i) => (
              <button
                key={`${a.url}-${i}`}
                type="button"
                onClick={() => setActive(a)}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-card/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                />
                <span
                  className={`absolute left-1.5 top-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-medium backdrop-blur ${
                    a.kind === "generated"
                      ? "bg-fuchsia-500/25 text-fuchsia-100"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {a.kind === "generated" ? (
                    <Sparkles className="size-2.5" />
                  ) : (
                    <Upload className="size-2.5" />
                  )}
                  {a.kind === "generated" ? "Generated" : "Uploaded"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog
        open={active !== null}
        onOpenChange={(o) => !o && setActive(null)}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-[92vw] gap-0 border-0 bg-transparent p-0 shadow-none md:max-w-[80vw]"
        >
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {active && (
            <div className="relative flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={active.url}
                alt=""
                className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
              />
              <div className="mt-3 flex items-center gap-2">
                <a
                  href={active.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-[12.5px] font-medium text-foreground backdrop-blur transition-colors hover:bg-background"
                >
                  <ExternalLink className="size-3.5" />
                  Open original
                </a>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="flex items-center gap-1.5 rounded-lg bg-background/90 px-3 py-1.5 text-[12.5px] font-medium text-foreground backdrop-blur transition-colors hover:bg-background"
                >
                  <X className="size-3.5" />
                  Close
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
