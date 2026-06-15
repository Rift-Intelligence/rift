import React, { memo, useMemo, useRef, useEffect } from "react";
import { UIMessage } from "@ai-sdk/react";
import ToolBlock from "@/components/ui/tool-block";
import { Terminal, Maximize2 } from "lucide-react";
import type { ChatStatus } from "@/types/chat";
import { isSidebarTerminal, type SidebarTerminal } from "@/types/chat";
import { useToolSidebar } from "../../hooks/useToolSidebar";
import { TerminalCodeBlock } from "../TerminalCodeBlock";
import {
  computeShellTerminalBlock,
  getShellDisplayCommand,
  getStreamingTerminalOutput,
  type ShellToolInput,
  type ShellToolOutput,
} from "./shell-tool-utils";
import { isUserStoppedToolError } from "@/lib/chat/tool-abort-utils";

interface TerminalToolHandlerProps {
  message: UIMessage;
  part: any;
  status: ChatStatus;
  /** Pre-computed streaming output for this toolCallId (avoids filtering message.parts in every instance) */
  precomputedStreamingOutput?: string;
}

// Custom comparison to avoid re-renders when tool state hasn't changed
function areTerminalPropsEqual(
  prev: TerminalToolHandlerProps,
  next: TerminalToolHandlerProps,
): boolean {
  if (prev.status !== next.status) return false;
  if (prev.part.state !== next.part.state) return false;
  if (prev.part.toolCallId !== next.part.toolCallId) return false;
  if (prev.part.output !== next.part.output) return false;
  // Compare message.parts length for streaming output updates
  if (prev.message.parts.length !== next.message.parts.length) return false;
  if (prev.precomputedStreamingOutput !== next.precomputedStreamingOutput)
    return false;
  return true;
}

/**
 * Live, auto-scrolling terminal tail rendered INLINE under the ToolBlock while a
 * command is executing. The server already streams the bytes; before this they
 * were only shown as a frozen one-line chip with the real output hidden in a
 * sidebar that auto-opens at most once per page — so after the first command the
 * user "waited empty" with no visible progress. This keeps the running output in
 * view, capped to a short tail, with an affordance to expand the full sidebar.
 */
const LiveTerminalTail = memo(function LiveTerminalTail({
  content,
  onExpand,
  onExpandKeyDown,
}: {
  content: SidebarTerminal;
  onExpand: () => void;
  onExpandKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pin to the bottom as new output streams in (the "watch it work" behaviour).
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [content.output, content.rawBytes]);

  return (
    <div className="ml-[7px] mt-1 overflow-hidden rounded-md border border-primary/15 bg-black/40">
      <div
        ref={scrollRef}
        className="max-h-44 overflow-y-auto px-2.5 py-1.5 font-mono text-[11px] leading-relaxed"
      >
        <TerminalCodeBlock
          command={content.command}
          output={content.output}
          isExecuting
          status="streaming"
          variant="default"
          wrap
          shellAction={content.shellAction}
          rawBytes={content.rawBytes}
        />
      </div>
      <button
        type="button"
        onClick={onExpand}
        onKeyDown={onExpandKeyDown}
        className="flex w-full items-center justify-end gap-1 border-t border-primary/10 px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:text-primary"
      >
        <Maximize2 className="h-2.5 w-2.5" />
        expand
      </button>
    </div>
  );
});

export const TerminalToolHandler = memo(function TerminalToolHandler({
  message,
  part,
  status,
  precomputedStreamingOutput,
}: TerminalToolHandlerProps) {
  const { toolCallId, state, input, output, errorText } = part;

  // Support both legacy run_terminal_cmd and new shell tool input shapes
  const isShellTool = part.type === "tool-shell" || input?.action !== undefined;
  const terminalInput = isShellTool
    ? {
        command: getShellDisplayCommand(input),
        is_background: false,
        interactive: false,
      }
    : (input as {
        command: string;
        is_background: boolean;
        interactive?: boolean;
      });
  const terminalOutput = output as ShellToolOutput;

  // Memoize streaming output: use pre-computed value when passed, else derive from message.parts
  const effectiveToolCallId = (part as any).data?.toolCallId ?? toolCallId;
  const streamingOutput = useMemo(() => {
    if (precomputedStreamingOutput !== undefined)
      return precomputedStreamingOutput;
    return getStreamingTerminalOutput(message.parts, effectiveToolCallId);
  }, [precomputedStreamingOutput, message.parts, effectiveToolCallId]);

  const isExecuting = state === "input-available" && status === "streaming";
  const hasResult = state === "output-available";

  const { blockAction, blockTarget, sidebarContent } = useMemo(
    () =>
      computeShellTerminalBlock({
        isShellTool,
        shellInput: input as ShellToolInput | undefined,
        shellOutput: terminalOutput,
        errorText,
        streamingOutput,
        isExecuting,
        hasResult,
        toolCallId,
        legacyInteractive: !isShellTool
          ? terminalInput?.interactive
          : undefined,
        legacyIsBackground: !isShellTool
          ? terminalInput?.is_background
          : undefined,
        legacyCommand: !isShellTool ? terminalInput?.command : undefined,
      }),
    [
      isShellTool,
      input,
      terminalOutput,
      errorText,
      streamingOutput,
      isExecuting,
      hasResult,
      toolCallId,
      terminalInput?.interactive,
      terminalInput?.is_background,
      terminalInput?.command,
    ],
  );

  const { handleOpenInSidebar, handleKeyDown } = useToolSidebar({
    toolCallId,
    content: sidebarContent,
    typeGuard: isSidebarTerminal,
  });

  const shellAction = (input as { action?: string })?.action;
  const isStoppedByUser = isUserStoppedToolError(errorText);

  switch (state) {
    case "input-streaming": {
      if (status !== "streaming") return null;
      // For non-exec shell actions (wait, send, kill), use the action-specific
      // label instead of "Generating command" which only applies to exec
      if (isShellTool && shellAction && shellAction !== "exec") {
        return (
          <ToolBlock
            key={toolCallId}
            icon={<Terminal />}
            action={blockAction(true)}
            target={blockTarget || undefined}
            isShimmer={true}
          />
        );
      }
      return (
        <ToolBlock
          key={toolCallId}
          icon={<Terminal />}
          action="Generating command"
          isShimmer={true}
        />
      );
    }
    case "input-available":
      return (
        <div key={toolCallId}>
          <ToolBlock
            icon={<Terminal />}
            action={blockAction(status === "streaming")}
            target={blockTarget}
            isShimmer={status === "streaming"}
            isClickable
            onClick={handleOpenInSidebar}
            onKeyDown={handleKeyDown}
          />
          {isExecuting && sidebarContent && (
            <LiveTerminalTail
              content={sidebarContent}
              onExpand={handleOpenInSidebar}
              onExpandKeyDown={handleKeyDown}
            />
          )}
        </div>
      );
    case "output-available":
      return (
        <ToolBlock
          key={toolCallId}
          icon={<Terminal />}
          action={blockAction(false)}
          target={blockTarget}
          isClickable
          onClick={handleOpenInSidebar}
          onKeyDown={handleKeyDown}
        />
      );
    case "output-error":
      return (
        <ToolBlock
          key={toolCallId}
          icon={<Terminal />}
          action={isStoppedByUser ? "Stopped command" : blockAction(false)}
          target={blockTarget}
          isClickable
          onClick={handleOpenInSidebar}
          onKeyDown={handleKeyDown}
        />
      );
    default:
      return null;
  }
}, areTerminalPropsEqual);
