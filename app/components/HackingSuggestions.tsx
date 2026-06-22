"use client";

import { useAppShell } from "@/app/contexts/AppShellContext";

/** Minimal empty-chat headline — operation presets live in the sidebar menu. */
export const HackingSuggestions = () => {
  const { variant } = useAppShell();

  return (
    <div className="text-center">
      <h1
        className={`mb-1.5 text-[22px] font-normal tracking-tight text-foreground ${
          variant === "studio" ? "studio-hero-title text-[26px]" : ""
        }`}
      >
        How can I help you today?
      </h1>
    </div>
  );
};
