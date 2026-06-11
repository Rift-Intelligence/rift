/**
 * Token display helpers — render the prepaid balance as "tokens" in the UI.
 *
 * 1 displayed token = 1 point = $0.0001 retail value. The balance lives in
 * points (`extra_usage.balance_points`); these helpers format that integer for
 * humans without leaking the dollar/point abstraction.
 */

/** 1 displayed token == 1 point. Kept explicit so a future rescale is one edit. */
export const TOKENS_PER_POINT = 1;

/** Convert a points balance to displayed tokens. */
export function pointsToTokens(points: number): number {
  return Math.max(0, Math.floor(points * TOKENS_PER_POINT));
}

/**
 * Format a token count for display.
 *
 *   1_250_000 → "1.25M"
 *   42_000    → "42K"
 *   1_500     → "1.5K"
 *   850       → "850"
 *
 * Compact by default (sidebar badge); pass `{ compact: false }` for a grouped
 * full number ("1,250,000") in settings/detail views.
 */
export function formatTokens(
  tokens: number,
  opts?: { compact?: boolean },
): string {
  const n = Math.max(0, Math.floor(tokens));
  const compact = opts?.compact ?? true;

  if (!compact) {
    return n.toLocaleString("en-US");
  }

  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    // Trim trailing ".0" → "2M" not "2.0M"; keep up to 2 sig decimals → "1.25M".
    return `${parseFloat(m.toFixed(2))}M`;
  }
  if (n >= 1_000) {
    const k = n / 1_000;
    return `${parseFloat(k.toFixed(1))}K`;
  }
  return `${n}`;
}

/** Convenience: format a points balance straight to a token label. */
export function formatBalanceTokens(
  points: number,
  opts?: { compact?: boolean },
): string {
  return formatTokens(pointsToTokens(points), opts);
}
