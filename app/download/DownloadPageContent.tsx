"use client";

import type { CSSProperties } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LandingHeader } from "@/app/components/landing/LandingHeader";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { DownloadSection, useDetectedPlatform } from "./DownloadSection";
import { downloadLinks } from "./constants";
import { AppleIcon, WindowsIcon } from "./icons";

/** air.dev-aligned palette (cyan on cool gray), forced so the download page
 *  matches the landing. */
const SHELL: CSSProperties = {
  ["--background" as string]: "#26282c",
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "#a3a8b0",
  ["--card" as string]: "#1e2023",
  ["--popover" as string]: "#1e2023",
  ["--border" as string]: "rgba(255,255,255,0.10)",
  ["--accent" as string]: "#2c2e33",
  ["--signal" as string]: "#00d3f5",
  ["--primary" as string]: "#00d3f5",
};

function AuthenticatedHeader() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#00d3f5]"
        >
          <RiftPixelMark size={22} />
          <RiftWordmark height={13} fill="#ffffff" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-[#00d3f5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Chat
        </Link>
      </div>
    </header>
  );
}

function DownloadContent() {
  const detected = useDetectedPlatform();
  const isMobile =
    detected?.platform === "ios" || detected?.platform === "android";

  return (
    <div className="px-4 py-12 pb-20 md:px-0">
      <div className="container mx-auto max-w-3xl space-y-10">
        <div className="text-center">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#00d3f5]">
            {isMobile ? "Install" : "Desktop app"}
          </p>
          <h1 className="font-display mb-3 text-[2.6rem] lowercase leading-[0.95] tracking-tight text-foreground">
            {isMobile ? "install rift" : "download rift"}
          </h1>
          <p className="text-[16px] text-muted-foreground">
            {isMobile
              ? "Add the app to your home screen"
              : "Get the desktop app for the best experience"}
          </p>
        </div>

        <DownloadSection />

        {!isMobile && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display mb-4 text-2xl lowercase tracking-tight text-foreground">
              desktop downloads
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <DownloadCard
                title="macOS"
                subtitle="Apple Silicon"
                href={downloadLinks.macos}
                icon={<AppleIcon />}
              />
              <DownloadCard
                title="Windows"
                subtitle="64-bit"
                href={downloadLinks.windows}
                icon={<WindowsIcon />}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DownloadPageContent() {
  return (
    <div
      style={SHELL}
      className="font-mono relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_-4%,rgba(0,178,214,0.16),transparent_70%)]"
      />
      <div className="relative z-10">
        <Authenticated>
          <AuthenticatedHeader />
          <DownloadContent />
        </Authenticated>
        <Unauthenticated>
          <LandingHeader />
          <DownloadContent />
        </Unauthenticated>
      </div>
    </div>
  );
}

function DownloadCard({
  title,
  subtitle,
  href,
  icon,
}: {
  title: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-[#1b1e23] p-4 transition-colors hover:border-[#00d3f5]/60"
    >
      <div className="text-muted-foreground transition-colors group-hover:text-[#00d3f5]">
        {icon}
      </div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </a>
  );
}
