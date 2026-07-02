import type { NextRequest } from "next/server";
import { getConvexClient } from "@/lib/db/convex-client";
import { api } from "@/convex/_generated/api";
import type { SubscriptionTier } from "@/types";

const KEY_PREFIX = "rift_live_";

export interface ApiKeyAuth {
  userId: string;
  subscription: SubscriptionTier;
}

/**
 * Resolve a RIFT personal API key from the `Authorization: Bearer <key>`
 * header. Lets a premium user drive the full agent (/api/chat — every tool,
 * every purpose) from their own terminal/scripts instead of a browser
 * session. See convex/apiKeys.ts for issuance + the backend-only resolver.
 *
 * Returns null for any request that isn't presenting a RIFT key (the normal,
 * session-cookie case) or whose key is invalid/revoked/no-longer-premium —
 * callers fall back to the existing session-based auth in that case.
 */
export async function resolveApiKeyAuth(
  req?: NextRequest,
): Promise<ApiKeyAuth | null> {
  const header = req?.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;

  const key = header.slice("Bearer ".length).trim();
  if (!key.startsWith(KEY_PREFIX)) return null;

  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;

  try {
    const resolved = await getConvexClient().mutation(
      api.apiKeys.resolveForBackend,
      { serviceKey, key },
    );
    if (!resolved) return null;
    return { userId: resolved.userId, subscription: resolved.tier };
  } catch (error) {
    console.warn("[api-key] resolution failed:", error);
    return null;
  }
}
