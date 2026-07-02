import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { validateServiceKey } from "./lib/utils";

/**
 * MCP (Model Context Protocol) server registry.
 *
 * Each row is one remote MCP endpoint a user has connected. At request time the
 * backend reads the user's *enabled* servers (via the service-key query below),
 * connects to each, and merges their tools into the agent tool set
 * (see lib/ai/mcp/*).
 *
 * SECURITY NOTES
 * - `headers` may contain secrets (bearer tokens). The user-facing queries
 *   NEVER return header values — they return only the header *keys* + a
 *   `hasAuth` flag so the UI can show "Authorization configured" without
 *   leaking the token. Only the service-key query returns full headers, and it
 *   is reachable solely from the trusted backend.
 * - All user-facing mutations/queries scope strictly by the authenticated
 *   user id; ownership is re-checked on every write.
 */

const MAX_SERVERS_PER_USER = 20;
const MAX_HEADERS = 16;

function authedUserId(subject: string): string {
  // Mirror the convention used across the Convex layer (see notes.ts): the
  // identity subject is "<userId>|<sessionId>".
  return subject.split("|")[0];
}

function normalizeUrl(raw: string): string {
  const url = new URL(raw.trim());
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new ConvexError({
      code: "INVALID_URL",
      message: "MCP server URL must be http(s).",
    });
  }
  return url.toString();
}

/**
 * List the calling user's MCP servers for the settings UI. Header *values* are
 * intentionally omitted; only the configured keys + a hasAuth flag are exposed.
 */
export const listForUser = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("mcp_servers"),
      name: v.string(),
      url: v.string(),
      transport: v.union(v.literal("http"), v.literal("sse")),
      enabled: v.boolean(),
      hasAuth: v.boolean(),
      headerKeys: v.array(v.string()),
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
      .query("mcp_servers")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .order("desc")
      .collect();

    return rows.map((row) => ({
      _id: row._id,
      name: row.name,
      url: row.url,
      transport: row.transport,
      enabled: row.enabled,
      hasAuth: (row.headers?.length ?? 0) > 0,
      headerKeys: (row.headers ?? []).map((h) => h.key),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  },
});

/**
 * Add a new MCP server for the calling user.
 */
export const addServer = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    transport: v.optional(v.union(v.literal("http"), v.literal("sse"))),
    headers: v.optional(
      v.array(v.object({ key: v.string(), value: v.string() })),
    ),
  },
  returns: v.object({
    success: v.boolean(),
    id: v.optional(v.id("mcp_servers")),
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
    if (!name) {
      return { success: false, error: "Name cannot be empty" };
    }

    let url: string;
    try {
      url = normalizeUrl(args.url);
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof ConvexError
            ? String((error.data as { message?: string })?.message ?? error)
            : "Invalid URL",
      };
    }

    const headers = (args.headers ?? [])
      .map((h) => ({ key: h.key.trim(), value: h.value }))
      .filter((h) => h.key.length > 0);
    if (headers.length > MAX_HEADERS) {
      return { success: false, error: "Too many headers" };
    }

    const existing = await ctx.db
      .query("mcp_servers")
      .withIndex("by_user", (q) => q.eq("user_id", userId))
      .collect();
    if (existing.length >= MAX_SERVERS_PER_USER) {
      return {
        success: false,
        error: `You can connect at most ${MAX_SERVERS_PER_USER} MCP servers.`,
      };
    }

    const now = Date.now();
    const id = await ctx.db.insert("mcp_servers", {
      user_id: userId,
      name,
      url,
      transport: args.transport ?? "http",
      headers: headers.length > 0 ? headers : undefined,
      enabled: true,
      created_at: now,
      updated_at: now,
    });

    return { success: true, id };
  },
});

/**
 * Enable / disable a server without deleting it.
 */
export const setServerEnabled = mutation({
  args: {
    id: v.id("mcp_servers"),
    enabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
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

    const row = await ctx.db.get(args.id);
    if (!row) {
      return { success: false, error: "Server not found" };
    }
    if (row.user_id !== userId) {
      throw new ConvexError({
        code: "ACCESS_DENIED",
        message: "Access denied: You don't own this server",
      });
    }

    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      updated_at: Date.now(),
    });
    return { success: true };
  },
});

/**
 * Remove a server.
 */
export const removeServer = mutation({
  args: {
    id: v.id("mcp_servers"),
  },
  returns: v.object({
    success: v.boolean(),
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

    const row = await ctx.db.get(args.id);
    if (!row) {
      return { success: true }; // Idempotent.
    }
    if (row.user_id !== userId) {
      throw new ConvexError({
        code: "ACCESS_DENIED",
        message: "Access denied: You don't own this server",
      });
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

/**
 * Backend-only: return the user's *enabled* servers, including full auth
 * headers, so the agent runtime can connect to them. Guarded by the service
 * role key — never call this from the client.
 */
export const listEnabledForBackend = query({
  args: {
    serviceKey: v.string(),
    userId: v.string(),
  },
  returns: v.array(
    v.object({
      _id: v.id("mcp_servers"),
      name: v.string(),
      url: v.string(),
      transport: v.union(v.literal("http"), v.literal("sse")),
      headers: v.optional(
        v.array(v.object({ key: v.string(), value: v.string() })),
      ),
    }),
  ),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);

    const rows = await ctx.db
      .query("mcp_servers")
      .withIndex("by_user", (q) => q.eq("user_id", args.userId))
      .collect();

    return rows
      .filter((row) => row.enabled)
      .map((row) => ({
        _id: row._id,
        name: row.name,
        url: row.url,
        transport: row.transport,
        headers: row.headers,
      }));
  },
});
