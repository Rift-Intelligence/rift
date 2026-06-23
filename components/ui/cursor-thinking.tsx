"use client";

/** Cursor mockup — "Planning next moves" + pulsing dots */
export function CursorThinking() {
  return (
    <div
      className="cursor-thinking my-2 inline-flex items-center gap-2 text-xs text-muted-foreground"
      role="status"
      aria-label="Planning next moves"
    >
      <span>Planning next moves</span>
      <span
        className="cursor-thinking-dots inline-flex items-center gap-[3px]"
        aria-hidden
      >
        <span />
        <span />
        <span />
      </span>
    </div>
  );
}

export default CursorThinking;
