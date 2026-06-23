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

/** snulja-aligned palette, forced so the download page matches the landing. */
const SHELL: CSSProperties = {
  ["--background" as string]: "#1c1c1c",
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "#a1a1a1",
  ["--card" as string]: "#232323",
  ["--popover" as string]: "#232323",
  ["--border" as string]: "#3a3a3a",
  ["--accent" as string]: "#262626",
  ["--signal" as string]: "#ff6309",
  ["--primary" as string]: "#ff6309",
};

function AuthenticatedHeader() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6309]"
        >
          <RiftPixelMark size={22} />
          <RiftWordmark height={13} fill="#ffffff" />
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-[#ff6309]"
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
          <p className="mb-4 font-pixel text-[11px] uppercase tracking-[0.2em] text-[#ff6309]">
            {isMobile ? "Install" : "Desktop app"}
          </p>
          <h1 className="mb-3 text-4xl font-semibold tracking-tight text-foreground">
            {isMobile ? "Install RIFT" : "Download RIFT"}
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
            <h2 className="mb-4 text-xl font-semibold text-foreground">
              Desktop downloads
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
      className="font-montserrat relative min-h-screen overflow-hidden bg-background text-foreground"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_50%_-4%,rgba(255,99,9,0.13),transparent_70%)]"
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
      className="group flex items-center gap-3 rounded-xl border border-border bg-[#1c1c1c] p-4 transition-colors hover:border-[#ff6309]/60"
    >
      <div className="text-muted-foreground transition-colors group-hover:text-[#ff6309]">
        {icon}
      </div>
      <div>
        <div className="font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </a>
  );
}
