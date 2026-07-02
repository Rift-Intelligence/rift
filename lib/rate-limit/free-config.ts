// Free tier (split model):
//   • Ask  — 3 messages per day (daily fixed window, resets midnight UTC).
//   • Agent — ONE free run for life (claimed in Convex extra_usage); after
//     that the user must buy tokens. Agent is gated separately in
//     checkRateLimit() and does NOT draw from the daily Ask window.
// The $5/month cost cap is a backstop on the Ask allowance. Tune
// FREE_RATE_LIMIT_REQUESTS (env) to change the daily Ask allowance.
export const FREE_MONTHLY_COST_LIMIT_USD_DEFAULT = 5.0;
// Short base TTLs so a run that dies without releasing (hard kill, OOM, infra
// restart, client disconnect, function timeout) self-heals within minutes
// instead of locking the user out for 15–65 min. The long agent run keeps the
// lock alive by refreshing it every ~60s (see agent-long.ts); a dead run stops
// refreshing and the lock expires within one TTL. Paying users (positive
// balance) skip the lock entirely at the call sites.
export const FREE_RUN_LOCK_TTL_SECONDS = 3 * 60;
export const FREE_AGENT_LONG_RUN_LOCK_TTL_SECONDS = 3 * 60;
export const PAID_MAX_OUTPUT_TOKENS = 30000;
export const FREE_MAX_OUTPUT_TOKENS = PAID_MAX_OUTPUT_TOKENS / 2;
export const FREE_MAX_CONTEXT_TOKENS = 128000;
// Daily Ask allowance (agent has its own lifetime gate, not this window).
export const FREE_RATE_LIMIT_REQUESTS_DEFAULT = 3;
export const FREE_ASK_REQUEST_COST = 1;
// Retained for back-compat; agent is now gated by a lifetime flag, not cost.
export const FREE_AGENT_REQUEST_COST = 1;

export const getFreeRequestLimit = (): number => {
  const configuredLimit = parseInt(
    process.env.FREE_RATE_LIMIT_REQUESTS || "",
    10,
  );
  return Number.isFinite(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : FREE_RATE_LIMIT_REQUESTS_DEFAULT;
};

export const getFreeMonthlyCostLimitDollars = (): number => {
  const configuredLimit = Number(process.env.FREE_MONTHLY_COST_LIMIT_USD);
  return Number.isFinite(configuredLimit) && configuredLimit > 0
    ? configuredLimit
    : FREE_MONTHLY_COST_LIMIT_USD_DEFAULT;
};
