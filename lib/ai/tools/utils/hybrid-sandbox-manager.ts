import { Sandbox } from "@e2b/code-interpreter";
import type {
  SandboxBootInfo,
  SandboxManager,
  SandboxType,
  SubscriptionTier,
} from "@/types";
import { ensureSandboxConnection, SANDBOX_KEEPALIVE_MS } from "./sandbox";
import { SANDBOX_ENVIRONMENT_TOOLS } from "./sandbox-tools";

// "e2b" only — local/Centrifugo sandbox is no longer supported.
// Kept as a union type for TypeScript compatibility with callers that may
// still pass "desktop" or a connectionId; all values are treated as "e2b".
export type SandboxPreference = "e2b" | "desktop" | (string & {});

export interface SandboxFallbackInfo {
  occurred: boolean;
  reason?: "connection_unavailable" | "no_local_connections";
  requestedPreference: SandboxPreference;
  actualSandbox: "e2b" | string;
  actualSandboxName?: string;
}

// Kept for tests that import it. Always reports every connection as stale
// (empty online set) since Centrifugo is no longer in use.
export const LOCAL_SANDBOX_PRESENCE_GRACE_MS = 30_000;

interface PresenceFilterResult {
  availableConnections: never[];
  staleConnections: never[];
}

export function filterConnectionsByPresence(
  _connections: unknown[],
  _onlineConnectionIds: Set<string>,
  _now?: number,
): PresenceFilterResult {
  return { availableConnections: [], staleConnections: [] };
}

const MAX_SANDBOX_HEALTH_FAILURES = 5;

export class HybridSandboxManager implements SandboxManager {
  private sandbox: Sandbox | null = null;
  // De-dups concurrent E2B boots so only ONE sandbox is ever created per cold
  // start, regardless of how many concurrent callers hit getSandbox().
  private e2bCreationPromise: Promise<{ sandbox: Sandbox }> | null = null;
  private healthFailureCount = 0;
  private sandboxUnavailable = false;

  constructor(
    private userID: string,
    private setSandboxCallback: (sandbox: Sandbox) => void,
    // sandboxPreference is accepted for API compat but always treated as "e2b".
    _sandboxPreference: SandboxPreference = "e2b",
    private serviceKey: string,
    initialSandbox?: Sandbox | null,
    private subscription?: SubscriptionTier,
    private onBoot?: (info: SandboxBootInfo) => void,
  ) {
    this.sandbox = initialSandbox || null;
  }

  recordHealthFailure(): boolean {
    this.healthFailureCount++;
    if (this.healthFailureCount >= MAX_SANDBOX_HEALTH_FAILURES) {
      this.sandboxUnavailable = true;
    }
    return this.sandboxUnavailable;
  }

  resetHealthFailures(): void {
    this.healthFailureCount = 0;
    this.sandboxUnavailable = false;
  }

  isSandboxUnavailable(): boolean {
    return this.sandboxUnavailable;
  }

  isE2BSandboxBooted(): boolean {
    return !!this.sandbox && this.sandbox instanceof Sandbox;
  }

  getEffectivePreference(): SandboxPreference {
    return "e2b";
  }

  getOsContext(): string | null {
    return null;
  }

  setSandboxPreference(_preference: SandboxPreference): Promise<void> {
    return Promise.resolve();
  }

  consumeFallbackInfo(): SandboxFallbackInfo | null {
    return null;
  }

  getSandboxInfo(): { type: SandboxType; name?: string } | null {
    return { type: "e2b" };
  }

  getSandboxType(toolName: string): SandboxType | undefined {
    if (!(SANDBOX_ENVIRONMENT_TOOLS as readonly string[]).includes(toolName)) {
      return undefined;
    }
    return "e2b";
  }

  supportsInteractivePty(): Promise<boolean> {
    return Promise.resolve(true);
  }

  async getSandbox(): Promise<{ sandbox: Sandbox }> {
    return this.getE2BSandbox();
  }

  private async getE2BSandbox(): Promise<{ sandbox: Sandbox }> {
    if (this.sandbox && this.sandbox instanceof Sandbox) {
      // Keep-alive: push the auto-pause timeout out on every access so a live
      // sandbox never pauses mid-run. Fire-and-forget.
      void this.sandbox.setTimeout(SANDBOX_KEEPALIVE_MS).catch(() => {});
      return { sandbox: this.sandbox };
    }

    // Share an in-flight boot across concurrent callers.
    if (this.e2bCreationPromise) {
      return this.e2bCreationPromise;
    }

    const creation = (async () => {
      const result = await ensureSandboxConnection(
        {
          userID: this.userID,
          setSandbox: (sandbox) => {
            this.sandbox = sandbox;
            this.setSandboxCallback(sandbox);
          },
          onBoot: this.onBoot,
        },
        {
          initialSandbox: this.sandbox as Sandbox | null,
        },
      );

      this.sandbox = result.sandbox;
      this.setSandboxCallback(result.sandbox);

      return { sandbox: result.sandbox };
    })();

    this.e2bCreationPromise = creation;
    try {
      return await creation;
    } finally {
      this.e2bCreationPromise = null;
    }
  }

  setSandbox(sandbox: Sandbox): void {
    this.sandbox = sandbox;
    this.setSandboxCallback(sandbox);
  }

  async getSandboxContextForPrompt(): Promise<string | null> {
    return null;
  }
}
