import { memo } from "react";
import { UIMessage } from "@ai-sdk/react";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import { FileToolsHandler } from "./tools/FileToolsHandler";
import { FileHandler } from "./tools/FileHandler";
import { TerminalToolHandler } from "./tools/TerminalToolHandler";
import { HttpRequestToolHandler } from "./tools/HttpRequestToolHandler";
import { WebToolHandler } from "./tools/WebToolHandler";
import { TodoToolHandler } from "./tools/TodoToolHandler";
import { NotesToolHandler } from "./tools/NotesToolHandler";
import { ProxyToolHandler } from "./tools/ProxyToolHandler";
import { GetTerminalFilesHandler } from "./tools/GetTerminalFilesHandler";
import { SummarizationHandler } from "./tools/SummarizationHandler";
import type { ChatStatus } from "@/types";
import type { FileDetails } from "@/types/file";
import { ReasoningHandler } from "./ReasoningHandler";
import {
  GeneratingImagePlaceholder,
  ImageGenerationError,
} from "./GeneratingImagePlaceholder";
import { ExposePreviewCard } from "./ExposePreviewCard";
import { FilePartRenderer } from "./FilePartRenderer";
import type { FilePart } from "@/types/file";
import { PlanQuestions, parsePlanQuestions } from "./PlanQuestions";

// Matches a ```rift-questions … ``` fenced block the agent emits in Plan mode.
const PLAN_QUESTIONS_RE = /```rift-questions\s*\n([\s\S]*?)\n```/;
// While streaming, the opening fence may have arrived without its close yet.
const PLAN_QUESTIONS_OPEN_RE = /```rift-questions\s*\n[\s\S]*$/;

/**
 * Render an assistant text part, upgrading a fenced `rift-questions` block into
 * interactive Plan-mode option cards. Falls back to plain markdown when there's
 * no block. While the block is still streaming (no closing fence), the raw JSON
 * is hidden so the user never sees half-written machine payload.
 */
function AssistantText({
  text,
  isStreaming = false,
}: {
  text: string;
  isStreaming?: boolean;
}) {
  const match = text.match(PLAN_QUESTIONS_RE);
  if (match) {
    const data = parsePlanQuestions(match[1]);
    const before = text.slice(0, match.index).trimEnd();
    const after = text.slice((match.index ?? 0) + match[0].length).trimStart();
    return (
      <>
        {before && <MemoizedMarkdown content={before} />}
        {data ? (
          <PlanQuestions data={data} />
        ) : (
          <MemoizedMarkdown content={match[0]} />
        )}
        {after && <MemoizedMarkdown content={after} />}
      </>
    );
  }
  // An unclosed `rift-questions` fence: hide the half-written JSON ONLY while the
  // stream is still in flight. Once the message is done, an unclosed fence means
  // the block never completed (e.g. truncated) — render the raw text so the
  // message is never blank. (This is what made Fable's Plan-mode replies look
  // empty: reasoning models can end a turn mid-fence.)
  if (isStreaming && PLAN_QUESTIONS_OPEN_RE.test(text)) {
    const before = text.replace(PLAN_QUESTIONS_OPEN_RE, "").trimEnd();
    return before ? <MemoizedMarkdown content={before} /> : null;
  }
  return <MemoizedMarkdown content={text} />;
}

interface MessagePartHandlerProps {
  message: UIMessage;
  part: any;
  partIndex: number;
  status: ChatStatus;
  isLastMessage?: boolean;
  /** Pre-computed terminal output by toolCallId (from message level) to avoid per-handler filtering */
  terminalOutputByToolCallId?: Map<string, string>;
  /** File details from get_terminal_files tool (streamed progressively) */
  sharedFileDetails?: FileDetails[];
}

// Memoized user text component - avoids re-renders for unchanged text
const UserTextPart = memo(function UserTextPart({ text }: { text: string }) {
  return <div className="whitespace-pre-wrap">{text}</div>;
});

// Deep equality check for tool inputs — avoids JSON.stringify overhead while
// correctly handling nested objects/arrays (e.g. tool-file edits, todo_write todos).
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const isArrayA = Array.isArray(a);
  const isArrayB = Array.isArray(b);
  if (isArrayA !== isArrayB) return false;

  if (isArrayA) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// Custom comparison for MessagePartHandler to minimize re-renders
function arePropsEqual(
  prevProps: MessagePartHandlerProps,
  nextProps: MessagePartHandlerProps,
): boolean {
  // Always re-render if status changes (streaming state)
  if (prevProps.status !== nextProps.status) return false;

  // Always re-render if isLastMessage changes
  if (prevProps.isLastMessage !== nextProps.isLastMessage) return false;

  // Shared file details change for get_terminal_files during streaming
  // Must be checked before the part reference check below, because the part
  // reference may be stable while new file metadata arrives via the stream.
  if (
    prevProps.part?.type === "tool-get_terminal_files" &&
    prevProps.sharedFileDetails !== nextProps.sharedFileDetails
  )
    return false;

  // Check part reference - if same reference, no changes
  if (prevProps.part === nextProps.part) return true;

  // Pre-computed terminal map reference change should re-render
  if (
    prevProps.terminalOutputByToolCallId !==
    nextProps.terminalOutputByToolCallId
  )
    return false;

  // For tool parts, compare state and output which change during streaming
  if (
    prevProps.part?.type?.startsWith("tool-") ||
    prevProps.part?.type?.startsWith("data-")
  ) {
    return (
      prevProps.part.state === nextProps.part.state &&
      prevProps.part.toolCallId === nextProps.part.toolCallId &&
      prevProps.part.output === nextProps.part.output &&
      // Tool input is an object — reference check first (fast path), then
      // shallow comparison so new objects with identical content don't re-render.
      (prevProps.part.input === nextProps.part.input ||
        deepEqual(prevProps.part.input, nextProps.part.input))
    );
  }

  // For text parts, compare text content
  if (prevProps.part?.type === "text") {
    return prevProps.part.text === nextProps.part.text;
  }

  // For reasoning, compare text
  if (prevProps.part?.type === "reasoning") {
    return (
      prevProps.part.text === nextProps.part.text &&
      prevProps.message.parts.length === nextProps.message.parts.length
    );
  }

  // Default: shallow compare part object
  return prevProps.part === nextProps.part;
}

export const MessagePartHandler = memo(function MessagePartHandler({
  message,
  part,
  partIndex,
  status,
  isLastMessage,
  terminalOutputByToolCallId,
  sharedFileDetails,
}: MessagePartHandlerProps) {
  // Main switch for different part types
  switch (part.type) {
    case "text": {
      const isUser = message.role === "user";
      const text = part.text ?? "";

      // For user messages, use memoized plain text component
      if (isUser) {
        return <UserTextPart text={text} />;
      }

      // For assistant messages, render markdown + any Plan-mode question cards.
      // Only the last message can be actively streaming.
      return (
        <AssistantText
          text={text}
          isStreaming={status === "streaming" && !!isLastMessage}
        />
      );
    }

    case "reasoning":
      return (
        <ReasoningHandler
          message={message}
          partIndex={partIndex}
          status={status}
          isLastMessage={isLastMessage}
        />
      );

    case "data-summarization":
      return (
        <SummarizationHandler
          message={message}
          part={part}
          partIndex={partIndex}
        />
      );

    // Legacy file tools
    case "tool-read_file":
    case "tool-write_file":
    case "tool-delete_file":
    case "tool-search_replace":
    case "tool-multi_edit":
      return <FileToolsHandler message={message} part={part} status={status} />;

    case "tool-file":
      return <FileHandler part={part} status={status} />;

    case "tool-generate_image": {
      // Done: render the generated image from the tool output (durable URL, so
      // it persists across reload — unlike a transient UI file part).
      if (part.state === "output-available") {
        const out = part.output;
        if (out && typeof out === "object" && out.url) {
          return (
            <FilePartRenderer
              part={
                {
                  type: "file",
                  url: out.url,
                  mediaType: out.mediaType ?? "image/png",
                } as FilePart
              }
              partIndex={partIndex}
              messageId={message.id}
              large
            />
          );
        }
        // Tool returned a structured failure (no key, blocked prompt, out of
        // credits, no image, etc.) — surface it instead of a stuck placeholder.
        const errorText =
          out && typeof out === "object" && typeof out.error === "string"
            ? out.error
            : "Please try again.";
        return <ImageGenerationError message={errorText} />;
      }
      if (part.state === "output-error") {
        return (
          <ImageGenerationError
            message={
              typeof part.errorText === "string" && part.errorText
                ? part.errorText
                : "Please try again."
            }
          />
        );
      }
      // Still generating (input-streaming / input-available).
      return <GeneratingImagePlaceholder />;
    }

    case "tool-expose_preview": {
      if (part.state === "output-available") {
        const out = part.output;
        const url =
          out && typeof out === "object" && typeof out.url === "string"
            ? out.url
            : undefined;
        const error =
          out && typeof out === "object" && typeof out.error === "string"
            ? out.error
            : undefined;
        return <ExposePreviewCard url={url} error={error} />;
      }
      if (part.state === "output-error") return null;
      return null;
    }

    case "tool-web_search":
    case "tool-open_url":
    case "tool-web": // Legacy tool
      return <WebToolHandler part={part} status={status} />;

    case "data-terminal":
    case "tool-shell":
    case "tool-run_terminal_cmd":
    case "tool-interact_terminal_session": {
      const effectiveToolCallId =
        (part as any).data?.toolCallId ?? part.toolCallId;
      const precomputedStreamingOutput = effectiveToolCallId
        ? terminalOutputByToolCallId?.get(effectiveToolCallId)
        : undefined;
      return (
        <TerminalToolHandler
          message={message}
          part={part}
          status={status}
          precomputedStreamingOutput={precomputedStreamingOutput}
        />
      );
    }

    // Legacy tool
    case "tool-http_request":
      return (
        <HttpRequestToolHandler message={message} part={part} status={status} />
      );

    case "tool-get_terminal_files":
      return (
        <GetTerminalFilesHandler
          part={part}
          status={status}
          sharedFileDetails={sharedFileDetails}
        />
      );

    case "tool-todo_write":
      return <TodoToolHandler message={message} part={part} status={status} />;

    case "tool-create_note":
      return (
        <NotesToolHandler part={part} status={status} toolName="create_note" />
      );

    case "tool-list_notes":
      return (
        <NotesToolHandler part={part} status={status} toolName="list_notes" />
      );

    case "tool-update_note":
      return (
        <NotesToolHandler part={part} status={status} toolName="update_note" />
      );

    case "tool-delete_note":
      return (
        <NotesToolHandler part={part} status={status} toolName="delete_note" />
      );

    case "tool-list_requests":
      return (
        <ProxyToolHandler
          part={part}
          status={status}
          toolName="list_requests"
        />
      );
    case "tool-view_request":
      return (
        <ProxyToolHandler part={part} status={status} toolName="view_request" />
      );
    case "tool-send_request":
      return (
        <ProxyToolHandler part={part} status={status} toolName="send_request" />
      );
    case "tool-scope_rules":
      return (
        <ProxyToolHandler part={part} status={status} toolName="scope_rules" />
      );
    case "tool-list_sitemap":
      return (
        <ProxyToolHandler part={part} status={status} toolName="list_sitemap" />
      );
    case "tool-view_sitemap_entry":
      return (
        <ProxyToolHandler
          part={part}
          status={status}
          toolName="view_sitemap_entry"
        />
      );

    default:
      return null;
  }
}, arePropsEqual);
