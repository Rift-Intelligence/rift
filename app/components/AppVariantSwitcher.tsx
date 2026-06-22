"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppShellVariant } from "@/app/contexts/AppShellContext";

const VARIANTS: { id: AppShellVariant; label: string; href: string }[] = [
  { id: "glass", label: "Glass", href: "/" },
  { id: "studio", label: "Studio", href: "/studio" },
];

function activeVariant(pathname: string): AppShellVariant {
  return pathname.startsWith("/studio") ? "studio" : "glass";
}

export function AppVariantSwitcher() {
  const pathname = usePathname();
  const active = activeVariant(pathname);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-background/90 p-1 shadow-lg backdrop-blur-md">
        <span className="hidden px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          App
        </span>
        {VARIANTS.map(({ id, label, href }) => (
          <Link
            key={id}
            href={href}
            className={`rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-[12px] ${
              active === id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
