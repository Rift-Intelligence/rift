"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ComponentProps, ReactNode } from "react";

type ReasoningContextValue = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
  duration: number;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

export const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
};

export function Reasoning({
  className,
  isStreaming = false,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
  ...props
}: ReasoningProps) {
  const [isOpen, setIsOpen] = useControllableState({
    prop: open,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  // Live "background is working" signal: count seconds while the model is
  // actively reasoning, then freeze the total so the trigger can read
  // "thought process · 12s" once it's done.
  const [duration, setDuration] = useState(0);
  const startRef = useRef<number | null>(null);

  // Auto-open when reasoning starts streaming; never auto-close, so the
  // transcript stays visible after it finishes — the user keeps the terminal
  // experience and can collapse it by hand.
  const wasStreaming = useRef(false);
  useEffect(() => {
    if (isStreaming && !wasStreaming.current) {
      setIsOpen(true);
    }
    wasStreaming.current = isStreaming;
  }, [isStreaming, setIsOpen]);

  useEffect(() => {
    if (!isStreaming) {
      // Not streaming (ended or never started): stop the clock. `duration`
      // keeps its last value so the trigger can read "thought process · 12s".
      startRef.current = null;
      return;
    }
    // setState lives only inside the interval callback (never synchronously in
    // the effect body) so we don't trigger cascading renders.
    startRef.current = Date.now();
    const id = setInterval(() => {
      if (startRef.current !== null) {
        setDuration(Math.floor((Date.now() - startRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(id);
  }, [isStreaming]);

  const contextValue = useMemo(
    () => ({ isOpen: !!isOpen, setIsOpen, isStreaming, duration }),
    [isOpen, setIsOpen, isStreaming, duration],
  );

  return (
    <ReasoningContext.Provider value={contextValue}>
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className={cn(
          "not-prose w-full min-w-0 max-w-full space-y-2",
          className,
        )}
        {...props}
      >
        {children}
      </Collapsible>
    </ReasoningContext.Provider>
  );
}

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  getThinkingMessage?: (isStreaming: boolean) => ReactNode;
};

const defaultGetThinkingMessage = (isStreaming: boolean): ReactNode =>
  isStreaming ? "reasoning" : "reasoning";

export function ReasoningTrigger({
  className,
  getThinkingMessage = defaultGetThinkingMessage,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, isStreaming, duration } = useReasoning();

  return (
    <CollapsibleTrigger
      className={cn(
        "group/reason flex w-full items-center gap-2.5 py-0.5 text-left transition-colors",
        className,
      )}
      {...props}
    >
      {/* Status glyph — a live accent dot that pings while thinking, calm when
          done. Replaces the old geometric marker with something quieter. */}
      {isStreaming ? (
        <span className="relative flex size-3.5 shrink-0 items-center justify-center">
          <span className="absolute inline-flex size-3.5 animate-ping rounded-full bg-primary/25" />
          <span className="relative size-[6px] rounded-full bg-primary shadow-[0_0_8px_var(--signal-bright)]" />
        </span>
      ) : (
        <span
          aria-hidden
          className="flex size-3.5 shrink-0 items-center justify-center"
        >
          <span className="size-[5px] rounded-full bg-muted-foreground/40 transition-colors group-hover/reason:bg-primary/70" />
        </span>
      )}

      <span className="flex-1 font-mono text-[10.5px] font-medium uppercase tracking-[0.22em]">
        {isStreaming ? (
          <span className="rift-thinking-shimmer">
            {getThinkingMessage(true)}
          </span>
        ) : (
          <span className="text-muted-foreground/70 transition-colors group-hover/reason:text-foreground/90">
            {getThinkingMessage(false)}
          </span>
        )}
        {duration > 0 && (
          <span className="ml-2 text-muted-foreground/40 tabular-nums normal-case tracking-normal">
            {duration}s
          </span>
        )}
      </span>

      <ChevronDownIcon
        className={cn(
          "size-3.5 text-muted-foreground/40 transition-all group-hover/reason:text-primary/70",
          isOpen ? "rotate-180" : "rotate-0",
        )}
      />
    </CollapsibleTrigger>
  );
}

export type ReasoningContentProps = ComponentProps<typeof CollapsibleContent>;

export function ReasoningContent({
  className,
  children,
  ...props
}: ReasoningContentProps) {
  const { isStreaming } = useReasoning();
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [children, isStreaming]);

  return (
    <CollapsibleContent
      ref={contentRef}
      className={cn(
        "mt-2 ml-[6px] space-y-3 border-l border-primary/20 pl-3.5 text-muted-foreground max-h-60 min-w-0 max-w-full overflow-x-hidden overflow-y-auto break-words",
        "[overflow-wrap:anywhere]",
        "[&_pre]:max-w-full [&_pre]:overflow-x-auto",
        "data-[state=closed]:animate-out data-[state=open]:animate-in",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
        className,
      )}
      {...props}
    >
      {children}
      {isStreaming && (
        <span
          aria-hidden
          className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] rounded-[1px] bg-primary align-text-bottom animate-[cursor-blink_1.1s_step-end_infinite]"
        />
      )}
    </CollapsibleContent>
  );
}

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
