/**
 * What "Context PaaS" means (#/context-paas): the platform end to end on a cloud of the visitor's choosing, the
 * made-up setup behind the wiring diagram, the three answers to one question, the name word by word, and the related
 * names in the order they arrived.
 * Definitions are paraphrased from the linked sources. The Q3 total comes from the same made-up sales data as the
 * board slides and the CRM chat example; the two gaps are invented to show how counting rules drift apart.
 */
import { sources, type Source } from "@/lib/context";
import { money } from "@/lib/rng";
import { makeReps, quarterByTerritory } from "@/lib/sales";

export const SETUPS = ["Tool by tool", "One platform"] as const;
export type Setup = (typeof SETUPS)[number];
export const TOOL_BY_TOOL: Setup = SETUPS[0];
export const PLATFORM: Setup = SETUPS[1];

/** Each team keeps its own assistant. Listed in the site's usual order. */
export interface Assistant {
  id: string;
  name: string;
  team: string;
}
export const ASSISTANTS: Assistant[] = [
  { id: "claude", name: "Claude", team: "Sales" },
  { id: "chatgpt", name: "ChatGPT", team: "Finance" },
  { id: "gemini", name: "Gemini", team: "Marketing" },
];

/** The systems are the business context engine's sources, so the two pages always agree. */
export const systems = (crm: string, map: string): Source[] => sources(crm, map);

export const HUB = "platform";

/** How many connections someone has to keep working. */
export function connections(setup: Setup, nSystems: number, nAssistants: number): number {
  return setup === PLATFORM ? nSystems + nAssistants : nSystems * nAssistants;
}

/** How many places a counting rule is written down. */
export const ruleCopies = (setup: Setup, nAssistants: number): number => (setup === PLATFORM ? 1 : nAssistants);

/** A way of counting a quarter's sales: the system it reads, the rule in plain words and how far it lands from the agreed number. */
interface Rule {
  reads: string;
  counted: (crm: string, map: string) => string;
  gap: number;
}

/**
 * The agreed rule the platform serves. It is how the territory dashboard, the board slides and the CRM chat example
 * already count, so this page's number matches theirs.
 */
const AGREED: Rule = { reads: "crm", counted: (crm) => `Deals marked won in ${crm}, by close date`, gap: 0 };

/** The rule each team wrote into its own assistant. Sales' is the one that became the agreed rule. */
const OWN: Record<string, Rule> = {
  claude: AGREED,
  chatgpt: { reads: "erp", counted: () => "Invoices sent from NetSuite, by invoice date", gap: -260_000 },
  gemini: { reads: "map", counted: (_crm, map) => `Won deals synced to ${map}, by sync date`, gap: -140_000 },
};

const ruleFor = (setup: Setup, assistantId: string): Rule => (setup === PLATFORM ? AGREED : OWN[assistantId]);

/** The system an assistant's answer comes from in each setup. */
export const readsFrom = (setup: Setup, assistantId: string): string => ruleFor(setup, assistantId).reads;

export const QUESTION = "What were Q3 sales?";

/** Q3 sales from the shared made-up data: the total behind the board slides and the CRM chat example. */
export const Q3_SOLD = quarterByTerritory(makeReps(), 3).reduce((sum, t) => sum + t.actual, 0);

/** "+$190k", "−$140k" or "$0": the gap to the agreed rule's number. */
export function gapText(gap: number): string {
  if (gap === 0) return "$0";
  return `${gap > 0 ? "+" : "−"}${money(Math.abs(gap))}`;
}

export interface AnswerRow {
  assistant: Assistant;
  amount: number;
  answer: string;
  counted: string;
  gap: number;
}

/** What each team's assistant answers, and the rule it counted by. */
export function answers(setup: Setup, crm: string, map: string): AnswerRow[] {
  return ASSISTANTS.map((assistant) => {
    const rule = ruleFor(setup, assistant.id);
    const amount = Q3_SOLD + rule.gap;
    return { assistant, amount, answer: money(amount), counted: rule.counted(crm, map), gap: rule.gap };
  });
}

export const distinctAnswers = (rows: AnswerRow[]): number => new Set(rows.map((r) => r.answer)).size;

export interface Wire {
  from: string;
  to: string;
  /** True for the connections the answer travelled along. */
  on: boolean;
}

/**
 * Tool by tool, every assistant is wired to every system. Through the platform, each system connects once on the way
 * in and each assistant once on the way out.
 */
export function wires(setup: Setup, systemIds: string[]): Wire[] {
  if (setup === PLATFORM) {
    return [
      ...systemIds.map((s) => ({ from: s, to: HUB, on: s === AGREED.reads })),
      ...ASSISTANTS.map((a) => ({ from: HUB, to: a.id, on: true })),
    ];
  }
  return systemIds.flatMap((s) => ASSISTANTS.map((a) => ({ from: s, to: a.id, on: readsFrom(setup, a.id) === s })));
}

export interface Link {
  label: string;
  href: string;
}

export interface Word {
  word: string;
  /** Where the word comes from, set in mono under it. */
  origin: string;
  meaning: string;
  detail: string;
  source?: Link;
  /** A page on this site, as [label, hash route]. */
  see?: [string, string];
}

export const WORDS: Word[] = [
  {
    word: "Context",
    origin: "Latin contexere: to weave together",
    meaning: "What surrounds a thing and gives it meaning.",
    detail:
      "For an AI model, that is everything it can read when it answers: the question, the data, the rules. What it can't read, it guesses.",
    source: { label: "Merriam-Webster", href: "https://www.merriam-webster.com/dictionary/context" },
  },
  {
    word: "PaaS",
    origin: "Short for platform as a service",
    meaning: "Someone else runs the platform. You build on it.",
    detail:
      "You deploy what you made and control it. You don't manage the servers, operating systems or storage underneath.",
    source: { label: "NIST SP 800-145", href: "https://csrc.nist.gov/pubs/sp/800/145/final" },
  },
  {
    word: "Context PaaS",
    origin: "Context platform as a service: my name for it",
    meaning: "A business's context, run as that kind of platform.",
    detail:
      "Teams bring the assistant, the report or the agent. The platform brings the connections, the joined data and the written rules, so nobody rebuilds them.",
    see: ["See One Built: Business Context Engine", "/work/business-context-engine"],
  },
];

/** What the platform keeps running, so the things built on it don't have to. */
export const HOLDS: { title: string; text: string }[] = [
  { title: "Connections", text: "Read-only, one per system. Nothing writes back." },
  { title: "Joined Data", text: "One record per company across every system, with personal data masked." },
  { title: "Written Rules", text: "One definition per metric, agreed with the people who own the number." },
  { title: "The Trail", text: "Every answer shows what it read and the rule it used, so anyone can check it." },
];

/**
 * The platform end to end, the first diagram on the page: what goes in, what it runs on, what comes out.
 * The shape is Google Cloud's marketing analytics diagram (ARCH_SOURCE), redrawn with the cloud left as a choice.
 * Outside the middle panel every tile names a kind of system, never a product, so the picture holds whichever cloud
 * runs it. The only names are the three clouds and the three assistants.
 */
export interface Cloud {
  /** The switch's label: the business context engine's two warehouses, then AWS. */
  name: string;
  /** The vendor, as the middle panel reads: "Runs on …". */
  vendor: string;
  /** The vendor's data warehouse. */
  warehouse: string;
  /** The vendor's platform for models and agents. */
  ai: string;
  /** One line under the diagram, in running text. */
  note: string;
}

/**
 * Product names as each vendor's own pages gave them on Nov 10, 2026. They move: Google's release notes of
 * Apr 22, 2026 renamed Vertex AI to Gemini Enterprise Agent Platform, and Databricks' docs now call its agent
 * platform Agent Bricks. Check before editing:
 * docs.cloud.google.com/gemini-enterprise-agent-platform/release-notes · cloud.google.com/bigquery ·
 * docs.databricks.com/aws/en/sql · docs.databricks.com/aws/en/agents · aws.amazon.com/redshift · aws.amazon.com/bedrock
 */
export const CLOUDS: Cloud[] = [
  {
    name: "BigQuery",
    vendor: "Google Cloud",
    warehouse: "BigQuery",
    ai: "Gemini Enterprise Agent Platform",
    note: "On Google Cloud, BigQuery is the warehouse and Gemini Enterprise Agent Platform, called Vertex AI until April 2026, is the AI platform.",
  },
  {
    name: "Databricks",
    vendor: "Databricks",
    warehouse: "Databricks SQL",
    ai: "Agent Bricks",
    note: "On Databricks, Databricks SQL is the warehouse and Agent Bricks is the AI platform.",
  },
  {
    name: "AWS",
    vendor: "AWS",
    warehouse: "Amazon Redshift",
    ai: "Amazon Bedrock",
    note: "On AWS, Amazon Redshift is the warehouse and Amazon Bedrock is the AI platform.",
  },
];
export const CLOUD_NAMES: string[] = CLOUDS.map((c) => c.name);
export const cloudByName = (name: string): Cloud => CLOUDS.find((c) => c.name === name) ?? CLOUDS[0];

/** What each of the two products is for. The roles stay put when the cloud changes. */
export const CLOUD_ROLES = { warehouse: "Data Warehouse", ai: "Models and Agents" } as const;

/** The sentence that follows every cloud's note. */
export const CLOUD_CONSTANT = "The sources, the rules and what comes out stay the same.";

export interface TileGroup {
  title: string;
  tiles: string[];
}

/** Every tile grid in the diagram is this many across, so each group's count is a multiple of it. */
export const TILE_COLS = 3;

/**
 * What goes in. The first group stands in for the vendor's own ad and analytics products in the original (search
 * ads, video, web analytics, app analytics, display ads), plus social ads. The second keeps the original's eight
 * first-party data sets in its order and adds the ERP, which the business context engine also reads.
 */
export const DATA_SOURCES: TileGroup[] = [
  { title: "Ad and Analytics Platforms", tiles: ["Search Ads", "Video", "Web Analytics", "App Analytics", "Display Ads", "Social Ads"] },
  { title: "First-Party Data Sets", tiles: ["CRM", "Content", "Social", "E-Commerce", "Customer Service", "Email", "Product", "Sales", "ERP"] },
];

/** What reads from the platform, listed down three columns: the assistants, then reports, then what runs unattended. */
export const READERS: TileGroup = {
  title: "Assistants, Reports and Agents",
  tiles: [...ASSISTANTS.map((a) => a.name), "Dashboards", "Board Slides", "Weekly Reports", "Spreadsheets", "AI Agents", "Sales Alerts"],
};

/**
 * Where the platform's output is put to work with customers: the sales and marketing systems, the ad platforms the
 * data came from, then the website and email. The diagram adds one last tile, "…", for the rest.
 */
export const CONNECTORS: TileGroup = {
  title: "Customer Connectors",
  tiles: ["CRM", "Marketing Automation", "Sales Sequences", "Search Ads", "Social Ads", "Display Ads", "Website", "Email"],
};

/** The diagram this one is drawn after. Checked Nov 10, 2026: the page still carries it. */
export const ARCH_SOURCE: Link = { label: "Google Cloud", href: "https://cloud.google.com/solutions/marketing-analytics" };

export interface Name {
  name: string;
  /** When the name arrived, as shown. */
  since: string;
  /** The same date as a sortable number (year, or year.month). */
  order: number;
  meaning: string;
  source: Link;
}

/** Related names, oldest first. Each meaning is paraphrased from its source. */
export const NAMES: Name[] = [
  {
    name: "Semantic Layer",
    since: "1990s",
    order: 1991,
    meaning: "The ancestor. Business terms such as customer and revenue are mapped onto the data once, so every dashboard counts the same way.",
    source: { label: "Wikipedia", href: "https://en.wikipedia.org/wiki/Semantic_layer" },
  },
  {
    name: "Retrieval-Augmented Generation",
    since: "2020",
    order: 2020.05,
    meaning: "An early fix. Look up passages that match the question and hand them to the model with it. It retrieves text; it doesn't settle which number counts.",
    source: { label: "arXiv 2005.11401", href: "https://arxiv.org/abs/2005.11401" },
  },
  {
    name: "Model Context Protocol",
    since: "Nov 2024",
    order: 2024.11,
    meaning: "The plug. An open standard for connecting AI assistants to tools and data. Claude, ChatGPT and Gemini all support it.",
    source: { label: "Linux Foundation", href: "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation" },
  },
  {
    name: "Context Engineering",
    since: "2025",
    order: 2025.06,
    meaning: "The practice. Deciding what a model reads before it answers: the skill prompt engineering grew into.",
    source: { label: "Anthropic", href: "https://www.anthropic.com/research/effective-context-engineering-for-ai-agents" },
  },
  {
    name: "Context Graph",
    since: "Dec 2025",
    order: 2025.12,
    meaning: "The record of decisions. Which rule applied, who approved the exception and why, kept so precedent can be searched.",
    source: { label: "Foundation Capital", href: "https://foundationcapital.com/ideas/context-graphs-ais-trillion-dollar-opportunity" },
  },
  {
    name: "Context Layer",
    since: "2026",
    order: 2026.03,
    meaning: "The analysts' name for the whole thing: a business's data, definitions, policies and decisions in one governed model that AI can reason over. Sold as a context platform.",
    source: { label: "Forrester", href: "https://www.forrester.com/blogs/the-next-evolution-of-ai-will-rely-on-context-layers/" },
  },
];

/** Columns for a grid of n cards, chosen so the last row is full. */
export const fullRowCols = (n: number): 2 | 3 | 4 => (n % 3 === 0 ? 3 : n % 4 === 0 ? 4 : 2);

/** The case studies where the idea shows up, and the part each one plays. */
export const IN_MY_WORK: { slug: string; role: string }[] = [
  { slug: "business-context-engine", role: "The Platform" },
  { slug: "erp-assistant", role: "As a Service" },
  { slug: "board-slides", role: "Built on It" },
  { slug: "crm-compliance", role: "Built on It" },
];
