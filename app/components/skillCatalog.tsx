import {
  ShieldAlert,
  Radar,
  Bug,
  Flag,
  Code2,
  LayoutTemplate,
  Gamepad2,
  Camera,
  PenTool,
  Megaphone,
  Database,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Curated skill catalog. A skill is a loadable instruction pack; installing one
 * copies its `instructions` into the user's Convex `skills` table, and while
 * enabled it's injected into the agent as a <system-reminder> for matching-scope
 * chats. `scope` decides which mode it applies to ("all" = every mode).
 */

export type SkillScope = "all" | "security" | "app" | "image";
export type SkillCategory = "Security" | "Build" | "Image" | "General";

export interface SkillCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  scope: SkillScope;
  instructions: string;
  Icon: LucideIcon;
  bg: string;
}

export const SKILL_CATEGORY_ORDER: SkillCategory[] = [
  "Security",
  "Build",
  "Image",
  "General",
];

export const SKILL_CATALOG: SkillCatalogEntry[] = [
  // ── Security ────────────────────────────────────────────────────────────────
  {
    id: "pentest-report",
    name: "Pentest Report Writer",
    description: "Turn findings into a clean, professional security report.",
    category: "Security",
    scope: "security",
    Icon: ShieldAlert,
    bg: "#DC2626",
    instructions: `When the user asks for a report or you finish an assessment, produce a professional penetration-test report with:
- Executive Summary: business-level risk in plain language, overall posture, top risks.
- Scope & Methodology: targets, timeframe, approach (recon → enumeration → exploitation → post-exploitation).
- Findings: one per issue, each with Title, Severity (Critical/High/Medium/Low/Info) + CVSS vector, affected asset, clear reproduction steps, evidence, and concrete Remediation.
- Order findings by severity, highest first. Be precise and evidence-based; never invent results you did not observe.
- Appendix: tools used, raw output references.
Keep it factual and actionable — no filler, no emojis.`,
  },
  {
    id: "recon-methodology",
    name: "Recon Methodology",
    description: "Systematic passive → active reconnaissance workflow.",
    category: "Security",
    scope: "security",
    Icon: Radar,
    bg: "#0EA5E9",
    instructions: `Follow a disciplined recon workflow before exploitation:
1. Passive: WHOIS, DNS records, certificate transparency (crt.sh), ASN/netblocks, public sources — no direct target contact.
2. Subdomain discovery: combine multiple sources; dedupe and resolve to live hosts.
3. Service & tech fingerprinting: ports, service versions, web stacks, WAF/CDN detection.
4. Content discovery: directories, endpoints, JS analysis for hidden routes/keys.
5. Map the attack surface and prioritize by likely impact before probing.
Log what you find; only act inside the authorized scope.`,
  },
  {
    id: "web-vuln-hunting",
    name: "Web Vuln Hunting",
    description: "OWASP-driven checklist for web app testing.",
    category: "Security",
    scope: "security",
    Icon: Bug,
    bg: "#F59E0B",
    instructions: `Test web apps against the OWASP Top 10 systematically:
- Access control (IDOR, forced browsing, privilege escalation), authentication & session flaws.
- Injection (SQLi, command, template/SSTI), XSS (reflected/stored/DOM), SSRF, XXE.
- Security misconfig, sensitive data exposure, vulnerable/outdated components.
- Business-logic abuse and rate-limiting gaps.
For each candidate: confirm with a minimal safe proof-of-concept, capture evidence, rate impact, and note remediation. Prefer non-destructive validation.`,
  },
  {
    id: "ctf-playbook",
    name: "CTF Playbook",
    description: "Category-by-category approach for CTF challenges.",
    category: "Security",
    scope: "security",
    Icon: Flag,
    bg: "#8B5CF6",
    instructions: `Approach CTF challenges by category:
- Web: source review, params/cookies, auth bypass, injection, SSRF, deserialization.
- Crypto: identify the scheme, look for weak keys/nonce reuse/padding oracles; use known attacks.
- Pwn: find the bug class (overflow, UAF, format string), leak, then control flow.
- Reversing: static (disassembly/decompile) + dynamic tracing; find the check and invert it.
- Forensics/Stego: file carving, metadata, strings, hidden layers.
State your hypothesis, test fast, and extract the flag. Keep notes of what you tried.`,
  },

  // ── Build ───────────────────────────────────────────────────────────────────
  {
    id: "react-best-practices",
    name: "React / Next Best Practices",
    description: "Idiomatic, performant, accessible React & Next.js.",
    category: "Build",
    scope: "app",
    Icon: Code2,
    bg: "#3B82F6",
    instructions: `Write idiomatic React/Next:
- Small, composable components; colocate state; lift only when shared. Follow the rules of hooks.
- Prefer server components / data fetching where the framework supports it; keep client components lean.
- Avoid unnecessary re-renders (stable keys, memo only when measured). No prop-drilling walls — use composition/context sensibly.
- Accessible by default: semantic elements, labels, focus states, keyboard support, sufficient contrast.
- Type everything; handle loading/empty/error states. Ship working, not placeholder, UI.`,
  },
  {
    id: "landing-page",
    name: "Landing Page Craft",
    description: "High-converting, polished landing page structure.",
    category: "Build",
    scope: "app",
    Icon: LayoutTemplate,
    bg: "#10B981",
    instructions: `Build landing pages that convert and look premium:
- Structure: clear hero (headline stating the value + subhead + primary CTA), social proof, features-as-benefits, how-it-works, FAQ, final CTA.
- One primary action repeated; reduce choices. Strong visual hierarchy and generous whitespace.
- Polished defaults: consistent spacing scale, a restrained palette, good typography, subtle motion, responsive down to mobile.
- Fast and real: no lorem ipsum in the final pass — write concrete, benefit-led copy.`,
  },
  {
    id: "browser-game",
    name: "Browser Game Patterns",
    description: "Solid game-loop, input & state patterns for the web.",
    category: "Build",
    scope: "app",
    Icon: Gamepad2,
    bg: "#F97316",
    instructions: `For browser games:
- Use a fixed-timestep update loop with requestAnimationFrame; separate update (logic) from render.
- Centralize game state; model entities cleanly; keep a simple scene/state machine (menu → play → game over).
- Handle input via event listeners mapped to intents; support keyboard and touch.
- Canvas or a light engine (Phaser/three.js) as fits; keep assets small. Add score, restart, and basic juice (feedback, sound optional).
- Verify it actually runs and is playable before presenting it.`,
  },

  // ── Image ───────────────────────────────────────────────────────────────────
  {
    id: "photorealistic",
    name: "Photorealistic Prompting",
    description: "Write prompts that produce real-photo quality.",
    category: "Image",
    scope: "image",
    Icon: Camera,
    bg: "#6366F1",
    instructions: `For photorealistic images, write the prompt like a real photograph:
- Name a camera + lens (e.g. "shot on 85mm f/1.4"), and lighting (natural golden hour, soft studio, etc.).
- Specify depth of field, composition, angle, and realistic material/skin texture.
- Add quality anchors: "photorealistic, ultra-detailed, sharp focus, high resolution, professional photography".
- Avoid a plasticky, generic "AI art" look; describe imperfections and real-world detail.`,
  },
  {
    id: "logo-icon",
    name: "Logo & Icon Prompting",
    description: "Clean, scalable, memorable mark prompts.",
    category: "Image",
    scope: "image",
    Icon: PenTool,
    bg: "#EC4899",
    instructions: `For logos and icons:
- Favor simple, geometric, scalable marks that read at small sizes. Describe a flat/vector feel, limited palette, strong silhouette.
- Use negative space and a single clear concept; avoid photorealism, gradients-heavy clutter, or tiny detail.
- State intended use (app icon, wordmark, monochrome variant) and background (transparent/solid).`,
  },

  // ── General ─────────────────────────────────────────────────────────────────
  {
    id: "brand-voice",
    name: "Brand Voice & Writing",
    description: "Clear, concise, professional tone across replies.",
    category: "General",
    scope: "all",
    Icon: Megaphone,
    bg: "#14B8A6",
    instructions: `Write with a clear, professional voice:
- Be concise and direct; lead with the answer, then support it. Cut filler and hedging.
- Plain language over jargon; short sentences and scannable structure. No decorative emojis.
- Confident but honest: state uncertainty plainly, never overclaim.`,
  },
  {
    id: "sql-data",
    name: "SQL & Data Analysis",
    description: "Correct SQL and clear analysis of results.",
    category: "General",
    scope: "all",
    Icon: Database,
    bg: "#0D9488",
    instructions: `For data tasks:
- Write correct, readable SQL; prefer explicit columns, sensible joins, and CTEs over nested subqueries. State assumptions about the schema.
- Guard against surprises: NULL handling, duplicates, timezones, and off-by-one on ranges.
- After a query, briefly interpret the result and flag anything anomalous. Show the query you ran.`,
  },
  {
    id: "concise-expert",
    name: "Concise Expert Mode",
    description: "Terse, high-signal answers that assume expertise.",
    category: "General",
    scope: "all",
    Icon: Zap,
    bg: "#A855F7",
    instructions: `Respond like a senior expert briefing a peer:
- High signal, low noise. Skip preamble and restating the question. Give the answer, then only the reasoning that matters.
- Assume the user is technical; don't over-explain basics unless asked. Use precise terminology.
- When there's a clear best option, recommend it directly instead of listing every alternative.`,
  },
];
