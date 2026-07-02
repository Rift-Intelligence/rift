"use client";

import { useEffect, useRef } from "react";
import { useAuthActions } from "@convex-dev/auth/react";

/**
 * Completes the OAuth (Google) sign-in code exchange on the client.
 *
 * Why this is needed: we use `ConvexAuthNextjsServerProvider`, which always
 * supplies a `serverState`. The library's own `AuthProvider` therefore takes
 * the server-state branch and RETURNS EARLY, never running its built-in
 * `?code=` URL handler — it assumes `convexAuthNextjsMiddleware` already
 * exchanged the code server-side. This app runs a custom `/api/auth` route
 * handler instead of that middleware (middleware broke under Next 16), so the
 * redirect that lands on `/?code=...` was never being exchanged and the user
 * was bounced to the landing page logged out.
 *
 * We replicate exactly what the library would do: read the `code` from the URL,
 * strip it, and call `signIn(undefined, { code })`. The custom `/api/auth`
 * route already handles this action (it special-cases `params.code`), and the
 * PKCE verifier is in localStorage from when sign-in started.
 */
export function OAuthCodeHandler() {
  const { signIn } = useAuthActions();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current || typeof window === "undefined") return;
    const code = new URLSearchParams(window.location.search).get("code");
    if (!code) return;
    handled.current = true;

    // Strip the code from the URL first so a re-render can't reuse it.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);

    // `signIn(undefined, { code })` is exactly the call the library's internal
    // handler makes; the provider is intentionally undefined for a code exchange.
    void (
      signIn as unknown as (
        provider: undefined,
        params: { code: string },
      ) => Promise<unknown>
    )(undefined, { code })
      .then(() => {
        // The exchange set the session cookie client-side, but the
        // server-rendered auth state (serverState, read from the cookie at SSR
        // time) still thinks we're logged out and renders the landing page.
        // Reload so the server sees the new cookie and renders the authed app.
        window.location.replace("/");
      })
      .catch(() => {
        // Swallow — if it fails the user lands logged-out and can retry sign-in.
      });
  }, [signIn]);

  return null;
}
