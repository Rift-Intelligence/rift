import type { SubscriptionTier } from "@/types";

/**
 * Pricing/upgrade UI was removed with the WorkOS/billing teardown. This hook is
 * kept as an inert shim so the upgrade CTAs scattered across the app (rate-limit
 * prompts, file-upload limits, etc.) compile and simply do nothing until billing
 * is reworked.
 */
export const usePricingDialog = (_subscription?: SubscriptionTier) => {
  return {
    showPricing: false,
    handleClosePricing: () => {},
    openPricing: () => {},
  };
};

/** No-op: pricing/upgrade flow has been removed. */
export const redirectToPricing = () => {};
