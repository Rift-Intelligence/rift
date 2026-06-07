import type { SubscriptionTier } from "@/types";

/**
 * Mock billing helpers for local testing. When NEXT_PUBLIC_MOCK_BILLING is
 * enabled, upgrades bypass Stripe/WorkOS entirely and the selected tier is
 * persisted to localStorage so the client can resolve it as the active
 * subscription tier.
 */

export const MOCK_TIER_STORAGE_KEY = "mock_subscription_tier";

export function isMockBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_BILLING === "true";
}

/** Map a Stripe-style plan lookup key to a subscription tier. */
export function planKeyToTier(planKey: string): SubscriptionTier {
  if (planKey.startsWith("ultra")) return "ultra";
  if (planKey.startsWith("pro-plus")) return "pro-plus";
  if (planKey.startsWith("team")) return "team";
  if (planKey.startsWith("pro")) return "pro";
  return "free";
}

const VALID_TIERS: ReadonlySet<SubscriptionTier> = new Set([
  "free",
  "pro",
  "pro-plus",
  "ultra",
  "team",
]);

/** Read the persisted mock tier, or null when unset/invalid. */
export function getMockTier(): SubscriptionTier | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(MOCK_TIER_STORAGE_KEY);
  if (raw && VALID_TIERS.has(raw as SubscriptionTier)) {
    return raw as SubscriptionTier;
  }
  return null;
}

/** Persist the mock tier for subsequent page loads (localStorage + cookie).
 * The cookie lets the server honor the mock tier for API gating. */
export function setMockTier(tier: SubscriptionTier): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_TIER_STORAGE_KEY, tier);
  // 30-day cookie so server routes can read the mock tier during local testing.
  document.cookie = `${MOCK_TIER_STORAGE_KEY}=${tier}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

/** Clear the persisted mock tier (e.g. to simulate downgrade to free). */
export function clearMockTier(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(MOCK_TIER_STORAGE_KEY);
  document.cookie = `${MOCK_TIER_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`;
}

/**
 * Server-side: resolve a mock tier from the request cookies. Only honored when
 * MOCK_BILLING is enabled. Returns null otherwise so production is unaffected.
 */
export function resolveMockTierFromCookie(
  cookieValue: string | undefined,
): SubscriptionTier | null {
  if (process.env.MOCK_BILLING !== "true") return null;
  if (cookieValue && VALID_TIERS.has(cookieValue as SubscriptionTier)) {
    return cookieValue as SubscriptionTier;
  }
  return null;
}
