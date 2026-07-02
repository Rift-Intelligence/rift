import type { RateLimitInfo, SubscriptionTier } from "@/types";
import { refundUsage } from "./token-bucket";
import { refundFreeAgentRun } from "@/lib/extra-usage";

/**
 * Tracks usage deductions and handles refunds on error.
 * Ensures refunds only happen once, even if multiple error handlers trigger.
 */
export class UsageRefundTracker {
  private pointsDeducted = 0;
  private extraUsagePointsDeducted = 0;
  private userId: string | undefined;
  private subscription: SubscriptionTier | undefined;
  private organizationId: string | undefined;
  private freeAgentClaimed = false;
  private hasRefunded = false;

  /**
   * Set user context for refunds.
   */
  setUser(
    userId: string,
    subscription: SubscriptionTier,
    organizationId?: string,
  ): void {
    this.userId = userId;
    this.subscription = subscription;
    this.organizationId = organizationId;
  }

  /**
   * Record deductions from rate limit check.
   */
  recordDeductions(rateLimitInfo: RateLimitInfo): void {
    this.pointsDeducted = rateLimitInfo.pointsDeducted ?? 0;
    this.extraUsagePointsDeducted = rateLimitInfo.extraUsagePointsDeducted ?? 0;
  }

  /**
   * Mark that this request spent the user's one free Agent run, so a refund
   * also un-claims that lifetime gate (a free agent run has no balance points).
   */
  recordFreeAgentClaim(): void {
    this.freeAgentClaimed = true;
  }

  /**
   * Check if there are any deductions to refund.
   */
  hasDeductions(): boolean {
    return this.pointsDeducted > 0 || this.extraUsagePointsDeducted > 0;
  }

  /**
   * One-line summary of what this tracker is responsible for refunding — for
   * structured logging / manual reconciliation when a refund attempt fails.
   */
  getDeductionSummary(): {
    userId: string | undefined;
    pointsDeducted: number;
    extraUsagePointsDeducted: number;
    freeAgentClaimed: boolean;
  } {
    return {
      userId: this.userId,
      pointsDeducted: this.pointsDeducted,
      extraUsagePointsDeducted: this.extraUsagePointsDeducted,
      freeAgentClaimed: this.freeAgentClaimed,
    };
  }

  /**
   * Refund all deducted credits (idempotent — only latches once fully settled).
   * Call this from error handlers to restore credits on failure.
   *
   * Returns `true` when there is nothing to refund or everything settled, and
   * `false` when a refund was attempted but a sub-step failed. A `false` return
   * means the user's credits are NOT yet restored: the caller should surface a
   * non-fatal warning so the burn is visible + reconcilable. The tracker does
   * not latch on failure, so a later error handler (or retry) re-attempts.
   */
  async refund(): Promise<boolean> {
    if (this.hasRefunded) {
      return true;
    }
    if (!this.hasDeductions() && !this.freeAgentClaimed) {
      return true;
    }

    let allOk = true;

    // Refund any prepaid-balance / token-bucket deduction.
    if (this.hasDeductions() && this.userId && this.subscription) {
      try {
        await refundUsage(
          this.userId,
          this.subscription,
          this.pointsDeducted,
          this.extraUsagePointsDeducted,
          this.organizationId,
        );
      } catch (error) {
        // High-signal: a swallowed failure here means the user paid for a
        // request that never ran. Log enough to reconcile by hand.
        console.error("[refund] Failed to refund usage:", {
          userId: this.userId,
          pointsDeducted: this.pointsDeducted,
          extraUsagePointsDeducted: this.extraUsagePointsDeducted,
          error: error instanceof Error ? error.message : String(error),
        });
        allOk = false;
      }
    }

    // Un-claim the one free Agent run (separate lifetime gate, no balance
    // points), so a failed free agent run does not burn the user's free try.
    if (this.freeAgentClaimed && this.userId) {
      const ok = await refundFreeAgentRun(this.userId);
      if (!ok) {
        console.error("[refund] Failed to un-claim free agent run:", {
          userId: this.userId,
        });
        allOk = false;
      }
    }

    // Only latch as refunded once everything succeeded, so a transient failure
    // can still be retried by a later error handler.
    if (allOk) {
      this.hasRefunded = true;
    }
    return allOk;
  }
}
