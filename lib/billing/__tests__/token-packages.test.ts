import { describe, it, expect } from "@jest/globals";
import {
  TOKEN_PACKAGES,
  MIN_CUSTOM_TOPUP_USD,
  getTokenPackage,
  bonusPointsForDollars,
} from "../token-packages";
import { POINTS_PER_DOLLAR } from "@/lib/rate-limit/token-bucket";

/**
 * Byte-identical mirror of the convex copy (convex/extraUsageActions.ts
 * bonusPointsForDollars) — Convex can't import app `lib/`. This guards that the
 * shared lib rule, the convex copy, and the package ladder never drift apart,
 * which would credit a different amount than the UI promised.
 */
const serverBonusPoints = (dollars: number): number => {
  const base = dollars * POINTS_PER_DOLLAR;
  let pct = 0;
  if (dollars >= 300) pct = 20;
  else if (dollars >= 100) pct = 10;
  else if (dollars >= 50) pct = 5;
  return Math.round((base * pct) / 100);
};

describe("token-packages", () => {
  it("has the locked ladder: $20 / $50 / $100 / $300", () => {
    expect(TOKEN_PACKAGES.map((p) => p.priceUsd)).toEqual([20, 50, 100, 300]);
  });

  it("base tokens equal price × POINTS_PER_DOLLAR", () => {
    for (const p of TOKEN_PACKAGES) {
      expect(p.baseTokens).toBe(p.priceUsd * POINTS_PER_DOLLAR);
    }
  });

  it("applies the locked bonus tiers (0 / 5 / 10 / 20%)", () => {
    expect(getTokenPackage("starter")!.bonusPct).toBe(0);
    expect(getTokenPackage("plus")!.bonusPct).toBe(5);
    expect(getTokenPackage("pro")!.bonusPct).toBe(10);
    expect(getTokenPackage("scale")!.bonusPct).toBe(20);
  });

  it("totals match the documented numbers", () => {
    expect(getTokenPackage("starter")!.totalTokens).toBe(200_000);
    expect(getTokenPackage("plus")!.totalTokens).toBe(525_000);
    expect(getTokenPackage("pro")!.totalTokens).toBe(1_100_000);
    expect(getTokenPackage("scale")!.totalTokens).toBe(3_600_000);
  });

  it("package bonus matches the shared bonus rule at every price point (no drift)", () => {
    for (const p of TOKEN_PACKAGES) {
      expect(p.bonusTokens).toBe(bonusPointsForDollars(p.priceUsd));
      expect(p.bonusTokens).toBe(serverBonusPoints(p.priceUsd));
      expect(p.totalTokens).toBe(
        p.priceUsd * POINTS_PER_DOLLAR + bonusPointsForDollars(p.priceUsd),
      );
    }
  });

  it("the exported bonus rule equals the convex-copy mirror everywhere", () => {
    for (const d of [10, 20, 49, 50, 75, 99, 100, 150, 299, 300, 1000]) {
      expect(bonusPointsForDollars(d)).toBe(serverBonusPoints(d));
    }
  });

  it("custom amounts land in the right bonus tier", () => {
    expect(bonusPointsForDollars(10)).toBe(0); // below $50
    expect(bonusPointsForDollars(49)).toBe(0);
    expect(bonusPointsForDollars(50)).toBe(50 * POINTS_PER_DOLLAR * 0.05);
    expect(bonusPointsForDollars(150)).toBe(150 * POINTS_PER_DOLLAR * 0.1);
    expect(bonusPointsForDollars(500)).toBe(500 * POINTS_PER_DOLLAR * 0.2);
  });

  it("exposes a $10 custom floor", () => {
    expect(MIN_CUSTOM_TOPUP_USD).toBe(10);
  });
});
