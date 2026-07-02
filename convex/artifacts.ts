import { query } from "./_generated/server";
import { v, ConvexError } from "convex/values";

/**
 * Artifacts — every image the user has sent or received, gathered retroactively
 * from their messages. Generated images live in `tool-generate_image` tool
 * outputs; uploaded images live in `file` parts. Both carry a stable URL already
 * (Convex storage / signed / data), so no extra resolution is needed here.
 */

// Cap how many recent messages we scan so the gallery query stays cheap.
const MAX_MESSAGES_SCANNED = 800;

function authedUserId(subject: string): string {
  return subject.split("|")[0];
}

export const listForUser = query({
  args: {},
  returns: v.array(
    v.object({
      url: v.string(),
      mediaType: v.string(),
      kind: v.union(v.literal("generated"), v.literal("uploaded")),
      chat_id: v.string(),
      time: v.number(),
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

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .order("desc")
      .take(MAX_MESSAGES_SCANNED);

    const seen = new Set<string>();
    const out: Array<{
      url: string;
      mediaType: string;
      kind: "generated" | "uploaded";
      chat_id: string;
      time: number;
    }> = [];

    for (const m of messages) {
      const parts = Array.isArray(m.parts) ? m.parts : [];
      for (const rawPart of parts) {
        const part = rawPart as Record<string, unknown> | null;
        if (!part || typeof part !== "object") continue;

        // Generated image — tool output.
        if (part.type === "tool-generate_image") {
          const output = part.output as
            | { url?: unknown; mediaType?: unknown }
            | undefined;
          const url = output?.url;
          if (typeof url === "string" && url && !seen.has(url)) {
            seen.add(url);
            out.push({
              url,
              mediaType:
                typeof output?.mediaType === "string"
                  ? output.mediaType
                  : "image/png",
              kind: "generated",
              chat_id: m.chat_id,
              time: m.update_time,
            });
          }
          continue;
        }

        // Uploaded image — file part.
        if (part.type === "file") {
          const mt =
            (typeof part.mediaType === "string" && part.mediaType) ||
            (typeof part.mimeType === "string" && part.mimeType) ||
            "";
          const url = part.url;
          if (
            typeof url === "string" &&
            url &&
            mt.startsWith("image/") &&
            !seen.has(url)
          ) {
            seen.add(url);
            out.push({
              url,
              mediaType: mt,
              kind: "uploaded",
              chat_id: m.chat_id,
              time: m.update_time,
            });
          }
        }
      }
    }

    return out;
  },
});
