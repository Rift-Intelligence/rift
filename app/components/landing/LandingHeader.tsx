"use client";

import Link from "next/link";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { navigateToAuth } from "@/app/hooks/useTauri";

const NAV = [
  { label: "Capabilities", id: "capabilities" },
  { label: "How it works", id: "how" },
  { label: "Pricing", id: "pricing" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50">
      {/* air.dev-style frosted gradient bar: cyan → transparent, masked to
          melt away at the bottom edge. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 backdrop-blur-[12px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,213,255,0.42) 0%, rgba(0,150,210,0.26) 34%, rgba(38,40,44,0) 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
        }}
      />
      <div className="relative mx-auto flex h-[72px] max-w-[1388px] items-center justify-between px-5 sm:px-8">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="RIFT home"
        >
          <RiftPixelMark size={22} />
          <RiftWordmark height={13} className="text-foreground" />
          <span className="ml-1 hidden font-mono text-[9px] uppercase leading-[1.15] tracking-[0.14em] text-white/55 sm:block">
            professional
            <br />
            ai agent
          </span>
        </button>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {NAV.map(({ label, id }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className="text-[13.5px] text-white/70 transition-opacity hover:opacity-70"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/download"
            className="hidden text-[13.5px] text-white/70 transition-opacity hover:opacity-70 sm:inline"
          >
            Download
          </Link>
          <button
            type="button"
            onClick={() => navigateToAuth("/login")}
            className="text-[13.5px] text-white/70 transition-opacity hover:opacity-70"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={() =>
              navigateToAuth("/signup", { preferSignInForReturningUser: true })
            }
            className="rounded-lg bg-white px-3.5 py-1.5 text-[13.5px] font-medium text-[#0a0e10] shadow-lg transition-all hover:bg-white/90 hover:shadow-xl"
          >
            Get started
          </button>
        </div>
      </div>
    </header>
  );
}
