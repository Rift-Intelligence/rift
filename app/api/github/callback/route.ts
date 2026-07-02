import { NextRequest, NextResponse } from "next/server";
import { getConvexClient } from "@/lib/db/convex-client";
import { api } from "@/convex/_generated/api";
import { verifyState } from "@/lib/github/oauth-state";

export const runtime = "nodejs";

function back(origin: string, returnTo: string, status: string) {
  const sep = returnTo.includes("?") ? "&" : "?";
  return NextResponse.redirect(`${origin}${returnTo}${sep}github=${status}`);
}

/**
 * GitHub redirects here after the user approves (or denies) the consent screen.
 * We verify the signed `state`, exchange the `code` for a user access token,
 * resolve the username, and store the token (service-key mutation) so the Build
 * agent and Terminal can use it. Then we send the user back to where they were.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const params = req.nextUrl.searchParams;

  // Verify state first so we know a safe returnTo for every downstream redirect.
  const verified = verifyState(params.get("state"));
  const returnTo = verified?.returnTo ?? "/";

  // User denied, or GitHub returned an error.
  if (params.get("error")) {
    return back(origin, returnTo, "denied");
  }
  if (!verified) {
    return back(origin, "/", "bad_state");
  }

  const code = params.get("code");
  if (!code) {
    return back(origin, returnTo, "no_code");
  }

  const clientId =
    process.env.GITHUB_OAUTH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return back(origin, returnTo, "not_configured");
  }

  try {
    // Exchange the authorization code for a user access token.
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: `${origin}/api/github/callback`,
        }),
      },
    );
    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
    };
    const token = tokenData.access_token;
    if (!token) {
      return back(origin, returnTo, "exchange_failed");
    }

    // Resolve the username (best-effort — token still gets stored if this fails).
    let username: string | undefined;
    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
        },
      });
      if (userRes.ok) {
        const u = (await userRes.json()) as { login?: string };
        username = u.login;
      }
    } catch {
      // ignore — username is optional
    }

    const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return back(origin, returnTo, "not_configured");
    }
    await getConvexClient().mutation(api.github.connectForBackend, {
      serviceKey,
      userId: verified.userId,
      token,
      username,
    });

    return back(origin, returnTo, "connected");
  } catch (error) {
    console.warn("[github/callback] failed:", error);
    return back(origin, returnTo, "error");
  }
}
