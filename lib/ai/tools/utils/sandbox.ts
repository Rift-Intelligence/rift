import { Sandbox } from "@e2b/code-interpreter";
import type { SandboxBootInfo, SandboxContext } from "@/types";
import { NotFoundError, getUserFacingE2BErrorMessage } from "./e2b-errors";
import { reclaimSandboxDisk } from "./sandbox-disk-reclaim";

type SandboxReadyPath = SandboxBootInfo["path"];

const SANDBOX_TEMPLATE = process.env.E2B_TEMPLATE || "terminal-agent-sandbox";
const BASH_SANDBOX_RESUME_TIMEOUT = 5 * 60 * 1000; // 5 minutes for resuming paused sandbox
// E2B's `timeoutMs` is absolute from creation and is NOT auto-extended by
// running commands — so a long agent run on a single sandbox would auto-pause
// mid-run, after which the next command's health check sees `isRunning()` false
// ("Sandbox is not running") and falls into a kill+recreate loop. (This was
// masked before by the disk death-loop, which kept minting fresh sandboxes and
// resetting the clock; fixing the disk exposed it.) The hybrid sandbox manager
// now refreshes this timeout on every getSandbox() call (see SANDBOX_KEEPALIVE_MS),
// so 20 min is the keep-alive window: commands within 20 min of each other keep
// the box alive, and an idle box pauses ~20 min after the last command.
export const SANDBOX_KEEPALIVE_MS = 2 * 60 * 60 * 1000; // 2 hours
const BASH_SANDBOX_AUTOPAUSE_TIMEOUT = SANDBOX_KEEPALIVE_MS;
// Retry config for E2B 429 rate limits
const RATE_LIMIT_COOLDOWN_MS = 1_000;
const MAX_CREATE_RETRIES = 3;

/**
 * Current sandbox version identifier.
 * Used to track sandbox compatibility and trigger automatic migration when Docker templates are updated.
 * Increment this version when making breaking changes to sandbox configuration or dependencies.
 * Old sandboxes without this version (or with mismatched versions) will be automatically deleted
 * and recreated on next connection attempt.
 */
// v8: upgraded sandbox CPU (4 cores) and memory (2GB)
// v9: added Caido proxy (caido-cli install, lazy start via ensureCaido, HTTP_PROXY env vars)
// v10: E2B Pro plan → template rebuilt with 20 GiB disk (was 10 GiB, born 100% full).
//      Bumping the version force-recreates users' old 10 GiB sandboxes so everyone
//      gets the ~9.8 GB of free disk that fixes the out-of-space death loop.
const SANDBOX_VERSION = "v10";

/**
 * Ensures a sandbox connection is established and maintained
 * Reuses existing sandboxes when possible to maintain state and improve performance
 *
 * @param context - Sandbox context containing user ID and state management
 * @param options - Configuration options for sandbox connection
 * @returns Connected sandbox instance
 *
 * Flow:
 * 1. Returns existing sandbox if already initialized
 * 2. Lists existing sandboxes for the user
 * 3. Validates sandbox version metadata (auto-kills old versions)
 * 4. If found: connect to existing sandbox (works for both running and paused states)
 * 5. If not found or connection fails: creates new sandbox with auto-pause enabled
 * 6. Auto-pause automatically pauses sandbox after inactivity timeout (15 minutes)
 * 7. Returns active sandbox ready for use
 */
export const ensureSandboxConnection = async (
  context: SandboxContext,
  options: {
    initialSandbox?: Sandbox | null;
  } = {},
): Promise<{ sandbox: Sandbox }> => {
  const { userID, setSandbox, onBoot } = context;
  const { initialSandbox } = options;

  // Return existing sandbox if already connected
  if (initialSandbox) {
    return { sandbox: initialSandbox };
  }
  const startedAt = performance.now();
  let createPath: SandboxReadyPath = "create_fresh";
  const reportBoot = (path: SandboxReadyPath, attempts: number): void => {
    onBoot?.({
      path,
      duration_ms: Math.round(performance.now() - startedAt),
      create_attempts: attempts,
    });
  };
  try {
    // Step 1: Look for existing sandbox for this user
    const paginator = Sandbox.list({
      query: {
        metadata: {
          userID,
          template: SANDBOX_TEMPLATE,
        },
      },
    });
    const existingSandbox = (await paginator.nextItems())[0];

    // Step 2: Always check version and auto-kill old sandboxes
    if (
      existingSandbox &&
      existingSandbox.metadata?.sandboxVersion !== SANDBOX_VERSION
    ) {
      console.log(
        `[${userID}] Sandbox version mismatch (expected ${SANDBOX_VERSION}), deleting old sandbox`,
      );
      try {
        await Sandbox.kill(existingSandbox.sandboxId);
      } catch (killError) {
        console.warn(`[${userID}] Failed to kill old sandbox:`, killError);
      }
      createPath = "create_after_version_mismatch";
      // Skip to creating new sandbox
    } else if (existingSandbox?.sandboxId) {
      // Step 3: Try to reuse existing sandbox (works for both running and paused states)
      // With auto-pause, we don't need to manually pause before resuming
      // Sandbox.connect() handles both running and paused sandboxes automatically
      try {
        const sandbox = await Sandbox.connect(existingSandbox.sandboxId, {
          timeoutMs: BASH_SANDBOX_RESUME_TIMEOUT,
        });
        setSandbox(sandbox);
        reportBoot("reuse_existing", 0);
        return { sandbox };
      } catch (e) {
        // Handle specific error cases
        if (
          e instanceof NotFoundError ||
          (e instanceof Error && e.message?.includes("not found"))
        ) {
          console.error(
            `[${userID}] Sandbox ${existingSandbox.sandboxId} expired/deleted, creating new one`,
          );
          createPath = "create_after_expired";
          // Clean up expired sandbox reference
          try {
            await Sandbox.kill(existingSandbox.sandboxId);
          } catch (killError) {
            console.warn(
              `[${userID}] Failed to clean up expired sandbox:`,
              killError,
            );
          }
        } else {
          console.error(
            `[${userID}] Unexpected error resuming sandbox ${existingSandbox.sandboxId}:`,
            e,
          );
          createPath = "create_after_broken";
          // Kill the broken sandbox so Sandbox.list() doesn't keep finding it
          try {
            await Sandbox.kill(existingSandbox.sandboxId);
          } catch (killError) {
            console.warn(
              `[${userID}] Failed to clean up broken sandbox:`,
              killError,
            );
          }
        }
      }
    }

    // Step 5: Create new sandbox with retry on E2B 429 rate limits
    let lastError: unknown;
    for (let attempt = 0; attempt < MAX_CREATE_RETRIES; attempt++) {
      if (attempt > 0) {
        console.warn(
          `[${userID}] E2B rate limit — retrying sandbox creation (${attempt + 1}/${MAX_CREATE_RETRIES}) after ${RATE_LIMIT_COOLDOWN_MS}ms`,
        );
        await new Promise((r) => setTimeout(r, RATE_LIMIT_COOLDOWN_MS));
      }

      try {
        const sandbox = await Sandbox.create(SANDBOX_TEMPLATE, {
          timeoutMs: BASH_SANDBOX_AUTOPAUSE_TIMEOUT,
          lifecycle: { onTimeout: "pause" },
          secure: true,
          metadata: {
            userID,
            template: SANDBOX_TEMPLATE,
            secure: "true",
            sandboxVersion: SANDBOX_VERSION,
          },
        });

        // A fresh sandbox is born at ~100% disk (the image fills its auto-sized
        // rootfs). Kick off a best-effort reclaim of non-functional space, but
        // do NOT await it: on E2B's overlay filesystem, deleting image-layer
        // files frees space only unreliably/asynchronously (sometimes ~1.2 GB,
        // sometimes nothing for tens of seconds), and awaiting it would add
        // ~35 s to every cold start for an uncertain payoff. Fire-and-forget
        // keeps the boot fast; the kill+recreate cap in run_terminal_cmd makes
        // the no-space case fail fast and clearly. The durable fix is a larger
        // template disk from E2B (see sandbox-disk-reclaim.ts).
        void reclaimSandboxDisk(sandbox);

        setSandbox(sandbox);
        reportBoot(createPath, attempt + 1);
        return { sandbox };
      } catch (createError) {
        lastError = createError;
        const isRateLimit =
          createError instanceof Error &&
          (createError.message?.includes("429") ||
            createError.message?.includes("Rate limit"));
        if (!isRateLimit) throw createError;
      }
    }
    throw lastError;
  } catch (error) {
    console.error("Error creating persistent sandbox:", error);

    // Surface specific error messages for known E2B errors
    const userMessage = getUserFacingE2BErrorMessage(error);
    if (userMessage) {
      throw new Error(userMessage);
    }

    throw new Error(
      `Failed creating persistent sandbox: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
