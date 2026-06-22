/**
 * Rate Limiting Module
 *
 * Two rate limiting strategies based on subscription tier (NOT mode):
 *
 * 1. Token Bucket (Paid users - Pro, Pro+, Ultra, Team):
 *    - Used for both Agent and Ask modes (shared budget)
 *    - Points consumed based on token usage costs
 *    - Single monthly bucket: credits = subscription price, refills every 30 days
 *    - Supports extra usage (prepaid balance) when limits exceeded
 *
 * 2. Fixed Window (Free users):
 *    - Shared request-unit counting within a daily fixed window (resets at midnight UTC)
 *    - Ask mode costs 1 unit
 *    - Agent mode (local sandbox only) costs 2 units
 *    - Default free budget: 10 units/day (FREE_RATE_LIMIT_REQUESTS)
 */

import { isAgentMode } from "@/lib/utils/mode-helpers";
import type {
  ChatMode,
  SubscriptionTier,
  RateLimitInfo,
  ExtraUsageConfig,
} from "@/types";

// Re-export token bucket functions
export {
  checkTokenBucketLimit,
  checkBalanceLimit,
  deductUsage,
  deductBalanceUsage,
  computeActualCostPoints,
  refundUsage,
  resetRateLimitBuckets,
  stashOldBucketRemaining,
  popOldBucketRemaining,
  initProratedBucket,
  calculateProratedCredits,
  getTeamMemberConsumed,
  addOrgRemovedUsage,
  clearOrgRemovedUsage,
  applyTeamSeatDebt,
  calculateTokenCost,
  getBudgetLimits,
  getSubscriptionPrice,
  POINTS_PER_DOLLAR,
} from "./token-bucket";

// Re-export sliding window functions
export {
  checkFreeUserRateLimit,
  checkFreeAgentRateLimit,
  grantFreeReferralBonusUnits,
} from "./sliding-window";

// Re-export utilities
export { createRedisClient, formatTimeRemaining } from "./redis";
export { UsageRefundTracker } from "./refund";
export { acquireFreeRunConcurrencyLock } from "./free-concurrency";
export {
  checkFreeMonthlyCostLimit,
  recordFreeMonthlyCost,
} from "./free-monthly-cost";

// Import for internal use
import { checkTokenBucketLimit, checkBalanceLimit } from "./token-bucket";
import { checkFreeMonthlyCostLimit } from "./free-monthly-cost";
import { FREE_AGENT_REQUEST_COST, FREE_ASK_REQUEST_COST } from "./free-config";
import {
  checkFreeUserRateLimit,
  checkFreeAgentRateLimit,
} from "./sliding-window";

/**
 * Check rate limit for a user.
 *
 * Routes to the appropriate strategy based on subscription tier:
 * - Free users: Sliding window (simple request counting)
 * - Paid users: Token bucket (cost-based, shared budget for all modes)
 *
 * @param userId - The user's unique identifier
 * @param mode - The chat mode ("agent" or "ask") - used only for agent mode blocking
 * @param subscription - The user's subscription tier
 * @param estimatedInputTokens - Estimated input tokens (for token bucket)
 * @param extraUsageConfig - Optional config for extra usage charging
 * @returns Rate limit info including remaining quota
 */
export const checkRateLimit = async (
  userId: string,
  mode: ChatMode,
  subscription: SubscriptionTier,
  estimatedInputTokens?: number,
  extraUsageConfig?: ExtraUsageConfig,
  modelName?: string,
  organizationId?: string,
): Promise<RateLimitInfo> => {
  // Free users (PAYG): daily + monthly free budget first, then prepaid balance.
  if (subscription === "free") {
    const requestCost = isAgentMode(mode)
      ? FREE_AGENT_REQUEST_COST
      : FREE_ASK_REQUEST_COST;

    // Peek the monthly free-cost cap WITHOUT throwing or consuming, so an
    // exhausted month falls through to the prepaid balance instead of a hard
    // block — mirroring the daily-window fall-through below.
    const monthly = await checkFreeMonthlyCostLimit(userId, {
      throwOnExhaustion: false,
    });

    if (!monthly.monthlyExhausted) {
      // Monthly budget still has room — consume the daily free window WITHOUT
      // throwing on exhaustion so we can still fall through to balance.
      const free = await checkFreeUserRateLimit(userId, requestCost, {
        throwOnExhaustion: false,
      });

      if (!free.freeExhausted) {
        // Served within both the daily allowance and the monthly free cap —
        // no balance charge.
        return free;
      }
    }

    // Daily or monthly free budget spent. Draw from the prepaid token balance;
    // throws a "buy tokens" error when empty and auto-reload is off.
    return checkBalanceLimit(
      userId,
      estimatedInputTokens || 0,
      modelName,
      extraUsageConfig,
    );
  }

  // Paid users: token bucket (same budget for both modes)
  return checkTokenBucketLimit(
    userId,
    subscription,
    estimatedInputTokens || 0,
    extraUsageConfig,
    modelName,
    organizationId,
  );
};
