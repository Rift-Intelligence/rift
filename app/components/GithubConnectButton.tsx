"use client";

import React, { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loader2, Check, X, Unplug } from "lucide-react";

// OAuth is available when a public client ID is configured at build time.
// (The client ID is not secret — it appears in GitHub's authorize URL.)
const OAUTH_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const OAUTH_ENABLED = !!OAUTH_CLIENT_ID;

// Guards the one-time toast for the ?github=<status> result param so two
// mounted buttons don't both fire it.
let oauthResultHandled = false;

const OAUTH_RESULT_MESSAGES: Record<
  string,
  { kind: "success" | "error"; message: string }
> = {
  connected: { kind: "success", message: "GitHub connected" },
  denied: { kind: "error", message: "GitHub authorization was cancelled." },
  auth_required: {
    kind: "error",
    message: "Please sign in first, then connect GitHub.",
  },
  not_configured: {
    kind: "error",
    message: "GitHub sign-in isn't configured yet.",
  },
  bad_state: {
    kind: "error",
    message: "GitHub connection expired — please try again.",
  },
  no_code: {
    kind: "error",
    message: "Couldn't connect GitHub — please try again.",
  },
  exchange_failed: {
    kind: "error",
    message: "GitHub rejected the sign-in — please try again.",
  },
  error: {
    kind: "error",
    message: "Couldn't connect GitHub — please try again.",
  },
};
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GithubMark = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ConvexError) {
    const data = error.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * "Connect GitHub" control — stores a personal access token so the Build agent
 * and the Terminal can clone/push the user's repos. Shown in the Build composer
 * and the Terminal header. `variant` picks the trigger sizing.
 */
export function GithubConnectButton({
  variant = "pill",
}: {
  variant?: "pill" | "button";
}) {
  const status = useQuery(api.github.getStatus, {});
  const connect = useMutation(api.github.connect);
  const disconnect = useMutation(api.github.disconnect);

  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  // Manual-token entry is a de-emphasised fallback: OAuth ("Continue with
  // GitHub") is the primary path, so users are never forced to paste a key.
  const [showToken, setShowToken] = useState(false);

  const connected = status?.connected ?? false;
  const username = status?.username;

  // Surface the OAuth round-trip result (the callback redirects back with
  // ?github=<status>) as a toast, then strip the param from the URL.
  useEffect(() => {
    if (oauthResultHandled) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("github");
    if (!result) return;
    oauthResultHandled = true;
    const entry = OAUTH_RESULT_MESSAGES[result];
    if (entry) {
      if (entry.kind === "success") toast.success(entry.message);
      else toast.error(entry.message);
    }
    params.delete("github");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
    );
  }, []);

  // Start the GitHub OAuth flow: a top-level navigation so the session cookie
  // rides along and the server can bind the flow to this user.
  const startOAuth = () => {
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/api/github/authorize?return_to=${encodeURIComponent(returnTo)}`;
  };

  // Not connected → OAuth (preferred) or the token dialog (fallback).
  // Connected → the manage/disconnect dialog.
  const handleTriggerClick = () => {
    if (!connected && OAUTH_ENABLED) {
      startOAuth();
      return;
    }
    setOpen(true);
  };

  const handleConnect = async () => {
    if (!token.trim() || busy) return;
    setBusy(true);
    try {
      // Verify the token + resolve the username (best-effort; GitHub allows CORS
      // on /user with a token).
      let login: string | undefined;
      try {
        const res = await fetch("https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            Accept: "application/vnd.github+json",
          },
        });
        if (res.ok) {
          const data = (await res.json()) as { login?: string };
          login = data.login;
        } else if (res.status === 401) {
          toast.error("That token was rejected by GitHub.");
          return;
        }
      } catch {
        // Network hiccup verifying — still store the token.
      }
      const r = await connect({ token: token.trim(), username: login });
      if (!r.success) {
        toast.error(r.error ?? "Failed to connect");
        return;
      }
      toast.success(login ? `Connected as ${login}` : "GitHub connected");
      setToken("");
      setOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to connect"));
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    setBusy(true);
    try {
      await disconnect({});
      toast.success("GitHub disconnected");
      setOpen(false);
    } catch (error) {
      toast.error(errorMessage(error, "Failed to disconnect"));
    } finally {
      setBusy(false);
    }
  };

  const label = connected ? username || "GitHub" : "Connect GitHub";

  const trigger =
    variant === "pill" ? (
      <button
        type="button"
        onClick={handleTriggerClick}
        title={connected ? `GitHub connected (${label})` : "Connect GitHub"}
        className="inline-flex h-6 items-center gap-1.5 rounded-md px-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <GithubMark className="size-3.5" />
        <span className="max-w-[8rem] truncate">{label}</span>
        {connected && <span className="size-1.5 rounded-full bg-emerald-500" />}
      </button>
    ) : (
      <button
        type="button"
        onClick={handleTriggerClick}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <GithubMark className="size-3.5" />
        {label}
        {connected && <span className="size-1.5 rounded-full bg-emerald-500" />}
      </button>
    );

  return (
    <>
      {trigger}
      <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
        <DialogContent className="max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <GithubMark className="size-4" />
              {connected ? "GitHub" : "Connect GitHub"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              {connected
                ? `Connected${username ? ` as ${username}` : ""}. RIFT can clone & push your repos in Build and the Terminal.`
                : "Authorize RIFT on GitHub — no token needed. RIFT can then clone & push your repos in Build and the Terminal."}
            </DialogDescription>
          </DialogHeader>

          {connected ? (
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-[13px] text-emerald-500">
                <Check className="size-4" />
                Connected{username ? ` as ${username}` : ""}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDisconnect}
                disabled={busy}
                className="h-8 gap-1.5 text-[12.5px] text-muted-foreground hover:text-destructive"
              >
                {busy ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Unplug className="size-3.5" />
                )}
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Primary path — redirect straight to GitHub's authorize screen. */}
              <Button
                size="sm"
                onClick={startOAuth}
                className="h-10 w-full gap-2 text-[13px]"
              >
                <GithubMark className="size-4" />
                Continue with GitHub
              </Button>
              <p className="text-center text-[11px] leading-relaxed text-muted-foreground/80">
                You&apos;ll be sent to GitHub to authorize RIFT, then brought
                right back. No token to copy or paste.
              </p>

              {/* De-emphasised fallback for users who prefer a PAT. */}
              <button
                type="button"
                onClick={() => setShowToken((v) => !v)}
                className="self-center text-[11px] text-muted-foreground/70 underline-offset-2 transition-colors hover:text-foreground hover:underline"
              >
                {showToken
                  ? "Hide advanced"
                  : "Advanced: use a personal access token"}
              </button>

              {showToken && (
                <div className="flex flex-col gap-2.5 border-t border-border pt-3">
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="ghp_… or a fine-grained token"
                    type="password"
                    spellCheck={false}
                    className="h-9 text-[13px]"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleConnect();
                    }}
                    autoFocus
                  />
                  <p className="text-[11px] leading-relaxed text-muted-foreground/80">
                    Create one at{" "}
                    <span className="rounded bg-muted px-1 py-0.5">
                      github.com/settings/tokens
                    </span>{" "}
                    with <code>repo</code> scope (or fine-grained repo access).
                  </p>
                  <div className="mt-1 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(false)}
                      className="h-9 gap-1.5 text-[13px]"
                    >
                      <X className="size-3.5" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleConnect}
                      disabled={!token.trim() || busy}
                      className="h-9 gap-1.5 text-[13px]"
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <GithubMark className="size-3.5" />
                      )}
                      Connect
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
