import { getConvexClient } from "@/lib/db/convex-client";
import { api } from "@/convex/_generated/api";

export interface LoadedGithubToken {
  token: string;
  username?: string;
}

/**
 * Backend: fetch the user's connected GitHub token (if any) so the Build agent
 * can pre-authenticate git in its sandbox. Service-key guarded on the Convex
 * side. Non-fatal — returns null when GitHub isn't connected or the lookup
 * fails, so a missing/slow connection never blocks the agent run.
 */
export async function loadUserGithubToken(
  userId: string,
): Promise<LoadedGithubToken | null> {
  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  try {
    const gh = await getConvexClient().query(api.github.getTokenForBackend, {
      serviceKey,
      userId,
    });
    if (gh?.token) return { token: gh.token, username: gh.username };
  } catch (error) {
    console.warn("[github] token load failed:", error);
  }
  return null;
}
