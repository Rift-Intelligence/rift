import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import ZauthPageShell from "@/app/components/ZauthPageShell";
import { AutoRetryButton } from "./auto-retry-button";

type ErrorCode = "429" | "401" | "403" | "500" | "502" | "503" | "504";

const ERROR_MESSAGES: Record<
  ErrorCode,
  { title: string; description: string; autoRetry?: boolean }
> = {
  "429": {
    title: "Too Many Requests",
    description:
      "Too many login attempts. Please wait a moment before trying again.",
  },
  "401": {
    title: "Session Expired",
    description:
      "Your session has expired or the login link is no longer valid. Please sign in again.",
  },
  "403": {
    title: "Access Denied",
    description:
      "You don't have permission to access this resource. Please sign in with a different account.",
  },
  "500": {
    title: "Authentication Failed",
    description:
      "Something went wrong during sign in. This can happen when multiple browser tabs try to authenticate at the same time.",
    autoRetry: true,
  },
  "502": {
    title: "Service Unavailable",
    description:
      "Our authentication service is temporarily unavailable. Please try again in a few minutes.",
  },
  "503": {
    title: "Service Unavailable",
    description:
      "Our authentication service is temporarily unavailable. Please try again in a few minutes.",
  },
  "504": {
    title: "Request Timeout",
    description:
      "The authentication request timed out. Please check your connection and try again.",
  },
};

const DEFAULT_ERROR = {
  title: "Authentication Error",
  description: "An unexpected error occurred during sign in. Please try again.",
};

type SearchParams = Promise<{ code?: string }>;

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { code } = await searchParams;
  const errorInfo = ERROR_MESSAGES[code as ErrorCode] ?? DEFAULT_ERROR;

  return (
    <ZauthPageShell header={false} center>
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-background/70 p-6 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.65)] backdrop-blur-md sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10">
            <AlertCircle className="size-6 text-destructive" />
          </div>
          <p className="rift2-display text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Auth error
          </p>
          <h1 className="rift2-display mt-2 text-xl font-medium tracking-tight text-foreground">
            {errorInfo.title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
            {errorInfo.description}
          </p>
          {code ? (
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/70">
              code: {code}
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {errorInfo.autoRetry ? (
            <AutoRetryButton loginUrl="/login" />
          ) : (
            <a
              href="/login"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-[13px] font-medium text-background transition-opacity hover:opacity-90"
            >
              <RefreshCw className="size-4" />
              Try again
            </a>
          )}
          <Link
            href="/"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-[13px] font-medium text-foreground transition-colors hover:border-signal/50 hover:bg-surface-2/40"
          >
            <Home className="size-4" />
            Go home
          </Link>
        </div>
      </div>
    </ZauthPageShell>
  );
}
