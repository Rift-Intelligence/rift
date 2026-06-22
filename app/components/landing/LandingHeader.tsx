"use client";

import Link from "next/link";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { navigateToAuth } from "@/app/hooks/useTauri";

const NAV = [
  { label: "Features", id: "features" },
  { label: "How it works", id: "how" },
  { label: "Security", id: "security" },
  { label: "Pricing", id: "pricing" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="RIFT home"
        >
          <RiftPixelMark size={22} />
          <RiftWordmark height={13} className="text-foreground" />
        </button>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map(({ label, id }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/download"
            className="hidden rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground sm:inline"
          >
            Download
          </Link>
          <button
            type="button"
            onClick={() => navigateToAuth("/login")}
            className="rounded-md px-2.5 py-1.5 text-[13px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() =>
              navigateToAuth("/signup", { preferSignInForReturningUser: true })
            }
            className="rounded-md bg-foreground px-3 py-1.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}
