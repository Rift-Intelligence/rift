import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/db/convex-client";
import { appendSystemReminderToLastUserMessage } from "@/lib/api/chat-stream-helpers";
import type { ChatPurpose } from "@/types/chat";

/**
 * Skills injection. Enabled skills are pulled from Convex and appended to the
 * last user message as a <system-reminder> — the same cache-friendly mechanism
 * notes use (keeps the static system prompt stable for prompt caching).
 *
 * Additive & non-fatal: any failure degrades to "no skills", never an error.
 */

type SkillScope = "all" | "security" | "app" | "image";

export interface EnabledSkill {
  name: string;
  instructions: string;
  scope: SkillScope;
}

type Messages = Parameters<typeof appendSystemReminderToLastUserMessage>[0];

/** Read the user's enabled skills (service-key query). Never throws. */
export async function loadEnabledSkills(
  userId: string,
): Promise<EnabledSkill[]> {
  if (process.env.SKILLS_DISABLED === "true") return [];
  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!serviceKey) return [];
  try {
    return await getConvexClient().query(api.skills.listEnabledForBackend, {
      serviceKey,
      userId,
    });
  } catch (error) {
    console.warn(
      "[skills] Failed to load enabled skills:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

function scopeMatches(scope: SkillScope, purpose: ChatPurpose): boolean {
  return scope === "all" || scope === purpose;
}

/** Build the <active_skills> reminder for the skills applicable to `purpose`. */
export function buildSkillsReminder(
  skills: EnabledSkill[],
  purpose: ChatPurpose,
): string {
  const applicable = skills.filter((s) => scopeMatches(s.scope, purpose));
  if (applicable.length === 0) return "";
  const body = applicable
    .map((s) => `## Skill: ${s.name}\n${s.instructions.trim()}`)
    .join("\n\n");
  return `<active_skills>\nThe user has enabled the following skills. Apply their guidance whenever it is relevant to the current task. If a skill does not apply to the request at hand, ignore it.\n\n${body}\n</active_skills>`;
}

/**
 * Fetch the user's enabled skills and inject the ones matching `purpose` into
 * the messages. Returns the (possibly updated) messages.
 */
export async function injectSkillsIntoMessages(
  messages: Messages,
  opts: { userId: string; purpose: ChatPurpose },
): Promise<Messages> {
  const skills = await loadEnabledSkills(opts.userId);
  const reminder = buildSkillsReminder(skills, opts.purpose);
  if (!reminder) return messages;
  return appendSystemReminderToLastUserMessage(messages, reminder);
}
