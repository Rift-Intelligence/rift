import { describe, it, expect } from "@jest/globals";
import {
  formatTokens,
  pointsToTokens,
  formatBalanceTokens,
  TOKENS_PER_POINT,
} from "../token-display";

describe("token-display", () => {
  describe("TOKENS_PER_POINT", () => {
    it("is 1 (1 displayed token == 1 point)", () => {
      expect(TOKENS_PER_POINT).toBe(1);
    });
  });

  describe("pointsToTokens", () => {
    it("maps points 1:1 to tokens", () => {
      expect(pointsToTokens(150_000)).toBe(150_000);
    });
    it("floors fractional points and clamps negatives to 0", () => {
      expect(pointsToTokens(99.9)).toBe(99);
      expect(pointsToTokens(-50)).toBe(0);
    });
  });

  describe("formatTokens (compact)", () => {
    it("renders millions with up to 2 decimals, trimming trailing zeros", () => {
      expect(formatTokens(1_250_000)).toBe("1.25M");
      expect(formatTokens(2_000_000)).toBe("2M");
      expect(formatTokens(3_600_000)).toBe("3.6M");
    });
    it("renders thousands with up to 1 decimal", () => {
      expect(formatTokens(42_000)).toBe("42K");
      expect(formatTokens(1_500)).toBe("1.5K");
      expect(formatTokens(200_000)).toBe("200K");
    });
    it("renders small counts verbatim", () => {
      expect(formatTokens(850)).toBe("850");
      expect(formatTokens(0)).toBe("0");
    });
    it("clamps negatives to 0", () => {
      expect(formatTokens(-100)).toBe("0");
    });
  });

  describe("formatTokens (full)", () => {
    it("groups the full number with separators", () => {
      expect(formatTokens(1_250_000, { compact: false })).toBe("1,250,000");
      expect(formatTokens(525_000, { compact: false })).toBe("525,000");
    });
  });

  describe("formatBalanceTokens", () => {
    it("formats a points balance straight to a compact token label", () => {
      expect(formatBalanceTokens(2_000_000)).toBe("2M");
    });
    it("supports the full (non-compact) form", () => {
      expect(formatBalanceTokens(200_000, { compact: false })).toBe("200,000");
    });
  });
});
