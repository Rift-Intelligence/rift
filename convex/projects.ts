import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * User projects — named workspaces of a chosen type (Security / Build / Image).
 */

const MAX_PROJECTS_PER_USER = 100;

const typeValidator = v.union(
  v.literal("security"),
  v.literal("app"),
  v.literal("image"),
);

function authedUserId(subject: string): string {
  return subject.split("|")[0];
}

export const listForUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("projects"),
      name: v.string(),
      type: typeValidator,
      created_at: v.number(),
      updated_at: v.number(),
    }),
  ),
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Unauthorized: User not authenticated",
      });
    }
    const userId = authedUserId(identity.subject);
    const rows = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc")
      .collect();
    return rows.map((r) => ({
      _id: r._id,
      name: r.name,
      type: r.type,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },
});

export const createProject = mutation({
  args: { name: v.string(), type: typeValidator },
  returns: v.object({
    success: v.boolean(),
    id: v.optional(v.id("projects")),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Unauthorized: User not authenticated",
      });
    }
    const userId = authedUserId(identity.subject);
    const name = args.name.trim();
    if (!name) return { success: false, error: "Name cannot be empty" };

    const existing = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    if (existing.length >= MAX_PROJECTS_PER_USER) {
      return { success: false, error: "Project limit reached" };
    }

    const now = Date.now();
    const id = await ctx.db.insert("projects", {
      user_id: userId,
      name,
      type: args.type,
      created_at: now,
      updated_at: now,
    });
    return { success: true, id };
  },
});

export const renameProject = mutation({
  args: { id: v.id("projects"), name: v.string() },
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
    const row = await ctx.db.get(args.id);
    if (!row) return { success: false, error: "Project not found" };
    if (row.user_id !== userId) {
      throw new ConvexError({
        code: "ACCESS_DENIED",
        message: "Access denied: You don't own this project",
      });
    }
    const name = args.name.trim();
    if (!name) return { success: false, error: "Name cannot be empty" };
    await ctx.db.patch(args.id, { name, updated_at: Date.now() });
    return { success: true };
  },
});

export const removeProject = mutation({
  args: { id: v.id("projects") },
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
    const row = await ctx.db.get(args.id);
    if (!row) return { success: true };
    if (row.user_id !== userId) {
      throw new ConvexError({
        code: "ACCESS_DENIED",
        message: "Access denied: You don't own this project",
      });
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
