import { mutation, query, type QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { validateServiceKey } from "./lib/utils";
import { api } from "./_generated/api";

// Monthly "included" usage allowance per tier, in points (1 point = $0.0001).
// Mirrors app/api/lemonsqueezy/webhook/route.ts TIER_ALLOWANCE_POINTS so an
// admin-granted subscription provisions the same allowance a real payment would.
const TIER_ALLOWANCE_POINTS: Record<string, number> = {
  pro: 500_000,
  ultra: 1_800_000,
};

/**
 * Emails allowed to view the admin dashboard. Add owners/operators here.
 */
const ADMIN_EMAILS = new Set<string>(["ahmetcet92@hotmail.com"]);

export async function isAdminUser(ctx: QueryCtx): Promise<boolean> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return false;
  const me = await ctx.db.get(userId);
  const email = (me as { email?: string } | null)?.email;
  return !!email && ADMIN_EMAILS.has(email.toLowerCase());
}

/**
 * Admin dashboard stats. Returns null for non-admins (the UI treats null as
 * "not authorized"). Reads full tables — fine at current scale; revisit with
 * aggregates if the user base grows large.
 */
export const getAdminStats = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      totalUsers: v.number(),
      totalRevenueDollars: v.number(),
      activeLast7Days: v.number(),
      totalChats: v.number(),
      users: v.array(
        v.object({
          id: v.string(),
          email: v.string(),
          name: v.union(v.string(), v.null()),
          joinedAt: v.number(),
          balancePoints: v.number(),
          revenueDollars: v.number(),
          lastActiveAt: v.union(v.number(), v.null()),
        }),
      ),
    }),
  ),
  handler: async (ctx) => {
    if (!(await isAdminUser(ctx))) {
      return null;
    }

    const [users, revenueEvents, balances, chats] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("revenue_events").collect(),
      ctx.db.query("extra_usage").collect(),
      ctx.db.query("chats").collect(),
    ]);

    const revenueByUser = new Map<string, number>();
    let totalRevenueDollars = 0;
    for (const e of revenueEvents) {
      totalRevenueDollars += e.gross_revenue_dollars;
      if (e.user_id) {
        revenueByUser.set(
          e.user_id,
          (revenueByUser.get(e.user_id) ?? 0) + e.gross_revenue_dollars,
        );
      }
    }

    const balanceByUser = new Map<string, number>();
    for (const b of balances) {
      balanceByUser.set(b.user_id, b.balance_points);
    }

    const lastActiveByUser = new Map<string, number>();
    for (const c of chats) {
      const prev = lastActiveByUser.get(c.user_id);
      if (prev === undefined || c._creationTime > prev) {
        lastActiveByUser.set(c.user_id, c._creationTime);
      }
    }

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    let activeLast7Days = 0;
    for (const t of lastActiveByUser.values()) {
      if (now - t < sevenDays) activeLast7Days++;
    }

    const userRows = users
      .map((u) => {
        const id = u._id as string;
        return {
          id,
          email: (u as { email?: string }).email ?? "—",
          name: (u as { name?: string }).name ?? null,
          joinedAt: u._creationTime,
          balancePoints: balanceByUser.get(id) ?? 0,
          revenueDollars: revenueByUser.get(id) ?? 0,
          lastActiveAt: lastActiveByUser.get(id) ?? null,
        };
      })
      .sort((a, b) => b.joinedAt - a.joinedAt);

    return {
      totalUsers: users.length,
      totalRevenueDollars,
      activeLast7Days,
      totalChats: chats.length,
      users: userRows,
    };
  },
});

/** Extract the human-readable text from a stored message (content or parts). */
function extractText(m: { content?: string; parts?: unknown[] }): string {
  if (typeof m.content === "string" && m.content.trim().length > 0) {
    return m.content;
  }
  if (Array.isArray(m.parts)) {
    for (const p of m.parts) {
      if (
        p &&
        typeof p === "object" &&
        (p as { type?: unknown }).type === "text" &&
        typeof (p as { text?: unknown }).text === "string"
      ) {
        return (p as { text: string }).text;
      }
    }
  }
  return "";
}

/**
 * Admin activity feed: every chat (most recent first) with the owner's email
 * and title. Reads only users + chats (no message bodies) so it stays cheap at
 * any scale; drill into a single conversation with getAdminChatMessages.
 */
export const getAdminActivity = query({
  args: {},
  returns: v.union(
    v.null(),
    v.array(
      v.object({
        chatId: v.string(),
        title: v.string(),
        userId: v.string(),
        email: v.string(),
        name: v.union(v.string(), v.null()),
        mode: v.union(v.string(), v.null()),
        createdAt: v.number(),
        updatedAt: v.number(),
      }),
    ),
  ),
  handler: async (ctx) => {
    if (!(await isAdminUser(ctx))) {
      return null;
    }
    const [users, chats] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("chats").collect(),
    ]);
    const userById = new Map<string, { email: string; name: string | null }>();
    for (const u of users) {
      userById.set(u._id as string, {
        email: (u as { email?: string }).email ?? "—",
        name: (u as { name?: string }).name ?? null,
      });
    }
    return chats
      .map((c) => {
        const u = userById.get(c.user_id);
        return {
          chatId: c.id,
          title: c.title && c.title.length > 0 ? c.title : "(untitled)",
          userId: c.user_id,
          email: u?.email ?? "—",
          name: u?.name ?? null,
          mode: c.default_model_slug ?? c.selected_model ?? null,
          createdAt: c._creationTime,
          updatedAt: c.update_time,
        };
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

/**
 * Full transcript of one chat (admin only) — every message in order. Bounded to
 * a single conversation via the by_chat_id index.
 */
export const getAdminChatMessages = query({
  args: { chatId: v.string() },
  returns: v.union(
    v.null(),
    v.array(
      v.object({
        id: v.string(),
        role: v.string(),
        text: v.string(),
        mode: v.union(v.string(), v.null()),
        createdAt: v.number(),
      }),
    ),
  ),
  handler: async (ctx, { chatId }) => {
    if (!(await isAdminUser(ctx))) {
      return null;
    }
    const msgs = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chat_id", chatId))
      .collect();
    return msgs
      .sort((a, b) => a._creationTime - b._creationTime)
      .map((m) => ({
        id: m.id,
        role: m.role,
        text: extractText(m).slice(0, 6000),
        mode: m.mode ?? null,
        createdAt: m._creationTime,
      }));
  },
});

/**
 * Admin: grant token credits (points) directly to a user's prepaid balance,
 * looked up by email. Service-key authed (run from a trusted backend or
 * `npx convex run`). This is a manual comp — it does NOT record a revenue event.
 */
export const grantTokensByEmail = mutation({
  args: {
    serviceKey: v.string(),
    email: v.string(),
    points: v.number(),
  },
  returns: v.object({
    ok: v.boolean(),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    newBalancePoints: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const target = args.email.trim().toLowerCase();
    const points = Math.max(0, Math.floor(args.points));
    if (points <= 0) return { ok: false, error: "points must be > 0" };

    // Find the user by email (case-insensitive). Full scan — fine at current
    // scale, matching the rest of this admin module.
    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => ((u as { email?: string }).email ?? "").toLowerCase() === target,
    );
    if (!user) return { ok: false, error: "No user with that email" };
    const userId = user._id as string;

    const settings = await ctx.db
      .query("extra_usage")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    const now = Date.now();
    let newBalancePoints: number;
    if (settings) {
      newBalancePoints = (settings.balance_points ?? 0) + points;
      await ctx.db.patch(settings._id, {
        balance_points: newBalancePoints,
        updated_at: now,
      });
    } else {
      newBalancePoints = points;
      await ctx.db.insert("extra_usage", {
        user_id: userId,
        balance_points: newBalancePoints,
        updated_at: now,
      });
    }

    return {
      ok: true,
      userId,
      email: (user as { email?: string }).email,
      newBalancePoints,
    };
  },
});

/**
 * Admin-grant a Pro/Max subscription to a user by email — for owner/operator
 * test accounts, not a real payment. Provisions the exact same state a real
 * LemonSqueezy webhook would (subscription row + monthly allowance points),
 * so the account exercises premium features identically to a paying user.
 * The synthetic `ls_subscription_id` (prefixed `admin_grant_`) makes these
 * rows easy to distinguish from real LemonSqueezy subscriptions later.
 */
export const grantSubscriptionByEmail = mutation({
  args: {
    serviceKey: v.string(),
    email: v.string(),
    tier: v.union(v.literal("pro"), v.literal("ultra")),
  },
  returns: v.object({
    ok: v.boolean(),
    userId: v.optional(v.string()),
    email: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const target = args.email.trim().toLowerCase();

    const users = await ctx.db.query("users").collect();
    const user = users.find(
      (u) => ((u as { email?: string }).email ?? "").toLowerCase() === target,
    );
    if (!user) return { ok: false, error: "No user with that email" };
    const userId = user._id as string;

    // Delegate to the same mutations the real LemonSqueezy webhook calls, so
    // an admin grant provisions identically to a real payment (subscription
    // row + monthly allowance) instead of duplicating that logic here.
    await ctx.runMutation(api.subscriptions.upsertSubscriptionFromWebhook, {
      serviceKey: args.serviceKey,
      userId,
      lsSubscriptionId: `admin_grant_${userId}`,
      tier: args.tier,
      status: "active",
    });
    await ctx.runMutation(api.extraUsage.grantMonthlyAllowance, {
      serviceKey: args.serviceKey,
      userId,
      allowancePoints: TIER_ALLOWANCE_POINTS[args.tier],
    });

    return { ok: true, userId, email: (user as { email?: string }).email };
  },
});
