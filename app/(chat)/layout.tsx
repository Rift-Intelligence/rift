"use client";

import { usePathname } from "next/navigation";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import { ChatLayout } from "@/app/components/ChatLayout";
import {
  AppShellProvider,
  type AppShellVariant,
} from "@/app/contexts/AppShellContext";
import Loading from "@/components/ui/loading";

function shellVariant(pathname: string): AppShellVariant {
  return pathname.startsWith("/studio") ? "studio" : "glass";
}

function shellClass(variant: AppShellVariant) {
  return variant === "studio" ? "app-studio-shell" : "app-rift2-shell";
}

function LoadingShell({ variant }: { variant: AppShellVariant }) {
  return (
    <div
      className={`${shellClass(variant)} flex h-dvh min-h-0 flex-col overflow-hidden`}
    >
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Loading />
      </div>
    </div>
  );
}

/**
 * Shared layout for /, /c/[id], and /studio/*. Renders the Chat Sidebar only when
 * authenticated so it stays mounted across navigations within the group.
 */
export default function ChatRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const variant = shellVariant(pathname);
  const rootClass = shellClass(variant);

  return (
    <AppShellProvider variant={variant}>
      <AuthLoading>
        <LoadingShell variant={variant} />
      </AuthLoading>
      <Unauthenticated>
        <div
          className={`${rootClass} flex h-dvh min-h-0 flex-col overflow-hidden`}
        >
          {children}
        </div>
      </Unauthenticated>
      <Authenticated>
        <div
          className={`${rootClass} flex h-dvh min-h-0 flex-col overflow-hidden`}
        >
          <ChatLayout>{children}</ChatLayout>
        </div>
      </Authenticated>
    </AppShellProvider>
  );
}
