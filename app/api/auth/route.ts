import "server-only";
import { fetchAction } from "convex/nextjs";
import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Auth proxy for @convex-dev/auth. This faithfully re-implements the library's
 * `proxyAuthActionToConvex` (which is NOT exported from the package index, and
 * whose deep path is blocked by the package `exports` map) so it runs as a
 * plain Next.js Route Handler instead of middleware (which broke under Next 16).
 *
 * The two things a naive proxy gets wrong — and that caused the
 * "Could not verify OIDC token claim" login failures — are:
 *   1. Cookie NAMES: in production cookies are `__Host-`-prefixed. Reading/
 *      writing the unprefixed name silently desyncs from the client provider
 *      and leaves stale tokens that get rejected.
 *   2. Clearing cookies on a failed signIn, so an expired/invalid token can't
 *      loop forever — the next attempt starts clean.
 */

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function isLocalHost(host: string | null): boolean {
  return /(localhost|127\.0\.0\.1):\d+/.test(host ?? "");
}

type CookieKind = "token" | "refreshToken" | "verifier";

function cookieName(kind: CookieKind, isLocalhost: boolean): string {
  const prefix = isLocalhost ? "" : "__Host-";
  switch (kind) {
    case "token":
      return prefix + "__convexAuthJWT";
    case "refreshToken":
      return prefix + "__convexAuthRefreshToken";
    case "verifier":
      return prefix + "__convexAuthOAuthVerifier";
  }
}

function cookieOptions(isLocalhost: boolean) {
  return {
    // Safari drops `secure` cookies on http:// (incl. localhost), so only set
    // secure off localhost — where the `__Host-` prefix also requires it.
    secure: !isLocalhost,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  };
}

function setAuthCookies(
  response: NextResponse,
  tokens: { token: string; refreshToken: string } | null,
  isLocalhost: boolean,
) {
  const opts = cookieOptions(isLocalhost);
  if (tokens === null) {
    response.cookies.set(cookieName("token", isLocalhost), "", {
      ...opts,
      maxAge: 0,
    });
    response.cookies.set(cookieName("refreshToken", isLocalhost), "", {
      ...opts,
      maxAge: 0,
    });
  } else {
    response.cookies.set(cookieName("token", isLocalhost), tokens.token, {
      ...opts,
      maxAge: COOKIE_MAX_AGE,
    });
    response.cookies.set(
      cookieName("refreshToken", isLocalhost),
      tokens.refreshToken,
      { ...opts, maxAge: COOKIE_MAX_AGE },
    );
  }
  // Always clear the OAuth verifier after an auth action settles.
  response.cookies.set(cookieName("verifier", isLocalhost), "", {
    ...opts,
    maxAge: 0,
  });
}

function isCorsRequest(request: NextRequest): boolean {
  const origin = request.headers.get("Origin");
  if (!origin) return false;
  const originURL = new URL(origin);
  return (
    originURL.host !== request.headers.get("Host") ||
    originURL.protocol !== new URL(request.url).protocol
  );
}

// fetchAction is typed for FunctionReference; the auth actions are addressed by
// their string path at runtime (exactly as the library's own proxy does).
const runAction = fetchAction as unknown as (
  action: string,
  args: Record<string, unknown>,
  options: { url?: string; token?: string },
) => Promise<{
  tokens?: { token: string; refreshToken: string } | null;
  redirect?: string;
  verifier?: string;
} | null>;

export async function POST(request: NextRequest) {
  if (request.method !== "POST") {
    return new Response("Invalid method", { status: 405 });
  }
  if (isCorsRequest(request)) {
    return new Response("Invalid origin", { status: 403 });
  }

  const { action, args } = (await request.json()) as {
    action: string;
    args: Record<string, unknown>;
  };

  if (action !== "auth:signIn" && action !== "auth:signOut") {
    return new Response("Invalid action", { status: 400 });
  }

  const host = (await headers()).get("Host");
  const isLocalhost = isLocalHost(host);
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;

  let token: string | undefined;
  if (action === "auth:signIn" && args.refreshToken !== undefined) {
    // The client sends a dummy refreshToken; the real one lives only in cookies.
    const refreshToken = cookieStore.get(
      cookieName("refreshToken", isLocalhost),
    )?.value;
    if (!refreshToken) {
      return new Response(JSON.stringify({ tokens: null }), {
        headers: { "Content-Type": "application/json" },
      });
    }
    args.refreshToken = refreshToken;
  } else {
    // Authenticate the proxy call as the current user (needed for signOut and
    // session-aware signIn logic).
    token = cookieStore.get(cookieName("token", isLocalhost))?.value;
  }

  // OAuth code exchange: the PKCE/OAuth verifier was stored as an httpOnly
  // cookie when sign-in STARTED (it is never handed to the client), so it must
  // be injected here for the code-redemption call. Without this, Convex's
  // verifyCodeAndSignIn fails with "Invalid verifier" and the Google login
  // silently drops the user back on the landing page, logged out.
  if (
    action === "auth:signIn" &&
    (args.params as { code?: unknown } | undefined)?.code !== undefined
  ) {
    const verifier = cookieStore.get(
      cookieName("verifier", isLocalhost),
    )?.value;
    if (verifier !== undefined) {
      args.verifier = verifier;
    }
  }

  if (action === "auth:signIn") {
    // Don't require auth when refreshing tokens or validating a code — those are
    // steps in the auth flow, not authenticated requests.
    const authOpts =
      args.refreshToken !== undefined ||
      (args.params as { code?: unknown } | undefined)?.code !== undefined
        ? {}
        : { token };

    let result;
    try {
      result = await runAction(action, args, { url, ...authOpts });
    } catch (error) {
      // Clear cookies so an expired/invalid token can't loop forever.
      const response = NextResponse.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        { status: 400 },
      );
      setAuthCookies(response, null, isLocalhost);
      return response;
    }

    if (result?.redirect !== undefined) {
      const response = NextResponse.json({ redirect: result.redirect });
      if (result.verifier) {
        response.cookies.set(
          cookieName("verifier", isLocalhost),
          result.verifier,
          { ...cookieOptions(isLocalhost), maxAge: COOKIE_MAX_AGE },
        );
      }
      return response;
    }

    if (result && "tokens" in result) {
      const tokens = result.tokens ?? null;
      // The refresh token is never shared with the client — it stays in cookies.
      const response = NextResponse.json({
        tokens: tokens ? { token: tokens.token, refreshToken: "dummy" } : null,
      });
      setAuthCookies(response, tokens, isLocalhost);
      return response;
    }

    return NextResponse.json(result);
  }

  // auth:signOut — best-effort, then always clear cookies.
  try {
    await runAction(action, args, { url, token });
  } catch (error) {
    console.error("Hit error while running `auth:signOut`:", error);
  }
  const response = NextResponse.json(null);
  setAuthCookies(response, null, isLocalhost);
  return response;
}
