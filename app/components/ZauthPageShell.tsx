import Link from "next/link";
import { RiftPixelMark } from "@/components/icons/rift-pixel-mark";
import { RiftWordmark } from "@/components/icons/rift-wordmark";

/**
 * Public auth shell — Cursor / landing-aligned dark layout.
 */
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
    <div className="landing-grid-bg flex min-h-screen flex-col bg-background text-foreground">
      {showAuthChrome ? (
        <header className="sticky top-0 z-10 shrink-0 border-b border-border/60 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <RiftPixelMark size={22} />
              <RiftWordmark height={13} />
            </Link>
            <Link
              href="/"
              className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
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
        <footer className="shrink-0 border-t border-border/40 py-6 text-center text-[12px] text-muted-foreground">
          <Link href="/terms-of-service" className="hover:text-foreground">
            Terms
          </Link>
          {" · "}
          <Link href="/privacy-policy" className="hover:text-foreground">
            Privacy
          </Link>
        </footer>
      ) : null}
    </div>
  );
}
