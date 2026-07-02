import { DefaultSandboxManager } from "./utils/sandbox-manager";
import {
  HybridSandboxManager,
  type SandboxPreference,
} from "./utils/hybrid-sandbox-manager";
import { TodoManager } from "./utils/todo-manager";
import { createRunTerminalCmd } from "./run-terminal-cmd";
import { createInteractTerminalSession } from "./interact-terminal-session";
import { createGetTerminalFiles } from "./get-terminal-files";
import { createFile } from "./file";
import { createWebSearch } from "./web-search";
import { createOpenUrlTool } from "./open-url";
import { createGenerateImage } from "./generate-image";
import { createExposePreview } from "./expose-preview";
import { createTodoWrite } from "./todo-write";
// Caido proxy temporarily disabled for all users — see lib/api/chat-handler.ts kill switch.
// import { createProxyTools } from "./proxy-tool";
import {
  createCreateNote,
  createListNotes,
  createUpdateNote,
  createDeleteNote,
} from "./notes";
// match tool removed — usage analytics showed it wasn't being used enough to justify
// the added complexity. The agent should use run_terminal_cmd with rg instead.
// import { createMatch } from "./match";
import type { ToolSet, UIMessageStreamWriter } from "ai";
import type {
  ChatMode,
  ToolContext,
  Todo,
  AnySandbox,
  AppendMetadataStreamFn,
  SubscriptionTier,
  SandboxBootInfo,
  CaidoReadyInfo,
} from "@/types";
import type { Geo } from "@vercel/functions";
import { FileAccumulator } from "./utils/file-accumulator";
import { BackgroundProcessTracker } from "./utils/background-process-tracker";
import { ptySessionManager } from "./utils/pty-session-manager";
import { isE2BSandbox } from "./utils/sandbox-types";

export { isE2BSandbox };

// Factory function to create tools with context
export const createTools = (
  userID: string,
  chatId: string,
  writer: UIMessageStreamWriter,
  mode: ChatMode = "agent",
  userLocation: Geo,
  initialTodos?: Todo[],
  memoryEnabled: boolean = true,
  isTemporary: boolean = false,
  assistantMessageId?: string,
  sandboxPreference?: SandboxPreference,
  serviceKey?: string,
  guardrailsConfig?: string,
  caidoEnabled: boolean = false,
  caidoPort?: number,
  appendMetadataStream?: AppendMetadataStreamFn,
  onToolCost?: (costDollars: number) => void,
  subscription?: SubscriptionTier,
  onSandboxBoot?: (info: SandboxBootInfo) => void,
  onCaidoReady?: (info: CaidoReadyInfo) => void,
  modelName?: string,
  // Tools contributed by the user's connected MCP servers (see lib/ai/mcp/*).
  // Already namespaced + AI-SDK-ready; merged into every rebuilt tool set so
  // provider-fallback legs keep them too.
  mcpTools?: ToolSet,
  // User-picked image model (OpenRouter id) + its per-image cost, for the
  // generate_image tool. Undefined → generate_image uses its default.
  imageModel?: string,
  imageCost?: number,
  // Connected GitHub token/username — wired into the sandbox git credentials by
  // run_terminal_cmd so the agent can clone/push the user's repos.
  githubToken?: string,
  githubUsername?: string,
) => {
  let sandbox: AnySandbox | null = null;
  let sandboxFirstUsedAt: number | null = null;
  let currentModelName = modelName;

  // E2B sandbox cost: ~$0.05/hour for 4-core 2GB
  const E2B_COST_PER_MS = 0.05 / (60 * 60 * 1000);

  const trackSandboxUsage = (newSandbox: AnySandbox) => {
    sandbox = newSandbox;
    if (!sandboxFirstUsedAt && isE2BSandbox(newSandbox)) {
      sandboxFirstUsedAt = Date.now();
    }
  };

  // Subscription tiers were removed, so cloud E2B Agent mode is available to
  // every signed-in user. The old "free agent must use a local sandbox, E2B is
  // paid-only" gate no longer applies.

  // Use HybridSandboxManager if sandboxPreference and serviceKey are provided
  const sandboxManager =
    sandboxPreference && serviceKey
      ? new HybridSandboxManager(
          userID,
          trackSandboxUsage,
          sandboxPreference,
          serviceKey,
          isE2BSandbox(sandbox) ? sandbox : null,
          subscription,
          onSandboxBoot,
        )
      : new DefaultSandboxManager(
          userID,
          trackSandboxUsage,
          isE2BSandbox(sandbox) ? sandbox : null,
          onSandboxBoot,
        );

  const todoManager = new TodoManager(initialTodos);
  const fileAccumulator = new FileAccumulator();
  const backgroundProcessTracker = new BackgroundProcessTracker();

  const context: ToolContext = {
    sandboxManager,
    writer,
    userLocation,
    todoManager,
    userID,
    chatId,
    assistantMessageId,
    fileAccumulator,
    backgroundProcessTracker,
    ptySessionManager,
    mode,
    modelName,
    getCurrentModelName: () => currentModelName,
    imageModel,
    imageCost,
    githubToken,
    githubUsername,
    subscription,
    isE2BSandbox,
    guardrailsConfig,
    caidoEnabled,
    caidoPort,
    appendMetadataStream,
    onToolCost,
    onCaidoReady,
  };

  const buildTools = (): ToolSet => {
    // Create all available tools. This is intentionally a factory rather than a
    // one-time object so model-specific tool schemas can be rebuilt for
    // provider fallback legs.
    const allTools = {
      run_terminal_cmd: createRunTerminalCmd(context),
      interact_terminal_session: createInteractTerminalSession(context),
      get_terminal_files: createGetTerminalFiles(context),
      file: createFile(context),
      todo_write: createTodoWrite(context),
      ...(!isTemporary &&
        memoryEnabled && {
          create_note: createCreateNote(context),
          list_notes: createListNotes(context),
          update_note: createUpdateNote(context),
          delete_note: createDeleteNote(context),
        }),
      ...(process.env.PERPLEXITY_API_KEY && {
        web_search: createWebSearch(context),
      }),
      // Caido proxy temporarily disabled for all users.
      // ...(caidoEnabled && createProxyTools(context)),
      ...(process.env.JINA_API_KEY && {
        open_url: createOpenUrlTool(),
      }),
      // Image generation via OpenRouter (reuses the existing key, no new
      // provider). Available in every mode.
      ...(process.env.OPENROUTER_API_KEY && {
        generate_image: createGenerateImage(context),
      }),
      // App-builder: expose a sandbox dev-server port as a live preview URL.
      expose_preview: createExposePreview(context),
      // User-connected MCP server tools. Available in every mode — a connected
      // GitHub / Slack / Notion connector is just as useful in ask mode as in
      // agent mode.
      ...(mcpTools ?? {}),
    };

    // Filter tools based on mode
    return mode === "ask"
      ? {
          ...(!isTemporary &&
            memoryEnabled && {
              create_note: allTools.create_note,
              list_notes: allTools.list_notes,
              update_note: allTools.update_note,
              delete_note: allTools.delete_note,
            }),
          ...(process.env.PERPLEXITY_API_KEY && {
            web_search: createWebSearch(context),
          }),
          ...(process.env.JINA_API_KEY && {
            open_url: createOpenUrlTool(),
          }),
          ...(process.env.OPENROUTER_API_KEY && {
            generate_image: createGenerateImage(context),
          }),
          ...(mcpTools ?? {}),
        }
      : allTools;
  };

  const tools = buildTools();

  const getSandbox = () => sandbox;
  const ensureSandbox = async () => {
    const { sandbox: ensured } = await sandboxManager.getSandbox();
    return ensured;
  };
  const getTodoManager = () => todoManager;
  const getFileAccumulator = () => fileAccumulator;
  const setCurrentModelName = (nextModelName: string | undefined) => {
    currentModelName = nextModelName;
  };

  const getToolsForModel = (nextModelName: string | undefined) => {
    setCurrentModelName(nextModelName);
    return buildTools();
  };

  const getSandboxSessionCost = (): number => {
    if (!sandboxFirstUsedAt) return 0;
    return (Date.now() - sandboxFirstUsedAt) * E2B_COST_PER_MS;
  };

  return {
    tools,
    getSandbox,
    ensureSandbox,
    getTodoManager,
    getFileAccumulator,
    sandboxManager,
    getSandboxSessionCost,
    setCurrentModelName,
    getToolsForModel,
  };
};

// Re-export types for external use
export type { SandboxPreference };
