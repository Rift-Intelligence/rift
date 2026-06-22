"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Variant = "rift1" | "rift2" | "rift3";

const VARIANTS: {
  id: Variant;
  label: string;
  href: string | ((onHome: boolean) => string);
}[] = [
  {
    id: "rift1",
    label: "Rift 1",
    href: (onHome) => (onHome ? "/" : "/landing/rift1"),
  },
  { id: "rift2", label: "Rift 2", href: "/landing/rift2" },
  { id: "rift3", label: "Rift 3", href: "/landing/rift3" },
];

export function LandingVariantSwitcher({ active }: { active: Variant }) {
  const pathname = usePathname();
  const onHome = pathname === "/";

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] -translate-x-1/2">
      <div className="flex items-center gap-0.5 rounded-full border border-border/70 bg-background/90 p-1 shadow-lg backdrop-blur-md">
        <span className="hidden px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:inline">
          Preview
        </span>
        {VARIANTS.map(({ id, label, href }) => {
          const path = typeof href === "function" ? href(onHome) : href;
          return (
            <Link
              key={id}
              href={path}
              className={`rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-3 sm:text-[12px] ${
                active === id
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
