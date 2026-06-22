"use client";

import type { SandboxPreference } from "@/types/chat";

interface SandboxPreferenceState {
  sandboxPreference: SandboxPreference;
  setSandboxPreference: (preference: SandboxPreference) => void;
  desktopBridgeActive: boolean;
}

export function useSandboxPreference(
  _isAuthenticated: boolean,
): SandboxPreferenceState {
  return {
    sandboxPreference: "e2b" as const,
    setSandboxPreference: (_preference: SandboxPreference) => {},
    desktopBridgeActive: false,
  };
}
