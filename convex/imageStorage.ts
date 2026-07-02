import { action } from "./_generated/server";
import { v } from "convex/values";
import { validateServiceKey } from "./lib/utils";

/**
 * Persist a generated image (base64) to Convex file storage and return a stable
 * URL. Used by the generate_image tool: a raw data URL is ~1.6MB and is too
 * large to keep inline in a saved message (it gets dropped, so the image
 * "disappears" after the turn). Storing it yields a small, durable URL that
 * survives message save + reload. Service-key authed (called from the backend).
 */
export const storeGeneratedImage = action({
  args: {
    serviceKey: v.string(),
    base64: v.string(),
    mediaType: v.string(),
  },
  returns: v.object({ url: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    validateServiceKey(args.serviceKey);
    const binary = atob(args.base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: args.mediaType || "image/png" });
    const storageId = await ctx.storage.store(blob);
    const url = await ctx.storage.getUrl(storageId);
    return { url };
  },
});
