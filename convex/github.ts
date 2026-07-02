import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { validateServiceKey } from "./lib/utils";

/**
 * Connected GitHub account. The PAT is injected into the sandbox git credentials
 * so the Build agent and the Terminal can clone/push repos. The token is NEVER
 * returned to the client — only `getStatus` (connected + username) is.
 */

function authedUserId(subject: string): string {
  return subject.split("|")[0];
}

/** Connection status for the UI (no token). */
export const getStatus = query({
  args: {},
  returns: v.object({
    connected: v.boolean(),
    username: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { connected: false };
    const userId = authedUserId(identity.subject);
    const row = await ctx.db
      .query("github_connections")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();
    return row
      ? { connected: true, username: row.username }
      : { connected: false };
  },
});

export const connect = mutation({
  args: { token: v.string(), username: v.optional(v.string()) },
  returns: v.object({ success: v.boolean(), error: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Unauthorized: User not authenticated",
      });
    }
    const userId = authedUserId(identity.subject);
    const token = args.token.trim();
    if (!token) return { success: false, error: "Token cannot be empty" };

    const existing = await ctx.db
      .query("github_connections")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        token,
        username: args.username,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("github_connections", {
        user_id: userId,
        token,
        username: args.username,
        created_at: now,
        updated_at: now,
      });
    }
    return { success: true };
  },
});

export const disconnect = mutation({
  args: {},
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Unauthorized: User not authenticated",
      });
    }
    const userId = authedUserId(identity.subject);
    const row = await ctx.db
      .query("github_connections")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .first();
    if (row) await ctx.db.delete(row._id);
    return { success: true };
  },
});

/**
 * Backend-only: store a token for an explicit userId. Used by the OAuth
 * callback route, which runs server-side after exchanging the GitHub `code`
 * for an access token. Service-key guarded (the caller is trusted, not the
 * end user's Convex identity).
 */
export const connectForBackend = mutation({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
    token: v.string(),
    username: v.optional(v.string()),
  },
  returns: v.object({ success: v.boolean() }),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const token = args.token.trim();
    if (!token) return { success: false };
    const existing = await ctx.db
      .query("github_connections")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        token,
        username: args.username,
        updated_at: now,
      });
    } else {
      await ctx.db.insert("github_connections", {
        user_id: args.userId,
        token,
        username: args.username,
        created_at: now,
        updated_at: now,
      });
    }
    return { success: true };
  },
});

/** Backend-only: full token for sandbox git injection. Service-key guarded. */
export const getTokenForBackend = query({
  args: { serviceKey: v.string(), userId: v.string() },
  returns: v.union(
    v.object({ token: v.string(), username: v.optional(v.string()) }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const row = await ctx.db
      .query("github_connections")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .first();
    return row ? { token: row.token, username: row.username } : null;
  },
});
