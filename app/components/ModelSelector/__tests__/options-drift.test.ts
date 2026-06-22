import { describe, it, expect } from "@jest/globals";
import { ASK_MODEL_OPTIONS, AGENT_MODEL_OPTIONS } from "../constants";
import { myProvider, resolveTierToProviderKey } from "@/lib/ai/providers";
import type { ChatMode } from "@/types/chat";

/**
 * Drift guard: every selectable RIFT tier must resolve to a provider key
 * registered with `myProvider` in *both* modes. Without this, picking the
 * tier from the UI would crash on `myProvider.languageModel()`.
 */
describe("ModelSelector tier ↔ provider drift", () => {
  const allOptions = [...ASK_MODEL_OPTIONS, ...AGENT_MODEL_OPTIONS];

  it("every option in both lineups resolves to a registered provider", () => {
    for (const mode of ["ask", "agent"] as ChatMode[]) {
      const options =
        mode === "agent" ? AGENT_MODEL_OPTIONS : ASK_MODEL_OPTIONS;
      for (const option of options) {
        const providerKey = resolveTierToProviderKey(option.id, mode);
        expect(providerKey).not.toBeNull();
        expect(() =>
          myProvider.languageModel(providerKey as string),
        ).not.toThrow();
      }
    }
  });

  it("ask + agent lineups expose the same tier ids", () => {
    const askIds = new Set(ASK_MODEL_OPTIONS.map((o) => o.id));
    const agentIds = new Set(AGENT_MODEL_OPTIONS.map((o) => o.id));
    expect([...askIds].sort()).toEqual([...agentIds].sort());
  });

  it("RIFT Standard resolves to different providers per mode", () => {
    expect(resolveTierToProviderKey("rift-standard", "ask")).toBe(
      "model-gemini-3-flash",
    );
    // Agent mode → Grok 4.3 (Chinese models refuse OSINT).
    expect(resolveTierToProviderKey("rift-standard", "agent")).toBe(
      "model-grok-4.3",
    );
  });

  it("RIFT Pro and Max resolve to Grok 4.3 in both modes", () => {
    expect(resolveTierToProviderKey("rift-pro", "ask")).toBe("model-grok-4.3");
    expect(resolveTierToProviderKey("rift-pro", "agent")).toBe(
      "model-grok-4.3",
    );
    expect(resolveTierToProviderKey("rift-max", "ask")).toBe("model-grok-4.3");
    expect(resolveTierToProviderKey("rift-max", "agent")).toBe(
      "model-grok-4.3",
    );
  });

  it("'auto' returns null (caller routes to the auto router)", () => {
    expect(resolveTierToProviderKey("auto", "ask")).toBeNull();
    expect(resolveTierToProviderKey("auto", "agent")).toBeNull();
  });

  it("hover-popup descriptions are present for every RIFT tier", () => {
    const tiered = allOptions.filter((o) => o.id.startsWith("rift-"));
    expect(tiered.length).toBeGreaterThan(0);
    for (const option of tiered) {
      expect(option.description).toBeTruthy();
      expect(option.poweredBy).toBeTruthy();
    }
  });
});
