"use client";

/** Minimal empty-chat headline — operation presets live in the sidebar menu. */
export const HackingSuggestions = () => {
  return (
    <div className="text-center">
      <h1 className="mb-1.5 text-[22px] font-normal tracking-tight text-foreground">
        How can I help you today?
      </h1>
      <p className="mx-auto max-w-md text-[13px] text-muted-foreground">
        Ask a security question, or describe an operation — RIFT runs the tools
        in an isolated sandbox.
      </p>
    </div>
  );
};
