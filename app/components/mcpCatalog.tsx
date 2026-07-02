/**
 * Curated MCP connector marketplace — ~100 apps across every sector, à la the
 * Codex / Cursor plugin stores.
 *
 * `auth` drives the install UX:
 *  - "none"  → one-click install, no credentials.
 *  - "token" → prompt for an API key / token, sent as `Authorization: Bearer …`.
 *  - "oauth" → needs an OAuth handshake we don't support yet → shown but gated
 *               ("Soon"). Flips to installable once OAuth connectors land.
 *
 * Only entries with a verified remote endpoint are marked none/token (live now);
 * everything else is a marketplace placeholder gated as "oauth". Anything can
 * still be added by URL via "Add a custom server".
 */

export type McpCatalogCategory =
  | "Featured"
  | "Developer Tools"
  | "Productivity"
  | "Communication"
  | "Data & Analytics"
  | "Cloud & Infrastructure"
  | "CRM & Sales"
  | "Payments & Finance"
  | "Marketing"
  | "Design"
  | "Storage & Files"
  | "Search & Web"
  | "AI & ML"
  | "Security & Identity"
  | "Productivity & Docs"
  | "Calendar"
  | "E-commerce"
  | "Social & Content";

export interface McpCatalogEntry {
  id: string;
  name: string;
  description: string;
  category: McpCatalogCategory;
  url: string;
  transport: "http" | "sse";
  auth: "none" | "token" | "oauth";
  tokenLabel?: string;
  tokenHint?: string;
  /** Brand domain — used to fetch a real logo (favicon) in the UI. */
  domain: string;
  emoji?: string;
  initials?: string;
  bg: string;
  fg?: string;
}

export const MCP_CATEGORY_ORDER: McpCatalogCategory[] = [
  "Featured",
  "Developer Tools",
  "AI & ML",
  "Data & Analytics",
  "Cloud & Infrastructure",
  "Productivity",
  "Communication",
  "Search & Web",
  "CRM & Sales",
  "Payments & Finance",
  "Marketing",
  "Storage & Files",
  "Design",
  "Security & Identity",
  "Productivity & Docs",
  "Calendar",
  "E-commerce",
  "Social & Content",
];

const PALETTE = [
  "#4F46E5",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#6366F1",
  "#06B6D4",
  "#84CC16",
  "#A855F7",
  "#3B82F6",
  "#E11D48",
  "#0D9488",
  "#DB2777",
  "#2563EB",
];

function colorFor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function initialsFor(name: string): string {
  const parts = name
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const ini =
    ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() ||
    name.slice(0, 2).toUpperCase();
  return ini;
}

type Seed = {
  name: string;
  description: string;
  category: McpCatalogCategory;
  url?: string;
  transport?: "http" | "sse";
  auth?: "none" | "token" | "oauth";
  tokenLabel?: string;
  tokenHint?: string;
  domain?: string;
  emoji?: string;
  initials?: string;
  bg?: string;
  fg?: string;
};

// Where the guessed domain (slug + ".com") is wrong, override it so the logo
// lookup resolves to the real brand.
const DOMAIN_OVERRIDES: Record<string, string> = {
  deepwiki: "deepwiki.com",
  huggingface: "huggingface.co",
  "exa-search": "exa.ai",
  notion: "notion.so",
  linear: "linear.app",
  "fly-io": "fly.io",
  railway: "railway.app",
  render: "render.com",
  terraform: "terraform.io",
  aws: "aws.amazon.com",
  "aws-s3": "aws.amazon.com",
  "google-cloud": "cloud.google.com",
  azure: "azure.microsoft.com",
  "google-drive": "google.com",
  "google-docs": "docs.google.com",
  "google-sheets": "sheets.google.com",
  "google-calendar": "calendar.google.com",
  "google-maps": "maps.google.com",
  "microsoft-teams": "microsoft.com",
  onedrive: "microsoft.com",
  outlook: "outlook.com",
  "hashicorp-vault": "hashicorp.com",
  "x-twitter": "x.com",
  square: "squareup.com",
  quickbooks: "quickbooks.intuit.com",
  "zoho-crm": "zoho.com",
  "customer-io": "customer.io",
  sanity: "sanity.io",
  wordpress: "wordpress.com",
  datadog: "datadoghq.com",
  snyk: "snyk.io",
  playwright: "playwright.dev",
  jenkins: "jenkins.io",
  semgrep: "semgrep.dev",
  elevenlabs: "elevenlabs.io",
  "stability-ai": "stability.ai",
  weaviate: "weaviate.io",
  qdrant: "qdrant.tech",
  pinecone: "pinecone.io",
  neon: "neon.tech",
  redis: "redis.io",
  kubernetes: "kubernetes.io",
  postgresql: "postgresql.org",
  bitbucket: "bitbucket.org",
  jira: "atlassian.com",
  confluence: "atlassian.com",
  telegram: "telegram.org",
  firecrawl: "firecrawl.dev",
  tavily: "tavily.com",
  perplexity: "perplexity.ai",
  coda: "coda.io",
  height: "height.app",
  obsidian: "obsidian.md",
  "cal-com": "cal.com",
  context7: "context7.com",
  "replicate-flux": "replicate.com",
  gitbook: "gitbook.com",
};

function guessDomain(id: string): string {
  return DOMAIN_OVERRIDES[id] ?? `${id.replace(/-/g, "")}.com`;
}

function def(seed: Seed): McpCatalogEntry {
  const id = seed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return {
    id,
    name: seed.name,
    description: seed.description,
    category: seed.category,
    url: seed.url ?? "",
    transport: seed.transport ?? "http",
    auth: seed.auth ?? "oauth",
    tokenLabel: seed.tokenLabel,
    tokenHint: seed.tokenHint,
    domain: seed.domain ?? guessDomain(id),
    emoji: seed.emoji,
    initials: seed.initials ?? initialsFor(seed.name),
    bg: seed.bg ?? colorFor(id),
    fg: seed.fg,
  };
}

export const MCP_CATALOG: McpCatalogEntry[] = [
  // ── Featured (live + headliners) ───────────────────────────────────────────
  def({
    name: "DeepWiki",
    description: "Ask questions about any public GitHub repo.",
    category: "Featured",
    url: "https://mcp.deepwiki.com/mcp",
    auth: "none",
    bg: "#4F46E5",
  }),
  def({
    name: "GitHub",
    description: "Triage PRs, issues, browse code & CI.",
    category: "Featured",
    url: "https://api.githubcopilot.com/mcp/",
    auth: "token",
    tokenLabel: "GitHub personal access token",
    tokenHint:
      "Create a fine-grained PAT at github.com/settings/tokens with the scopes you want RIFT to use.",
    initials: "GH",
    bg: "#111111",
  }),
  def({
    name: "Context7",
    description: "Up-to-date docs & code examples for any library.",
    category: "Featured",
    url: "https://mcp.context7.com/mcp",
    auth: "none",
    bg: "#0EA5E9",
  }),
  def({
    name: "Hugging Face",
    description: "Search models, datasets, papers & Spaces.",
    category: "Featured",
    url: "https://huggingface.co/mcp",
    auth: "token",
    tokenLabel: "Hugging Face access token",
    tokenHint:
      "Optional — only needed for private content. huggingface.co/settings/tokens.",
    emoji: "🤗",
    bg: "#FFD21E",
    fg: "#111111",
  }),
  def({
    name: "Exa Search",
    description: "Neural web search built for AI agents.",
    category: "Featured",
    url: "https://mcp.exa.ai/mcp",
    auth: "token",
    tokenLabel: "Exa API key",
    tokenHint: "Get a key at dashboard.exa.ai.",
    bg: "#1D4ED8",
  }),
  def({
    name: "Stripe",
    description: "Query customers, payments & invoices.",
    category: "Featured",
    url: "https://mcp.stripe.com",
    auth: "token",
    tokenLabel: "Stripe restricted API key",
    tokenHint:
      "Use a read-only restricted key (rk_…) from the Stripe dashboard.",
    bg: "#635BFF",
  }),

  // ── Developer Tools ────────────────────────────────────────────────────────
  def({
    name: "GitLab",
    description: "Repos, merge requests & pipelines.",
    category: "Developer Tools",
    bg: "#FC6D26",
  }),
  def({
    name: "Bitbucket",
    description: "Repos, PRs & pipelines.",
    category: "Developer Tools",
    bg: "#0052CC",
  }),
  def({
    name: "Sentry",
    description: "Inspect errors, issues & releases.",
    category: "Developer Tools",
    url: "https://mcp.sentry.dev/mcp",
    bg: "#362D59",
  }),
  def({
    name: "Jira",
    description: "Issues, sprints & boards.",
    category: "Developer Tools",
    bg: "#0052CC",
  }),
  def({
    name: "Postman",
    description: "Collections, APIs & environments.",
    category: "Developer Tools",
    bg: "#FF6C37",
  }),
  def({
    name: "Vercel",
    description: "Deployments, projects & logs.",
    category: "Developer Tools",
    initials: "▲",
    bg: "#000000",
  }),
  def({
    name: "Netlify",
    description: "Sites, deploys & functions.",
    category: "Developer Tools",
    bg: "#00AD9F",
  }),
  def({
    name: "CircleCI",
    description: "Pipelines, jobs & artifacts.",
    category: "Developer Tools",
    bg: "#161616",
  }),
  def({
    name: "Jenkins",
    description: "Builds, jobs & pipelines.",
    category: "Developer Tools",
    bg: "#D33833",
  }),
  def({
    name: "Docker",
    description: "Images, containers & registries.",
    category: "Developer Tools",
    bg: "#2496ED",
  }),
  def({
    name: "Kubernetes",
    description: "Clusters, pods & deployments.",
    category: "Developer Tools",
    bg: "#326CE5",
  }),
  def({
    name: "Sourcegraph",
    description: "Search & navigate large codebases.",
    category: "Developer Tools",
    bg: "#A112FF",
  }),
  def({
    name: "Snyk",
    description: "Find & fix vulnerabilities in deps.",
    category: "Developer Tools",
    bg: "#4C4A73",
  }),
  def({
    name: "Playwright",
    description: "Drive a real browser for tests.",
    category: "Developer Tools",
    bg: "#2EAD33",
  }),
  def({
    name: "Raygun",
    description: "Crash & performance monitoring.",
    category: "Developer Tools",
    bg: "#F4338F",
  }),
  def({
    name: "Datadog",
    description: "Metrics, traces & monitors.",
    category: "Developer Tools",
    bg: "#632CA6",
  }),
  def({
    name: "PagerDuty",
    description: "Incidents, on-call & alerts.",
    category: "Developer Tools",
    bg: "#06AC38",
  }),
  def({
    name: "Grafana",
    description: "Dashboards, metrics & alerts.",
    category: "Developer Tools",
    bg: "#F46800",
  }),

  // ── AI & ML ────────────────────────────────────────────────────────────────
  def({
    name: "OpenAI",
    description: "Models, files & fine-tunes.",
    category: "AI & ML",
    bg: "#10A37F",
  }),
  def({
    name: "Replicate",
    description: "Run & manage open models.",
    category: "AI & ML",
    bg: "#000000",
  }),
  def({
    name: "ElevenLabs",
    description: "Text-to-speech & voice cloning.",
    category: "AI & ML",
    bg: "#111111",
  }),
  def({
    name: "Pinecone",
    description: "Vector database for retrieval.",
    category: "AI & ML",
    bg: "#000000",
  }),
  def({
    name: "Weaviate",
    description: "Open-source vector database.",
    category: "AI & ML",
    bg: "#FF6D1F",
  }),
  def({
    name: "Qdrant",
    description: "Vector search engine.",
    category: "AI & ML",
    bg: "#DC244C",
  }),
  def({
    name: "Cohere",
    description: "Embeddings, rerank & generate.",
    category: "AI & ML",
    bg: "#39594C",
  }),
  def({
    name: "Stability AI",
    description: "Image & media generation.",
    category: "AI & ML",
    bg: "#7A2BFF",
  }),
  def({
    name: "Replicate Flux",
    description: "FLUX image models.",
    category: "AI & ML",
    bg: "#1F1F1F",
  }),

  // ── Data & Analytics ───────────────────────────────────────────────────────
  def({
    name: "PostgreSQL",
    description: "Query & inspect Postgres databases.",
    category: "Data & Analytics",
    bg: "#336791",
  }),
  def({
    name: "MySQL",
    description: "Query & inspect MySQL databases.",
    category: "Data & Analytics",
    bg: "#00758F",
  }),
  def({
    name: "MongoDB",
    description: "Query collections & documents.",
    category: "Data & Analytics",
    bg: "#47A248",
  }),
  def({
    name: "Supabase",
    description: "Postgres, auth & storage.",
    category: "Data & Analytics",
    bg: "#3ECF8E",
    fg: "#111111",
  }),
  def({
    name: "Snowflake",
    description: "Warehouse queries & schemas.",
    category: "Data & Analytics",
    bg: "#29B5E8",
  }),
  def({
    name: "BigQuery",
    description: "Run queries on Google BigQuery.",
    category: "Data & Analytics",
    bg: "#669DF6",
  }),
  def({
    name: "Redis",
    description: "Keys, streams & pub/sub.",
    category: "Data & Analytics",
    bg: "#FF4438",
  }),
  def({
    name: "Neon",
    description: "Serverless Postgres branches.",
    category: "Data & Analytics",
    bg: "#00E699",
    fg: "#111111",
  }),
  def({
    name: "PlanetScale",
    description: "Serverless MySQL platform.",
    category: "Data & Analytics",
    bg: "#111111",
  }),
  def({
    name: "Databricks",
    description: "Lakehouse jobs & notebooks.",
    category: "Data & Analytics",
    bg: "#FF3621",
  }),
  def({
    name: "ClickHouse",
    description: "Fast columnar analytics.",
    category: "Data & Analytics",
    bg: "#FFCC01",
    fg: "#111111",
  }),
  def({
    name: "Metabase",
    description: "Dashboards & questions.",
    category: "Data & Analytics",
    bg: "#509EE3",
  }),
  def({
    name: "Amplitude",
    description: "Product analytics & events.",
    category: "Data & Analytics",
    bg: "#1456FF",
  }),
  def({
    name: "Mixpanel",
    description: "Funnels, cohorts & events.",
    category: "Data & Analytics",
    bg: "#7856FF",
  }),

  // ── Cloud & Infrastructure ─────────────────────────────────────────────────
  def({
    name: "AWS",
    description: "EC2, S3, Lambda & more.",
    category: "Cloud & Infrastructure",
    bg: "#FF9900",
    fg: "#111111",
  }),
  def({
    name: "Google Cloud",
    description: "GCP compute, storage & data.",
    category: "Cloud & Infrastructure",
    bg: "#4285F4",
  }),
  def({
    name: "Azure",
    description: "Microsoft cloud resources.",
    category: "Cloud & Infrastructure",
    bg: "#0078D4",
  }),
  def({
    name: "Cloudflare",
    description: "DNS, Workers, R2 & KV.",
    category: "Cloud & Infrastructure",
    url: "https://docs.mcp.cloudflare.com",
    bg: "#F38020",
  }),
  def({
    name: "DigitalOcean",
    description: "Droplets, apps & databases.",
    category: "Cloud & Infrastructure",
    bg: "#0080FF",
  }),
  def({
    name: "Railway",
    description: "Deploy services & databases.",
    category: "Cloud & Infrastructure",
    bg: "#0B0D0E",
  }),
  def({
    name: "Fly.io",
    description: "Run apps close to users.",
    category: "Cloud & Infrastructure",
    bg: "#8B5CF6",
  }),
  def({
    name: "Render",
    description: "Web services & cron jobs.",
    category: "Cloud & Infrastructure",
    bg: "#46E3B7",
    fg: "#111111",
  }),
  def({
    name: "Terraform",
    description: "Infrastructure as code.",
    category: "Cloud & Infrastructure",
    bg: "#7B42BC",
  }),
  def({
    name: "Pulumi",
    description: "IaC in real languages.",
    category: "Cloud & Infrastructure",
    bg: "#8A3391",
  }),

  // ── Productivity ───────────────────────────────────────────────────────────
  def({
    name: "Notion",
    description: "Search & edit your workspace.",
    category: "Productivity",
    url: "https://mcp.notion.com/mcp",
    initials: "N",
    bg: "#111111",
  }),
  def({
    name: "Linear",
    description: "Create & track issues.",
    category: "Productivity",
    url: "https://mcp.linear.app/sse",
    transport: "sse",
    bg: "#5E6AD2",
  }),
  def({
    name: "Asana",
    description: "Tasks, projects & portfolios.",
    category: "Productivity",
    bg: "#F06A6A",
  }),
  def({
    name: "Trello",
    description: "Boards, lists & cards.",
    category: "Productivity",
    bg: "#0079BF",
  }),
  def({
    name: "ClickUp",
    description: "Tasks, docs & goals.",
    category: "Productivity",
    bg: "#7B68EE",
  }),
  def({
    name: "Todoist",
    description: "Tasks & projects.",
    category: "Productivity",
    bg: "#E44332",
  }),
  def({
    name: "Monday",
    description: "Work OS boards & automations.",
    category: "Productivity",
    bg: "#FF3D57",
  }),
  def({
    name: "Airtable",
    description: "Bases, tables & records.",
    category: "Productivity",
    bg: "#18BFFF",
  }),
  def({
    name: "Coda",
    description: "Docs, tables & automations.",
    category: "Productivity",
    bg: "#F46A54",
  }),
  def({
    name: "Height",
    description: "Autonomous project tracking.",
    category: "Productivity",
    bg: "#6C5CE7",
  }),
  def({
    name: "Miro",
    description: "Whiteboards & diagrams.",
    category: "Productivity",
    bg: "#FFD02F",
    fg: "#111111",
  }),
  def({
    name: "Obsidian",
    description: "Search your notes vault.",
    category: "Productivity",
    bg: "#7C3AED",
  }),

  // ── Communication ──────────────────────────────────────────────────────────
  def({
    name: "Slack",
    description: "Read & post across channels.",
    category: "Communication",
    bg: "#4A154B",
  }),
  def({
    name: "Discord",
    description: "Servers, channels & messages.",
    category: "Communication",
    bg: "#5865F2",
  }),
  def({
    name: "Microsoft Teams",
    description: "Chats, channels & meetings.",
    category: "Communication",
    bg: "#6264A7",
  }),
  def({
    name: "Telegram",
    description: "Send & read messages.",
    category: "Communication",
    bg: "#26A5E4",
  }),
  def({
    name: "Twilio",
    description: "SMS, voice & WhatsApp.",
    category: "Communication",
    bg: "#F22F46",
  }),
  def({
    name: "Intercom",
    description: "Conversations & contacts.",
    category: "Communication",
    bg: "#1F8DED",
  }),
  def({
    name: "Zendesk",
    description: "Tickets & help center.",
    category: "Communication",
    bg: "#03363D",
  }),
  def({
    name: "Front",
    description: "Shared inbox & comms.",
    category: "Communication",
    bg: "#A857F6",
  }),
  def({
    name: "Gmail",
    description: "Read, draft & send email.",
    category: "Communication",
    bg: "#EA4335",
  }),
  def({
    name: "Outlook",
    description: "Email & calendar.",
    category: "Communication",
    bg: "#0078D4",
  }),

  // ── Search & Web ───────────────────────────────────────────────────────────
  def({
    name: "Brave Search",
    description: "Privacy-first web search.",
    category: "Search & Web",
    bg: "#FB542B",
  }),
  def({
    name: "Tavily",
    description: "Search API for agents.",
    category: "Search & Web",
    bg: "#1A56DB",
  }),
  def({
    name: "Perplexity",
    description: "Answer engine search.",
    category: "Search & Web",
    bg: "#20808D",
  }),
  def({
    name: "Firecrawl",
    description: "Crawl & scrape any site.",
    category: "Search & Web",
    bg: "#F97316",
  }),
  def({
    name: "Apify",
    description: "Run scrapers & automations.",
    category: "Search & Web",
    bg: "#00B04F",
  }),
  def({
    name: "Browserbase",
    description: "Headless browsers for agents.",
    category: "Search & Web",
    bg: "#F59E0B",
    fg: "#111111",
  }),
  def({
    name: "SerpAPI",
    description: "Structured search results.",
    category: "Search & Web",
    bg: "#3A6EA5",
  }),
  def({
    name: "Google Maps",
    description: "Places, routes & geocoding.",
    category: "Search & Web",
    bg: "#34A853",
  }),

  // ── CRM & Sales ────────────────────────────────────────────────────────────
  def({
    name: "Salesforce",
    description: "Accounts, leads & opps.",
    category: "CRM & Sales",
    bg: "#00A1E0",
  }),
  def({
    name: "HubSpot",
    description: "CRM, contacts & deals.",
    category: "CRM & Sales",
    bg: "#FF7A59",
  }),
  def({
    name: "Pipedrive",
    description: "Pipelines & deals.",
    category: "CRM & Sales",
    bg: "#017737",
  }),
  def({
    name: "Attio",
    description: "Modern relationship CRM.",
    category: "CRM & Sales",
    bg: "#111111",
  }),
  def({
    name: "Close",
    description: "Inside-sales CRM.",
    category: "CRM & Sales",
    bg: "#1A91FF",
  }),
  def({
    name: "Zoho CRM",
    description: "Contacts, deals & workflows.",
    category: "CRM & Sales",
    bg: "#E42527",
  }),

  // ── Payments & Finance ─────────────────────────────────────────────────────
  def({
    name: "PayPal",
    description: "Payments, orders & payouts.",
    category: "Payments & Finance",
    bg: "#003087",
  }),
  def({
    name: "Square",
    description: "Payments, catalog & orders.",
    category: "Payments & Finance",
    bg: "#111111",
  }),
  def({
    name: "Plaid",
    description: "Bank accounts & transactions.",
    category: "Payments & Finance",
    bg: "#000000",
  }),
  def({
    name: "QuickBooks",
    description: "Invoices, bills & reports.",
    category: "Payments & Finance",
    bg: "#2CA01C",
  }),
  def({
    name: "Xero",
    description: "Accounting & invoicing.",
    category: "Payments & Finance",
    bg: "#13B5EA",
  }),
  def({
    name: "Brex",
    description: "Cards, spend & expenses.",
    category: "Payments & Finance",
    bg: "#111111",
  }),
  def({
    name: "Mercury",
    description: "Banking for startups.",
    category: "Payments & Finance",
    bg: "#5266EB",
  }),
  def({
    name: "Ramp",
    description: "Corporate cards & spend.",
    category: "Payments & Finance",
    bg: "#E1FF6B",
    fg: "#111111",
  }),

  // ── Marketing ──────────────────────────────────────────────────────────────
  def({
    name: "Mailchimp",
    description: "Campaigns & audiences.",
    category: "Marketing",
    bg: "#FFE01B",
    fg: "#111111",
  }),
  def({
    name: "SendGrid",
    description: "Transactional & bulk email.",
    category: "Marketing",
    bg: "#1A82E2",
  }),
  def({
    name: "Customer.io",
    description: "Lifecycle messaging.",
    category: "Marketing",
    bg: "#7131FF",
  }),
  def({
    name: "Klaviyo",
    description: "Email & SMS marketing.",
    category: "Marketing",
    bg: "#111111",
  }),
  def({
    name: "Webflow",
    description: "CMS items & sites.",
    category: "Marketing",
    bg: "#146EF5",
  }),
  def({
    name: "Contentful",
    description: "Headless content platform.",
    category: "Marketing",
    bg: "#2478CC",
  }),
  def({
    name: "Sanity",
    description: "Structured content CMS.",
    category: "Marketing",
    bg: "#F03E2F",
  }),
  def({
    name: "WordPress",
    description: "Posts, pages & media.",
    category: "Marketing",
    bg: "#21759B",
  }),

  // ── Storage & Files ────────────────────────────────────────────────────────
  def({
    name: "Google Drive",
    description: "Drive, Docs & Sheets.",
    category: "Storage & Files",
    bg: "#1A73E8",
  }),
  def({
    name: "Dropbox",
    description: "Files & shared folders.",
    category: "Storage & Files",
    bg: "#0061FF",
  }),
  def({
    name: "Box",
    description: "Enterprise file storage.",
    category: "Storage & Files",
    bg: "#0061D5",
  }),
  def({
    name: "OneDrive",
    description: "Microsoft file storage.",
    category: "Storage & Files",
    bg: "#0078D4",
  }),
  def({
    name: "AWS S3",
    description: "Object storage buckets.",
    category: "Storage & Files",
    bg: "#569A31",
  }),

  // ── Design ─────────────────────────────────────────────────────────────────
  def({
    name: "Figma",
    description: "Files, frames & components.",
    category: "Design",
    bg: "#F24E1E",
  }),
  def({
    name: "Framer",
    description: "Sites & design tools.",
    category: "Design",
    bg: "#0055FF",
  }),
  def({
    name: "Canva",
    description: "Designs & brand assets.",
    category: "Design",
    bg: "#00C4CC",
  }),

  // ── Security & Identity ────────────────────────────────────────────────────
  def({
    name: "Semgrep",
    description: "Static analysis & SAST.",
    category: "Security & Identity",
    bg: "#1A1F36",
  }),
  def({
    name: "1Password",
    description: "Secrets & vault items.",
    category: "Security & Identity",
    bg: "#1A8CFF",
  }),
  def({
    name: "HashiCorp Vault",
    description: "Secrets management.",
    category: "Security & Identity",
    bg: "#FFD814",
    fg: "#111111",
  }),
  def({
    name: "Okta",
    description: "Identity & SSO.",
    category: "Security & Identity",
    bg: "#007DC1",
  }),
  def({
    name: "Auth0",
    description: "Authentication platform.",
    category: "Security & Identity",
    bg: "#EB5424",
  }),

  // ── Productivity & Docs ────────────────────────────────────────────────────
  def({
    name: "Confluence",
    description: "Wiki spaces & pages.",
    category: "Productivity & Docs",
    bg: "#172B4D",
  }),
  def({
    name: "GitBook",
    description: "Product docs & knowledge.",
    category: "Productivity & Docs",
    bg: "#3884FF",
  }),
  def({
    name: "Google Docs",
    description: "Documents & comments.",
    category: "Productivity & Docs",
    bg: "#4285F4",
  }),
  def({
    name: "Google Sheets",
    description: "Spreadsheets & cells.",
    category: "Productivity & Docs",
    bg: "#0F9D58",
  }),

  // ── Calendar ───────────────────────────────────────────────────────────────
  def({
    name: "Google Calendar",
    description: "Events & scheduling.",
    category: "Calendar",
    bg: "#4285F4",
  }),
  def({
    name: "Cal.com",
    description: "Open scheduling.",
    category: "Calendar",
    bg: "#111111",
  }),
  def({
    name: "Calendly",
    description: "Meeting scheduling.",
    category: "Calendar",
    bg: "#006BFF",
  }),

  // ── E-commerce ─────────────────────────────────────────────────────────────
  def({
    name: "Shopify",
    description: "Products, orders & customers.",
    category: "E-commerce",
    bg: "#95BF47",
  }),
  def({
    name: "WooCommerce",
    description: "WordPress storefronts.",
    category: "E-commerce",
    bg: "#96588A",
  }),
  def({
    name: "BigCommerce",
    description: "Catalog & orders.",
    category: "E-commerce",
    bg: "#121118",
  }),
  def({
    name: "Squarespace",
    description: "Sites & commerce.",
    category: "E-commerce",
    bg: "#111111",
  }),

  // ── Social & Content ───────────────────────────────────────────────────────
  def({
    name: "X (Twitter)",
    description: "Post & read tweets.",
    category: "Social & Content",
    initials: "X",
    bg: "#000000",
  }),
  def({
    name: "Reddit",
    description: "Subreddits & posts.",
    category: "Social & Content",
    bg: "#FF4500",
  }),
  def({
    name: "LinkedIn",
    description: "Posts & company pages.",
    category: "Social & Content",
    bg: "#0A66C2",
  }),
  def({
    name: "YouTube",
    description: "Videos, channels & stats.",
    category: "Social & Content",
    bg: "#FF0000",
  }),
  def({
    name: "Medium",
    description: "Stories & publications.",
    category: "Social & Content",
    initials: "M",
    bg: "#000000",
  }),
];

/** Normalize a URL for "is this catalog entry already installed?" matching. */
export function normalizeMcpUrl(raw: string): string {
  try {
    return new URL(raw).toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return raw.trim().replace(/\/$/, "").toLowerCase();
  }
}
