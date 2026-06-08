import * as dotenv from "dotenv";
import * as path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";

function loadEnv(): void {
  dotenv.config({ path: path.join(process.cwd(), ".env.e2e") });
  dotenv.config({ path: path.join(process.cwd(), ".env.local") });
}

function getConvexEnv(): { convexUrl: string; serviceKey: string } | null {
  loadEnv();
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!convexUrl || !serviceKey) return null;
  return { convexUrl, serviceKey };
}

/**
 * Previously resolved the pro test user's id from WorkOS. Auth now runs on
 * Convex Auth; this returns null until the e2e suite is reworked to seed/resolve
 * users via Convex.
 */
export async function getProUserId(): Promise<string | null> {
  return null;
}

/**
 * Delete all chats for the pro test user.
 * Used for test cleanup/teardown.
 */
export async function deleteTestUserChats(): Promise<void> {
  const env = getConvexEnv();
  if (!env) return;
  try {
    const userId = await getProUserId();
    if (!userId) return;
    const convex = new ConvexHttpClient(env.convexUrl);
    await convex.mutation(api.chats.deleteAllChatsForUser, {
      serviceKey: env.serviceKey,
      userId,
    });
  } catch {
    // Teardown is best-effort; do not fail the run
  }
}

/**
 * Create multiple chats for the pro test user via Convex API.
 * Use for tests that need more than one page of sidebar chats (e.g. pagination).
 */
export async function createManyTestChatsForProUser(
  count: number,
): Promise<void> {
  const env = getConvexEnv();
  if (!env) return;
  const userId = await getProUserId();
  if (!userId) return;
  const convex = new ConvexHttpClient(env.convexUrl);
  const { randomUUID } = await import("crypto");
  for (let i = 0; i < count; i++) {
    await convex.mutation(api.chats.saveChat, {
      serviceKey: env.serviceKey,
      id: randomUUID(),
      userId,
      title: `Pagination test chat ${i} ${Date.now()}`,
    });
  }
}
