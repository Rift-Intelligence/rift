import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { dynamicTool, jsonSchema, type ToolSet } from "ai";

/**
 * MCP (Model Context Protocol) client layer.
 *
 * Connects to a single remote MCP server, lists its tools, and converts each
 * into an AI-SDK `dynamicTool` so it can be merged straight into the agent's
 * tool set. The model calls the tool by a namespaced key; `execute` forwards
 * the call to the live MCP server over the open transport.
 *
 * Everything here is defensive: a server that is slow, unreachable, or returns
 * a malformed tool list must never break the core agent. Connect failures
 * resolve to `null`; per-tool execution failures resolve to an error string the
 * model can read and react to.
 */

export interface McpServerConfig {
  /** Convex row id — used to keep tool namespaces unique across servers. */
  id: string;
  /** Human name, used to build the readable part of the tool namespace. */
  name: string;
  url: string;
  transport: "http" | "sse";
  headers?: Array<{ key: string; value: string }>;
}

export interface McpConnection {
  serverId: string;
  serverName: string;
  /** Tools exposed by this server, already namespaced + AI-SDK-ready. */
  tools: ToolSet;
  toolNames: string[];
  /** Close the underlying transport. Safe to call more than once. */
  close: () => Promise<void>;
}

/** Connect timeout (initialize handshake) and per-call timeout. */
const CONNECT_TIMEOUT_MS = 12_000;
const CALL_TIMEOUT_MS = 90_000;

/** AI SDK's jsonSchema() input type, without pulling in @types/json-schema. */
type FlexibleJsonSchema = Parameters<typeof jsonSchema>[0];

/**
 * Turn a server name into a short, tool-name-safe slug. Tool keys sent to the
 * model must match a conservative `[a-zA-Z0-9_-]` charset, so anything else is
 * collapsed to underscores.
 */
function slugify(name: string, fallback: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return slug || fallback;
}

function headersToRecord(
  headers?: Array<{ key: string; value: string }>,
): Record<string, string> | undefined {
  if (!headers || headers.length === 0) return undefined;
  const record: Record<string, string> = {};
  for (const { key, value } of headers) {
    if (key) record[key] = value;
  }
  return Object.keys(record).length > 0 ? record : undefined;
}

/**
 * Flatten an MCP CallTool result into something the language model can consume.
 * Text parts are concatenated; non-text parts (images, embedded resources) are
 * summarized rather than dropped silently.
 */
function flattenToolResult(result: {
  isError?: boolean;
  content?: Array<Record<string, unknown>>;
  structuredContent?: unknown;
}): string {
  const parts = Array.isArray(result.content) ? result.content : [];
  const chunks: string[] = [];

  for (const part of parts) {
    const type = part?.type;
    if (type === "text" && typeof part.text === "string") {
      chunks.push(part.text);
    } else if (type === "image") {
      chunks.push("[image returned by tool — not rendered here]");
    } else if (type === "audio") {
      chunks.push("[audio returned by tool]");
    } else if (type === "resource" || type === "resource_link") {
      const uri =
        (part.resource as { uri?: string } | undefined)?.uri ??
        (part.uri as string | undefined);
      chunks.push(uri ? `[resource: ${uri}]` : "[embedded resource]");
    } else if (typeof part?.text === "string") {
      chunks.push(part.text);
    }
  }

  let text = chunks.join("\n").trim();
  if (!text && result.structuredContent !== undefined) {
    try {
      text = JSON.stringify(result.structuredContent);
    } catch {
      text = "";
    }
  }
  if (!text) text = "(tool returned no content)";
  return result.isError ? `Tool error: ${text}` : text;
}

/** Race a promise against a timeout, rejecting if it doesn't settle in time. */
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Establish a transport + connect the client. Tries the configured transport
 * first, then falls back to the other one (modern Streamable HTTP ↔ legacy
 * SSE) since many servers only speak one.
 */
async function connectWithFallback(
  client: Client,
  config: McpServerConfig,
): Promise<void> {
  const url = new URL(config.url);
  const headers = headersToRecord(config.headers);
  const requestInit = headers ? { headers } : undefined;

  const makeHttp = () =>
    new StreamableHTTPClientTransport(url, { requestInit });
  const makeSse = () =>
    new SSEClientTransport(url, {
      requestInit,
      eventSourceInit: headers
        ? {
            fetch: (input: string | URL | Request, init?: RequestInit) =>
              fetch(input, {
                ...init,
                headers: { ...(init?.headers ?? {}), ...headers },
              }),
          }
        : undefined,
    });

  const order =
    config.transport === "sse" ? [makeSse, makeHttp] : [makeHttp, makeSse];

  let lastError: unknown;
  for (const make of order) {
    try {
      await withTimeout(
        client.connect(make(), { timeout: CONNECT_TIMEOUT_MS }),
        CONNECT_TIMEOUT_MS + 1_000,
        `MCP connect (${config.name})`,
      );
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new Error("Unable to connect to MCP server");
}

/**
 * Connect to one MCP server and return its tools (AI-SDK ready) + a close
 * handle. Returns `null` on any connection/listing failure so callers can skip
 * the server without aborting the agent.
 */
export async function connectMcpServer(
  config: McpServerConfig,
): Promise<McpConnection | null> {
  const client = new Client({ name: "rift", version: "1.0.0" });

  try {
    await connectWithFallback(client, config);

    const listed = await withTimeout(
      client.listTools(),
      CONNECT_TIMEOUT_MS,
      `MCP listTools (${config.name})`,
    );

    const serverSlug = slugify(config.name, `s${config.id.slice(-4)}`);
    const tools: ToolSet = {};
    const toolNames: string[] = [];
    const usedKeys = new Set<string>();

    for (const mcpTool of listed.tools ?? []) {
      const originalName = mcpTool.name;
      if (!originalName) continue;

      // Namespaced key the model sees, e.g. "mcp_deepwiki_ask_question".
      const safeName = originalName.replace(/[^a-zA-Z0-9_-]+/g, "_");
      let key = `mcp_${serverSlug}_${safeName}`.slice(0, 60);
      // Guard against (rare) collisions within a server.
      let suffix = 1;
      while (usedKeys.has(key)) {
        key = `${`mcp_${serverSlug}_${safeName}`.slice(0, 56)}_${suffix++}`;
      }
      usedKeys.add(key);
      toolNames.push(key);

      const inputSchema = (mcpTool.inputSchema ?? {
        type: "object",
        properties: {},
      }) as FlexibleJsonSchema;

      tools[key] = dynamicTool({
        description:
          mcpTool.description ??
          `${originalName} (via MCP server "${config.name}")`,
        inputSchema: jsonSchema(inputSchema),
        execute: async (args) => {
          try {
            const result = await withTimeout(
              client.callTool({
                name: originalName,
                arguments: (args ?? {}) as Record<string, unknown>,
              }),
              CALL_TIMEOUT_MS,
              `MCP call ${originalName}`,
            );
            return flattenToolResult(
              result as Parameters<typeof flattenToolResult>[0],
            );
          } catch (error) {
            return `Tool error: ${
              error instanceof Error ? error.message : String(error)
            }`;
          }
        },
      });
    }

    let closed = false;
    const close = async () => {
      if (closed) return;
      closed = true;
      try {
        await client.close();
      } catch {
        // Best-effort — the transport may already be gone.
      }
    };

    return {
      serverId: config.id,
      serverName: config.name,
      tools,
      toolNames,
      close,
    };
  } catch (error) {
    try {
      await client.close();
    } catch {
      // ignore
    }
    console.warn(
      `[mcp] Failed to connect to "${config.name}" (${config.url}):`,
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
