"use client";

import { createContext, use } from "react";

export type AppShellVariant = "glass" | "studio";

export type AppShellValue = {
  variant: AppShellVariant;
  basePath: string;
  rootClass: string;
  sidebarClass: string;
  titlebarClass: string;
  panelClass: string;
  displayClass: string;
  composerClass: string;
};

const GLASS: AppShellValue = {
  variant: "glass",
  basePath: "/",
  rootClass: "app-rift2-shell",
  sidebarClass: "rift2-shell-sidebar",
  titlebarClass: "rift2-titlebar",
  panelClass: "rift2-glass-panel",
  displayClass: "rift2-display",
  composerClass:
    "rounded-2xl border border-border/60 bg-input-chat/90 shadow-[0_16px_48px_-24px_rgba(0,0,0,0.55)] backdrop-blur-sm",
};

const STUDIO: AppShellValue = {
  variant: "studio",
  basePath: "/studio",
  rootClass: "app-studio-shell",
  sidebarClass: "studio-shell-sidebar",
  titlebarClass: "studio-titlebar",
  panelClass: "studio-panel",
  displayClass: "studio-display",
  composerClass: "studio-composer",
};

const AppShellContext = createContext<AppShellValue>(GLASS);

export function AppShellProvider({
  variant,
  children,
}: {
  variant: AppShellVariant;
  children: React.ReactNode;
}) {
  const value = variant === "studio" ? STUDIO : GLASS;
  return <AppShellContext value={value}>{children}</AppShellContext>;
}

export function useAppShell() {
  return use(AppShellContext);
}

export function chatRoute(basePath: string, chatId?: string | null) {
  if (!chatId) return basePath === "/" ? "/" : basePath;
  return `${basePath}/c/${chatId}`;
}

export function isHomePath(pathname: string, basePath: string) {
  return pathname === basePath || pathname === `${basePath}/`;
}
