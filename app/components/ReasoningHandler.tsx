"use client";

import { memo, useMemo } from "react";
import { UIMessage } from "@ai-sdk/react";
import type { ChatStatus } from "@/types";
import { MemoizedMarkdown } from "./MemoizedMarkdown";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";

type ReasoningHandlerProps = {
  message: UIMessage;
  partIndex: number;
  status: ChatStatus;
  isLastMessage?: boolean;
};

const collectReasoningText = (
  parts: UIMessage["parts"],
  startIndex: number,
): string => {
  const collected: string[] = [];
  for (let i = startIndex; i < parts.length; i++) {
    const part = parts[i];
    if (part?.type === "reasoning") {
      collected.push(part.text ?? "");
    } else {
      break;
    }
  }
  return collected.join("");
};

// Hoist regex outside component to avoid recreation
const REDACTED_PATTERN = /^(\[REDACTED\])+$/;

// Custom comparison for reasoning handler
function areReasoningPropsEqual(
  prev: ReasoningHandlerProps,
  next: ReasoningHandlerProps,
): boolean {
  if (prev.status !== next.status) return false;
  if (prev.isLastMessage !== next.isLastMessage) return false;
  if (prev.partIndex !== next.partIndex) return false;
  // Compare parts length and relevant reasoning content
  if (prev.message.parts.length !== next.message.parts.length) return false;
  // Compare the reasoning part text directly
  const prevPart = prev.message.parts[prev.partIndex];
  const nextPart = next.message.parts[next.partIndex];
  if (prevPart?.type !== nextPart?.type) return false;
  if (prevPart?.type === "reasoning" && nextPart?.type === "reasoning") {
    return prevPart.text === nextPart.text;
  }
  return true;
}

export const ReasoningHandler = memo(function ReasoningHandler({
  message,
  partIndex,
  status,
  isLastMessage,
}: ReasoningHandlerProps) {
  // Memoize parts array reference to avoid recreation
  const parts = useMemo(
    () => (Array.isArray(message.parts) ? message.parts : []),
    [message.parts],
  );
  const currentPart = parts[partIndex];

  // Memoize combined text collection - only recompute when parts or index changes
  const combined = useMemo(() => {
    if (currentPart?.type !== "reasoning") return "";
    // Skip if previous part is also reasoning (avoid duplicate renders)
    const previousPart = parts[partIndex - 1];
    if (previousPart?.type === "reasoning") return "";
    return collectReasoningText(parts, partIndex);
  }, [parts, partIndex, currentPart?.type]);

  // Early return for non-reasoning parts
  if (currentPart?.type !== "reasoning") return null;

  // Skip if previous part is also reasoning (avoid duplicate renders)
  const previousPart = parts[partIndex - 1];
  if (previousPart?.type === "reasoning") return null;

  // Don't show reasoning if empty or only contains [REDACTED] (encrypted reasoning from providers like Gemini)
  if (!combined || REDACTED_PATTERN.test(combined.trim())) return null;

  const isLastPart = partIndex === parts.length - 1;
  // Reasoning is actively streaming while it's the last part of the last message
  // and the run is still producing tokens — that's when we show the live "thinking".
  const isStreaming =
    (status === "streaming" || status === "submitted") &&
    !!isLastMessage &&
    isLastPart;

  return (
    <Reasoning
      isStreaming={isStreaming}
      defaultOpen={isStreaming}
      className="my-1"
    >
      <ReasoningTrigger
        getThinkingMessage={(streaming) =>
          streaming ? "thinking" : "thought process"
        }
      />
      <ReasoningContent>
        <div className="font-mono text-[12px] leading-relaxed text-muted-foreground/85 [&_p]:my-1.5">
          <MemoizedMarkdown content={combined} />
        </div>
      </ReasoningContent>
    </Reasoning>
  );
}, areReasoningPropsEqual);
