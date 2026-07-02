import type { ToolSet } from "ai";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/db/convex-client";
import { connectMcpServer, type McpConnection } from "./mcp-client";

/**
 * Loads every *enabled* MCP server the user has configured, connects to them in
 * parallel, and returns one merged tool set plus a single close handle.
 *
 * Design constraints:
 * - Additive & non-fatal: any failure (Convex read, a dead server, a bad tool
 *   list) degrades to "fewer / no MCP tools", never an agent crash.
 * - The returned connections stay OPEN for the lifetime of the stream because
 *   tool `execute` calls happen during streaming. The caller MUST invoke
 *   `close()` once the run finishes (success or error).
 */

export interface LoadedMcpServerStatus {
  name: string;
  ok: boolean;
  toolCount: number;
  error?: string;
}

export interface LoadedMcpTools {
  tools: ToolSet;
  /** Closes all underlying MCP transports. Safe to call once, in a finally. */
  close: () => Promise<void>;
  /** Per-server outcome, for logging / future UI surfacing. */
  servers: LoadedMcpServerStatus[];
}

const EMPTY: LoadedMcpTools = {
  tools: {},
  close: async () => {},
  servers: [],
};

export async function loadUserMcpTools(
  userId: string,
): Promise<LoadedMcpTools> {
  // Global kill switch in case a deploy needs to disable MCP fast.
  if (process.env.MCP_DISABLED === "true") return EMPTY;

  const serviceKey = process.env.CONVEX_SERVICE_ROLE_KEY;
  if (!serviceKey) return EMPTY;

  let configs: Array<{
    _id: string;
    name: string;
    url: string;
    transport: "http" | "sse";
    headers?: Array<{ key: string; value: string }>;
  }> = [];

  try {
    configs = await getConvexClient().query(
      api.mcpServers.listEnabledForBackend,
      { serviceKey, userId },
    );
  } catch (error) {
    console.warn(
      "[mcp] Failed to read user MCP servers:",
      error instanceof Error ? error.message : error,
    );
    return EMPTY;
  }

  if (configs.length === 0) return EMPTY;

  const settled = await Promise.allSettled(
    configs.map((c) =>
      connectMcpServer({
        id: c._id,
        name: c.name,
        url: c.url,
        transport: c.transport,
        headers: c.headers,
      }),
    ),
  );

  const connections: McpConnection[] = [];
  const servers: LoadedMcpServerStatus[] = [];

  settled.forEach((outcome, i) => {
    const cfg = configs[i];
    if (outcome.status === "fulfilled" && outcome.value) {
      connections.push(outcome.value);
      servers.push({
        name: cfg.name,
        ok: true,
        toolCount: outcome.value.toolNames.length,
      });
    } else {
      servers.push({
        name: cfg.name,
        ok: false,
        toolCount: 0,
        error:
          outcome.status === "rejected"
            ? outcome.reason instanceof Error
              ? outcome.reason.message
              : String(outcome.reason)
            : "Connection failed",
      });
    }
  });

  // Merge all tools into one set. connectMcpServer already namespaces by server,
  // but two servers sharing a name could still collide — disambiguate here.
  const tools: ToolSet = {};
  for (const conn of connections) {
    for (const [key, tool] of Object.entries(conn.tools)) {
      let finalKey = key;
      let suffix = 1;
      while (finalKey in tools) {
        finalKey = `${key}_${suffix++}`.slice(0, 64);
      }
      tools[finalKey] = tool;
    }
  }

  const close = async () => {
    await Promise.allSettled(connections.map((c) => c.close()));
  };

  const totalTools = Object.keys(tools).length;
  if (totalTools > 0 || servers.some((s) => !s.ok)) {
    console.log(
      `[mcp] Loaded ${totalTools} tool(s) from ${
        servers.filter((s) => s.ok).length
      }/${servers.length} server(s) for user ${userId}`,
    );
  }

  return { tools, close, servers };
}
