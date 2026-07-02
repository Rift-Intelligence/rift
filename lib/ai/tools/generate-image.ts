import { tool } from "ai";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { ToolContext } from "@/types";

/**
 * Image generation tool.
 *
 * Reuses the existing OpenRouter key (no new provider/account): OpenRouter
 * routes to image-output models (default Google Gemini "Nano Banana"). The
 * generated image is streamed inline as a `file` part (data URL) so it renders
 * in the message without any storage round-trip. Cost is reported via
 * `onToolCost` so the standard retail margin applies.
 *
 * Safety: the prompt is screened with OpenAI moderation BEFORE generating;
 * serious categories (minors / non-consensual) hard-block with no charge.
 * RIFT's agent is intentionally no-refuse, so this gate is the line that keeps
 * anonymous/crypto accounts from generating illegal imagery.
 */

// google/gemini-3-pro-image — Google's pro image model. Chosen over the older
// 2.5-flash ("Nano Banana"), which users found looked too generic/"AI": 3-pro is
// a clear realism + prompt-adherence jump while staying on OpenRouter's
// chat/completions + modalities route (verified reachable). FLUX is NOT
// available for image output via this route, so it isn't an option here.
// Premium alternative: `openai/gpt-5-image` (slightly more realistic + higher
// res, but ~50% pricier and ~20s slower) — swap via the IMAGE_MODEL env var.
const IMAGE_MODEL = process.env.IMAGE_MODEL || "google/gemini-3-pro-image";
// Real per-image cost (the standard retail margin is applied downstream). Tuned
// to the chosen model: gemini-3-pro-image measured ≈ $0.136/image; rounded up
// slightly so prompt/output variance never under-bills.
const IMAGE_COST_USD = Number(process.env.IMAGE_COST_USD || "0.14");

// Categories we hard-block regardless of the no-refuse policy.
const BLOCKED_MODERATION_CATEGORIES = ["sexual/minors", "csae"] as const;

async function promptIsBlocked(prompt: string): Promise<boolean> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return false; // no moderation configured → rely on upstream safety
  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: prompt }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as {
      results?: Array<{ categories?: Record<string, boolean> }>;
    };
    const categories = data.results?.[0]?.categories ?? {};
    return BLOCKED_MODERATION_CATEGORIES.some((c) => categories[c] === true);
  } catch {
    return false;
  }
}

type OpenRouterImageResponse = {
  choices?: Array<{
    message?: {
      content?: string;
      images?: Array<{ image_url?: { url?: string }; type?: string }>;
    };
  }>;
  error?: { message?: string };
};

/** Pull a data: image URL out of an OpenRouter chat-completion response. */
function extractImageUrl(data: OpenRouterImageResponse): string | null {
  const msg = data.choices?.[0]?.message;
  const fromImages = msg?.images?.find((i) => i.image_url?.url)?.image_url?.url;
  if (fromImages) return fromImages;
  // Some models embed a data URL or markdown image in the text content.
  const content = msg?.content ?? "";
  const m = content.match(/data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/);
  return m ? m[0] : null;
}

export const createGenerateImage = (context: ToolContext) => {
  const { onToolCost } = context;
  // User-picked image model + cost (from the Image-mode picker), else defaults.
  const activeImageModel = context.imageModel || IMAGE_MODEL;
  const activeImageCost =
    typeof context.imageCost === "number" ? context.imageCost : IMAGE_COST_USD;

  return tool({
    description: `Generate an image from a text description and show it to the user inline.

<instructions>
- Use when the user asks to create / draw / generate / make an image, picture, logo, illustration, icon, mockup, or visual.
- Write a single rich, specific \`prompt\`: subject, style, composition, colors, lighting, mood. Expand a terse user request into a vivid description.
- One image per call. Do not call repeatedly unless the user asks for variations or changes.
- The image is rendered for the user automatically; in your reply, briefly describe what you made — do NOT paste base64 or URLs.
</instructions>`,
    inputSchema: z.object({
      prompt: z
        .string()
        .min(3)
        .describe(
          "A vivid, detailed description of the image to generate (subject, style, composition, colors, lighting).",
        ),
      brief: z
        .string()
        .describe(
          "A one-sentence preamble describing what is being generated.",
        ),
    }),
    execute: async (
      { prompt }: { prompt: string; brief: string },
      { abortSignal },
    ) => {
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return {
          ok: false as const,
          error: "Image generation isn't configured right now.",
        };
      }

      if (await promptIsBlocked(prompt)) {
        return {
          ok: false as const,
          error:
            "This request was blocked by the safety filter. Try a different description.",
        };
      }

      try {
        const res = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: activeImageModel,
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
              // The image is returned in a separate field, so a low text cap is
              // fine — and it keeps OpenRouter's credit pre-check from inflating
              // the max_tokens estimate (which otherwise 402s on tight budgets).
              max_tokens: 4096,
            }),
            signal: abortSignal,
          },
        );

        if (!res.ok) {
          const text = await res.text();
          console.error(
            "generate_image API error:",
            res.status,
            text.slice(0, 300),
          );
          const error =
            res.status === 402
              ? "Out of credits for image generation. Add credits and try again."
              : res.status === 429
                ? "Image generation is rate-limited right now. Try again in a moment."
                : `Image service error (${res.status}). Please try again.`;
          return { ok: false as const, error };
        }

        const data = (await res.json()) as OpenRouterImageResponse;
        const dataUrl = extractImageUrl(data);
        if (!dataUrl) {
          return {
            ok: false as const,
            error: `The image model returned no image${
              data.error?.message ? ` (${data.error.message})` : ""
            }. Try rephrasing the prompt.`,
          };
        }

        // Bill the generation (retail margin applied downstream).
        onToolCost?.(activeImageCost);

        const mediaType =
          dataUrl.match(/^data:(image\/[a-zA-Z+]+);/)?.[1] ?? "image/png";

        // Persist to Convex storage and stream that stable URL instead of the
        // raw data URL. A data URL is ~1.6MB and is dropped when the message is
        // saved, which makes the image "disappear" after the turn. The stored
        // URL is small + durable, so it survives save + reload.
        let imageUrl = dataUrl;
        const base64 = dataUrl.match(
          /^data:image\/[a-zA-Z+]+;base64,(.+)$/,
        )?.[1];
        const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (base64 && serviceKey && convexUrl) {
          try {
            const convex = new ConvexHttpClient(convexUrl);
            const stored = await convex.action(
              api.imageStorage.storeGeneratedImage,
              { serviceKey, base64, mediaType },
            );
            if (stored.url) imageUrl = stored.url;
          } catch (storeError) {
            console.error(
              "generate_image: storage upload failed, using inline data URL:",
              storeError,
            );
          }
        }

        // Return the image as the tool OUTPUT (not a transient UI part) so it is
        // saved with the tool call and survives reload. The frontend renders it
        // from this output (see MessagePartHandler `tool-generate_image`).
        return { ok: true as const, url: imageUrl, mediaType };
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return {
            ok: false as const,
            error: "Image generation was cancelled.",
          };
        }
        console.error("generate_image tool error:", error);
        return {
          ok: false as const,
          error: "Something went wrong generating the image. Please try again.",
        };
      }
    },
  });
};
