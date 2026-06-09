import type { NextRequest } from "next/server";
import { decodeJwt } from "jose";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { ChatSDKError } from "@/lib/errors";
import type { SubscriptionTier } from "@/types";
import {
  MOCK_TIER_STORAGE_KEY,
  resolveMockTierFromCookie,
} from "@/lib/billing/mock-billing";

/**
 * Server-side identity, backed by Convex Auth.
 *
 * The Convex Auth session JWT carries a `sub` claim of the form
 * `<userId>|<sessionId>`; the stable user id is the part before the pipe
 * (matching `getAuthUserId` on the Convex side).
 */
async function resolveUserId(): Promise<string | null> {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  try {
    const sub = decodeJwt(token).sub;
    if (!sub) return null;
    return sub.split("|")[0] || null;
  } catch {
    return null;
  }
}

/**
 * Get the current user ID from the authenticated session.
 * @throws ChatSDKError when the user is not authenticated.
 */
export const getUserID = async (_req?: NextRequest): Promise<string> => {
  const userId = await resolveUserId();
  if (!userId) {
    throw new ChatSDKError("unauthorized:auth");
  }
  return userId;
};

/**
 * Get the current user ID plus subscription tier.
 *
 * NOTE: paid entitlements were a billing construct; billing/teams migration is
 * deferred, so the tier defaults to `"free"` unless a local mock-billing cookie
 * overrides it (used for exercising paid features in development).
 */
export const getUserIDAndPro = async (
  req?: NextRequest,
): Promise<{
  userId: string;
  subscription: SubscriptionTier;
  organizationId?: string;
}> => {
  const userId = await resolveUserId();
  if (!userId) {
    throw new ChatSDKError("unauthorized:auth");
  }

  const mockTier = resolveMockTierFromCookie(
    req?.cookies.get(MOCK_TIER_STORAGE_KEY)?.value,
  );

  return {
    userId,
    subscription: mockTier ?? "free",
    organizationId: undefined,
  };
};

/**
 * Get the current user ID only for recently-authenticated sessions.
 *
 * The freshness window was enforced via a last-sign-in timestamp, which Convex
 * Auth does not expose; for now this is equivalent to {@link getUserID}. A
 * step-up re-auth check can be layered back on with the teams/MFA migration.
 */
export const getUserIDWithFreshLogin = async (
  _req?: NextRequest,
  _windowMs: number = 10 * 60 * 1000,
): Promise<string> => {
  const userId = await resolveUserId();
  if (!userId) {
    throw new ChatSDKError("unauthorized:auth", "recent_login_required");
  }
  return userId;
};
