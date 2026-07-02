import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { validateServiceKey } from "./lib/utils";

/**
 * Skills registry — loadable instruction packs. Enabled skills are injected
 * into the agent as a <system-reminder> for matching-scope chats
 * (see lib/ai/skills/inject-skills.ts).
 */

const MAX_SKILLS_PER_USER = 60;
const MAX_INSTRUCTIONS_CHARS = 8000;

const scopeValidator = v.union(
  v.literal("all"),
  v.literal("security"),
  v.literal("app"),
  v.literal("image"),
);

function authedUserId(subject: string): string {
  return subject.split("|")[0];
}

/** List the calling user's skills for the settings/marketplace UI. */
export const listForUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("skills"),
      name: v.string(),
      description: v.string(),
      instructions: v.string(),
      scope: scopeValidator,
      catalog_id: v.optional(v.string()),
      enabled: v.boolean(),
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
      .query("skills")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc")
      .collect();

    return rows.map((r) => ({
      _id: r._id,
      name: r.name,
      description: r.description,
      instructions: r.instructions,
      scope: r.scope,
      catalog_id: r.catalog_id,
      enabled: r.enabled,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  },
});

/** Install a skill from the curated catalog (copies its instructions in). */
export const installFromCatalog = mutation({
  args: {
    catalogId: v.string(),
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    scope: scopeValidator,
  },
  returns: v.object({
    success: v.boolean(),
    id: v.optional(v.id("skills")),
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

    // Idempotent: if this catalog skill is already installed, just return it.
    const dupe = await ctx.db
      .query("skills")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    const already = dupe.find((r) => r.catalog_id === args.catalogId);
    if (already) return { success: true, id: already._id };

    if (dupe.length >= MAX_SKILLS_PER_USER) {
      return { success: false, error: "Skill limit reached" };
    }

    const now = Date.now();
    const id = await ctx.db.insert("skills", {
      user_id: userId,
      name: args.name.trim(),
      description: args.description.trim(),
      instructions: args.instructions.slice(0, MAX_INSTRUCTIONS_CHARS),
      scope: args.scope,
      catalog_id: args.catalogId,
      enabled: true,
      created_at: now,
      updated_at: now,
    });
    return { success: true, id };
  },
});

/** Create a user-authored custom skill. */
export const createCustom = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    instructions: v.string(),
    scope: scopeValidator,
  },
  returns: v.object({
    success: v.boolean(),
    id: v.optional(v.id("skills")),
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
    const instructions = args.instructions.trim();
    if (!name) return { success: false, error: "Name cannot be empty" };
    if (!instructions)
      return { success: false, error: "Instructions cannot be empty" };

    const existing = await ctx.db
      .query("skills")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    if (existing.length >= MAX_SKILLS_PER_USER) {
      return { success: false, error: "Skill limit reached" };
    }

    const now = Date.now();
    const id = await ctx.db.insert("skills", {
      user_id: userId,
      name,
      description: args.description.trim() || name,
      instructions: instructions.slice(0, MAX_INSTRUCTIONS_CHARS),
      scope: args.scope,
      catalog_id: undefined,
      enabled: true,
      created_at: now,
      updated_at: now,
    });
    return { success: true, id };
  },
});

export const setSkillEnabled = mutation({
  args: { id: v.id("skills"), enabled: v.boolean() },
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
    if (!row) return { success: false, error: "Skill not found" };
    if (row.user_id !== userId) {
      throw new ConvexError({
        code: "ACCESS_DENIED",
        message: "Access denied: You don't own this skill",
      });
    }
    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

export const removeSkill = mutation({
  args: { id: v.id("skills") },
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
        message: "Access denied: You don't own this skill",
      });
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Backend-only: the user's enabled skills, for the agent runtime to inject.
 * Guarded by the service role key.
 */
export const listEnabledForBackend = query({
  args: { serviceKey: v.string(), userId: v.string() },
  returns: v.array(
    v.object({
      name: v.string(),
      instructions: v.string(),
      scope: scopeValidator,
    }),
  ),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const rows = await ctx.db
      .query("skills")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();
    return rows
      .filter((r) => r.enabled)
      .map((r) => ({
        name: r.name,
        instructions: r.instructions,
        scope: r.scope,
      }));
  },
});
