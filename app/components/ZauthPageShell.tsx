import Link from "next/link";
import { RiftWordmark } from "@/components/icons/rift-wordmark";
import { AuthPageBackground } from "@/app/components/AuthPageBackground";

/**
 * Public auth shell — Rift 2 / Extropic-aligned layout.
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
    <div className="landing-rift2-bg relative flex min-h-screen flex-col text-foreground">
      {showAuthChrome ? <AuthPageBackground /> : null}

      {showAuthChrome ? (
        <header className="absolute inset-x-0 top-0 z-50 px-4 pt-5 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link
              href="/"
              className="rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="RIFT home"
            >
              <RiftWordmark height={14} className="text-foreground" />
            </Link>
            <Link
              href="/"
              className="rounded-full border border-border/50 bg-background/40 px-4 py-1.5 text-[12px] font-medium text-muted-foreground backdrop-blur-md transition-colors hover:bg-surface-2/80 hover:text-foreground"
            >
              Back to home
            </Link>
          </div>
        </header>
      ) : null}

      <main
        className={`relative z-10 flex-1 ${center ? "flex items-center justify-center px-4 py-20 sm:py-24" : ""} ${className ?? ""}`}
      >
        {children}
      </main>

      {footer || center ? (
        <footer className="relative z-10 shrink-0 border-t border-border/30 py-6 text-center text-[12px] text-muted-foreground">
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
