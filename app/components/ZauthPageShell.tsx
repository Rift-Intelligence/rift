import Link from "next/link";
import type { CSSProperties } from "react";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";

/**
 * Public auth shell — snulja-aligned: neutral near-black (#1C1C1C), a vivid
 * orange signal (#FF6309), Montserrat copy. Palette is forced here so the auth
 * pages read the same as the marketing landing regardless of app theme.
 */
const SHELL: CSSProperties = {
  ["--background" as string]: "#1c1c1c",
  ["--foreground" as string]: "#ffffff",
  ["--muted-foreground" as string]: "#a1a1a1",
  ["--card" as string]: "#232323",
  ["--popover" as string]: "#232323",
  ["--border" as string]: "#3a3a3a",
  ["--signal" as string]: "#ff6309",
  ["--primary" as string]: "#ff6309",
};

export default function ZauthPageShell({
  children,
  header = true,
  footer = false,
  center = false,
  className,
}: {
  children: React.ReactNode;
  header?: boolean;
  center?: boolean;
  footer?: boolean;
  className?: string;
}) {
  const showAuthChrome = center || header;

  return (
    <div
      style={SHELL}
      className="font-montserrat relative flex min-h-screen flex-col bg-background text-foreground"
    >
      {/* warm orange glow + top hairline, echoing the landing */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_-5%,rgba(255,99,9,0.14),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ff6309]/30 to-transparent"
      />

      {showAuthChrome ? (
        <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#ff6309]"
            >
              <RiftPixelMark size={22} />
              <RiftWordmark height={13} />
            </Link>
            <Link
              href="/"
              className="text-[13px] text-muted-foreground transition-colors hover:text-[#ff6309]"
            >
              Back to home
            </Link>
          </div>
        </header>
      ) : null}

      <main
        className={`relative flex-1 ${center ? "flex items-center justify-center px-4 py-10 sm:py-14" : ""} ${className ?? ""}`}
      >
        {children}
      </main>

      {footer || center ? (
        <footer className="relative shrink-0 border-t border-border py-6 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/terms-of-service" className="hover:text-foreground">
            Terms
          </Link>
          {"  ·  "}
          <Link href="/privacy-policy" className="hover:text-foreground">
            Privacy
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
