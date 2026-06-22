import type { ChatMode, SelectedModel } from "@/types/chat";
import { isAgentMode } from "@/lib/utils/mode-helpers";

export interface ModelOption {
  id: SelectedModel;
  label: string;
  /** Short tagline shown in the hover popup (e.g. "Maximum intelligence for complex work") */
  description?: string;
  /** "Powered by …" line shown beneath the description in the hover popup */
  poweredBy?: string;
  thinking?: boolean;
}

export const ASK_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "rift-standard",
    label: "⬡ Recon",
    description: "Baseline intelligence for reconnaissance",
    poweredBy:
      "DeepSeek V4 Flash · switches to Gemini 3 Flash for images & PDFs",
  },
  {
    id: "rift-pro",
    label: "⬢ Strike",
    description: "Advanced capability for complex operations",
    poweredBy: "Moonshot Kimi K2.7 Code",
  },
  {
    id: "rift-max",
    label: "⬥ Dominate",
    description: "Maximum power for unrestricted analysis",
    poweredBy: "xAI Grok 4.3",
  },
];

export const AGENT_MODEL_OPTIONS: ModelOption[] = [
  {
    id: "rift-standard",
    label: "⬡ Recon",
    description: "Autonomous reconnaissance & enumeration",
    poweredBy: "Moonshot Kimi K2.6",
    thinking: true,
  },
  {
    id: "rift-pro",
    label: "⬢ Strike",
    description: "Advanced autonomous exploitation & testing",
    poweredBy: "Moonshot Kimi K2.7 Code",
    thinking: true,
  },
  {
    id: "rift-max",
    label: "⬥ Dominate",
    description: "Maximum autonomous penetration power",
    poweredBy: "xAI Grok 4.3",
    thinking: true,
  },
];

export const getDefaultModelForMode = (mode: ChatMode): SelectedModel => {
  const options = isAgentMode(mode) ? AGENT_MODEL_OPTIONS : ASK_MODEL_OPTIONS;
  return options[0].id;
};
