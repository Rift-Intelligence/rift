import React, { memo, useMemo } from "react";
import { UIMessage } from "@ai-sdk/react";
import { CursorToolBlock } from "@/components/ui/cursor-tool-block";
import type { ChatStatus } from "@/types/chat";
import { isSidebarTerminal, type SidebarTerminal } from "@/types/chat";
import { useToolSidebar } from "../../hooks/useToolSidebar";
import {
  computeShellTerminalBlock,
  getShellDisplayCommand,
  getStreamingTerminalOutput,
  isInteractiveShellAction,
  type ShellToolInput,
  type ShellToolOutput,
} from "./shell-tool-utils";
import { isUserStoppedToolError } from "@/lib/chat/tool-abort-utils";

function getCursorToolLabel(
  isShellTool: boolean,
  shellAction: string | undefined,
  isActive: boolean,
  blockAction: (active: boolean) => string,
  blockTarget: string | undefined,
  briefOnly: boolean,
  briefText: string,
): string {
  if (briefOnly && briefText) return briefText;
  if (isActive && blockTarget) return blockTarget;
  if (!isActive && (shellAction === "exec" || !isShellTool)) {
    return "Ran terminal command";
  }
  return blockAction(isActive);
}

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
          <CursorToolBlock
            key={toolCallId}
            label={blockAction(true)}
            status="running"
            command={blockTarget || undefined}
            isShimmer
          />
        );
      }
      return (
        <CursorToolBlock
          key={toolCallId}
          label="Generating command"
          status="running"
          isShimmer
        />
      );
    }
    case "input-available": {
      const briefText = (input as { brief?: string })?.brief || "";
      const useBriefOnly =
        !!briefText &&
        ((isShellTool && isInteractiveShellAction(shellAction)) ||
          (!isInteractiveShellAction(shellAction) && false));
      const label = getCursorToolLabel(
        isShellTool,
        shellAction,
        status === "streaming",
        blockAction,
        blockTarget,
        useBriefOnly,
        briefText,
      );
      const output =
        isExecuting && sidebarContent ? sidebarContent.output : undefined;
      return (
        <CursorToolBlock
          key={toolCallId}
          label={label}
          status={status === "streaming" ? "running" : "done"}
          command={blockTarget || undefined}
          output={output}
          defaultOpen={isExecuting}
          isShimmer={status === "streaming"}
          isClickable
          onClick={handleOpenInSidebar}
          onKeyDown={handleKeyDown}
        />
      );
    }
    case "output-available": {
      const briefTextOut = (input as { brief?: string })?.brief || "";
      const labelOut = getCursorToolLabel(
        isShellTool,
        shellAction,
        false,
        blockAction,
        blockTarget,
        !!briefTextOut,
        briefTextOut,
      );
      const outputText =
        sidebarContent?.output ||
        (typeof terminalOutput === "object"
          ? terminalOutput?.result?.stdout ||
            terminalOutput?.result?.output ||
            terminalOutput?.output
          : "") ||
        "";
      return (
        <CursorToolBlock
          key={toolCallId}
          label={labelOut}
          status="done"
          command={blockTarget || undefined}
          output={outputText || undefined}
          defaultOpen={Boolean(outputText)}
          isClickable
          onClick={handleOpenInSidebar}
          onKeyDown={handleKeyDown}
        />
      );
    }
    case "output-error":
      return (
        <CursorToolBlock
          key={toolCallId}
          label={isStoppedByUser ? "Stopped command" : blockAction(false)}
          status={isStoppedByUser ? "stopped" : "error"}
          command={blockTarget || undefined}
          isClickable
          onClick={handleOpenInSidebar}
          onKeyDown={handleKeyDown}
        />
      );
    default:
      return null;
  }
}, areTerminalPropsEqual);
