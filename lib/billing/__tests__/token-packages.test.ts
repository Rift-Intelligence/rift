import { describe, it, expect } from "@jest/globals";
import {
  TOKEN_PACKAGES,
  MIN_CUSTOM_TOPUP_USD,
  getTokenPackage,
} from "../token-packages";
import { POINTS_PER_DOLLAR } from "@/lib/rate-limit/token-bucket";

/**
 * Mirror of the server-side bonus rule (convex/extraUsageActions.ts
 * bonusPointsForDollars). This test is the guard that the two definitions —
 * the package ladder (display) and the threshold rule (crediting) — never
 * drift apart, which would credit a different amount than the UI promised.
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

  it("package bonus matches the server threshold rule at every price point (no drift)", () => {
    for (const p of TOKEN_PACKAGES) {
      expect(p.bonusTokens).toBe(serverBonusPoints(p.priceUsd));
      expect(p.totalTokens).toBe(
        p.priceUsd * POINTS_PER_DOLLAR + serverBonusPoints(p.priceUsd),
      );
    }
  });

  it("custom amounts land in the right server bonus tier", () => {
    expect(serverBonusPoints(10)).toBe(0); // below $50
    expect(serverBonusPoints(49)).toBe(0);
    expect(serverBonusPoints(50)).toBe(50 * POINTS_PER_DOLLAR * 0.05);
    expect(serverBonusPoints(150)).toBe(150 * POINTS_PER_DOLLAR * 0.1);
    expect(serverBonusPoints(500)).toBe(500 * POINTS_PER_DOLLAR * 0.2);
  });

  it("exposes a $10 custom floor", () => {
    expect(MIN_CUSTOM_TOPUP_USD).toBe(10);
  });
});
