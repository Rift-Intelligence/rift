"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LandingHeader } from "@/app/components/landing/LandingHeader";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { DownloadSection, useDetectedPlatform } from "./DownloadSection";
import { downloadLinks } from "./constants";
import { AppleIcon, WindowsIcon } from "./icons";

function AuthenticatedHeader() {
  return (
    <header className="sticky top-0 z-50 w-full shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <RiftPixelMark size={22} />
          <RiftWordmark height={13} fill="#f5f5f2" />
        </Link>
        <Button
          asChild
          variant="ghost"
          size="default"
          className="rounded-[10px]"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Chat
          </Link>
        </Button>
      </div>
    </header>
  );
}

function DownloadContent() {
  const detected = useDetectedPlatform();
  const isMobile =
    detected?.platform === "ios" || detected?.platform === "android";

  return (
    <div className="px-4 py-8 pb-16 md:px-0">
      <div className="container mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold text-card-foreground">
            {isMobile ? "Install RIFT" : "Download RIFT"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isMobile
              ? "Add the app to your home screen"
              : "Get the desktop app for the best experience"}
          </p>
        </div>

        <DownloadSection />

        {!isMobile && (
          <div className="rounded-md border bg-card p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-card-foreground">
              Desktop Downloads
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
    <div className="landing-grid-bg relative min-h-screen overflow-hidden bg-background text-foreground">
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
      className="flex items-center gap-3 rounded-md border bg-background p-4 transition-colors hover:bg-accent"
    >
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <div className="font-medium text-card-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </a>
  );
}
