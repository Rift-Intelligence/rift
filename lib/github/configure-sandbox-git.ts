import type { AnySandbox } from "@/types";
import { asCommonSandbox } from "@/lib/ai/tools/utils/sandbox-types";

/**
 * Wire the user's GitHub token into a sandbox's git credentials so `git clone`
 * / `git push` on private repos just work (via the credential store). The token
 * is passed as an env var — never interpolated into the shell — so it can't be
 * shell-injected. Best-effort: callers should not treat a failure as fatal.
 */
export async function configureSandboxGit(
  sandbox: AnySandbox,
  token: string,
  username?: string,
): Promise<void> {
  const sb = asCommonSandbox(sandbox);
  const safeUser = (username || "").replace(/[^a-zA-Z0-9-_. ]/g, "");
  const cmd =
    `git config --global credential.helper store; ` +
    `printf 'https://x-access-token:%s@github.com\\n' "$GH_TOKEN" > "$HOME/.git-credentials"; ` +
    `chmod 600 "$HOME/.git-credentials"` +
    (safeUser ? `; git config --global user.name "${safeUser}"` : "");
  await sb.commands.run(cmd, {
    envVars: { GH_TOKEN: token },
    timeoutMs: 15_000,
  });
}
