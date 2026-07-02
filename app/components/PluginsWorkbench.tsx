"use client";

import { useState } from "react";
import { McpMarketplace } from "./McpMarketplace";
import { SkillsPanel } from "./SkillsPanel";

const TABS = [
  { id: "plugins", label: "Plugins" },
  { id: "skills", label: "Skills" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The Plugins/Skills workbench — a Codex-style tab switcher at the top of the
 * main content area, hosting the MCP connector marketplace and the skills
 * marketplace.
 */
export function PluginsWorkbench() {
  const [tab, setTab] = useState<TabId>("plugins");

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-5 pt-3 md:px-8">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative px-3 pb-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-foreground" />
              )}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        {tab === "plugins" ? <McpMarketplace /> : <SkillsPanel />}
      </div>
    </div>
  );
}
