import { NextRequest, NextResponse } from "next/server";
import { getUserID } from "@/lib/auth/get-user-id";
import { signState, sanitizeReturnTo } from "@/lib/github/oauth-state";

export const runtime = "nodejs";

/**
 * Kick off the GitHub OAuth "Connect GitHub" flow. This is a top-level browser
 * navigation (the button sets window.location here), so the session cookie is
 * sent and getUserID resolves the current user. We sign a `state` that binds
 * the flow to this user + where to return them, then 302 to GitHub's consent
 * screen. GitHub redirects back to /api/github/callback.
 */
export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const returnTo = sanitizeReturnTo(req.nextUrl.searchParams.get("return_to"));

  // Client ID is public (visible in the redirect URL); the secret stays server
  // side and is only used in the token exchange on the callback.
  const clientId =
    process.env.GITHUB_OAUTH_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(
      `${origin}${returnTo}${returnTo.includes("?") ? "&" : "?"}github=not_configured`,
    );
  }

  let userId: string;
  try {
    userId = await getUserID(req);
  } catch {
    // Not signed in — send them home; they can sign in and retry.
    return NextResponse.redirect(`${origin}/?github=auth_required`);
  }

  const state = signState(userId, returnTo);
  const redirectUri = `${origin}/api/github/callback`;

  const authorize = new URL("https://github.com/login/oauth/authorize");
  authorize.searchParams.set("client_id", clientId);
  authorize.searchParams.set("redirect_uri", redirectUri);
  // `repo` = clone/push private + public repos; `read:user` = resolve username.
  authorize.searchParams.set("scope", "repo read:user");
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("allow_signup", "false");

  return NextResponse.redirect(authorize.toString());
}
