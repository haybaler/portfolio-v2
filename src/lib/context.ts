/**
 * Business context engine: a medallion warehouse (bronze → silver → gold) fed by every system the business runs on,
 * with agents reading the gold layer. Table names and sample answers are illustrative; every account is invented.
 */

export type Warehouse = "BigQuery" | "Databricks";
export const WAREHOUSES: Warehouse[] = ["BigQuery", "Databricks"];

export type Layer = "bronze" | "silver" | "gold";

export interface Source {
  id: string;
  name: string;
  kind: string;
}

/** CRM and marketing names follow the visitor's stack; the rest are fixed. */
export function sources(crm: string, map: string): Source[] {
  return [
    { id: "crm", name: crm, kind: "CRM" },
    { id: "erp", name: "NetSuite", kind: "ERP" },
    { id: "map", name: map, kind: "Marketing" },
    { id: "jira", name: "Jira", kind: "Issues" },
    { id: "linear", name: "Linear", kind: "Issues" },
    { id: "confluence", name: "Confluence", kind: "Docs" },
    { id: "github", name: "GitHub", kind: "Code" },
  ];
}

export interface Table {
  id: string;
  layer: Layer;
  name: string;
  what: string;
  /** Bronze: the source it copies. Silver and gold: the tables it reads. */
  from: string[];
}

export const LAYER_RULE: Record<Layer, string> = {
  bronze: "Raw copies, exactly as each system sent them. Append-only, so history is never lost.",
  silver: "Cleaned and joined: duplicates removed, one ID per company, personal data masked.",
  gold: "Business-ready tables with a written definition for every metric. Agents read only these.",
};

export const TABLES: Table[] = [
  { id: "b_crm_accounts", layer: "bronze", name: "crm_accounts", what: "Companies as the CRM has them", from: ["crm"] },
  { id: "b_crm_contacts", layer: "bronze", name: "crm_contacts", what: "Contacts and job titles", from: ["crm"] },
  { id: "b_crm_deals", layer: "bronze", name: "crm_deals", what: "Deals, stages and amounts", from: ["crm"] },
  { id: "b_erp_customers", layer: "bronze", name: "erp_customers", what: "Billing customers", from: ["erp"] },
  { id: "b_erp_orders", layer: "bronze", name: "erp_sales_orders", what: "Orders and invoices", from: ["erp"] },
  { id: "b_map_touches", layer: "bronze", name: "marketing_touches", what: "Email, ads, events, forms", from: ["map"] },
  { id: "b_jira_issues", layer: "bronze", name: "jira_issues", what: "Issues and customer requests", from: ["jira"] },
  { id: "b_linear_issues", layer: "bronze", name: "linear_issues", what: "Issues and customer requests", from: ["linear"] },
  { id: "b_confluence_pages", layer: "bronze", name: "confluence_pages", what: "Specs, decisions, metric definitions", from: ["confluence"] },
  { id: "b_github_releases", layer: "bronze", name: "github_releases", what: "Releases and what shipped", from: ["github"] },
  { id: "b_github_prs", layer: "bronze", name: "github_pull_requests", what: "Merged work, linked to issues", from: ["github"] },

  { id: "s_accounts", layer: "silver", name: "accounts", what: "One ID per company across CRM and ERP", from: ["b_crm_accounts", "b_erp_customers"] },
  { id: "s_people", layer: "silver", name: "people", what: "Contacts with personal data masked", from: ["b_crm_contacts"] },
  { id: "s_deals", layer: "silver", name: "deals", what: "Deals on the shared account ID", from: ["b_crm_deals"] },
  { id: "s_orders", layer: "silver", name: "orders", what: "Orders on the shared account ID", from: ["b_erp_orders"] },
  { id: "s_touches", layer: "silver", name: "touches", what: "Marketing touches by account and date", from: ["b_map_touches"] },
  { id: "s_issues", layer: "silver", name: "issues", what: "Jira and Linear issues in one shape", from: ["b_jira_issues", "b_linear_issues"] },
  { id: "s_releases", layer: "silver", name: "releases", what: "Releases with the issues they closed", from: ["b_github_releases", "b_github_prs"] },
  { id: "s_docs", layer: "silver", name: "docs", what: "Pages tagged by topic and owner", from: ["b_confluence_pages"] },

  { id: "g_attribution", layer: "gold", name: "pipeline_attribution", what: "Originated, influenced or not traceable, per deal", from: ["s_deals", "s_touches", "s_accounts"] },
  { id: "g_revenue", layer: "gold", name: "revenue_vs_plan", what: "Orders against plan by territory and month", from: ["s_orders", "s_accounts"] },
  { id: "g_requests", layer: "gold", name: "requests_vs_deals", what: "Customer requests linked to open deals", from: ["s_issues", "s_deals", "s_accounts", "s_people"] },
  { id: "g_releases", layer: "gold", name: "releases_vs_pipeline", what: "What each release was followed by in pipeline", from: ["s_releases", "s_issues", "s_deals"] },
  { id: "g_definitions", layer: "gold", name: "metric_definitions", what: "The written rule behind every gold metric", from: ["s_docs"] },
];

export const tableById = (id: string) => TABLES.find((t) => t.id === id)!;

/** Fully qualified name: BigQuery dataset.table, or Databricks Unity Catalog catalog.schema.table. */
export function fqName(w: Warehouse, t: Table): string {
  return w === "BigQuery" ? `${t.layer}.${t.name}` : `main.${t.layer}.${t.name}`;
}

/** Every table a source feeds, through all layers. */
export function downstream(sourceId: string): Set<string> {
  const hit = new Set<string>();
  let frontier = TABLES.filter((t) => t.layer === "bronze" && t.from.includes(sourceId)).map((t) => t.id);
  while (frontier.length) {
    frontier.forEach((id) => hit.add(id));
    frontier = TABLES.filter((t) => !hit.has(t.id) && t.from.some((f) => frontier.includes(f))).map((t) => t.id);
  }
  return hit;
}

/** The sources a table ultimately depends on. */
export function upstreamSources(tableId: string): Set<string> {
  const t = tableById(tableId);
  if (t.layer === "bronze") return new Set(t.from);
  const out = new Set<string>();
  t.from.forEach((f) => upstreamSources(f).forEach((s) => out.add(s)));
  return out;
}

export interface Question {
  id: string;
  text: string;
  reads: string[];
  definition: string;
  sql: (w: Warehouse) => string;
  columns: string[];
  rows: string[][];
  caption: string;
  answer: string;
}

const T = (w: Warehouse, id: string) => fqName(w, tableById(id));

export const QUESTIONS: Question[] = [
  {
    id: "requests",
    text: "Which customer requests are blocking open deals?",
    reads: ["g_requests", "g_definitions"],
    definition: "A request blocks a deal when it is linked to the deal's account, is still open, and the rep has marked it as needed to close.",
    sql: (w) =>
      [
        "SELECT issue_key, issue_title, account_name, deal_stage, deal_amount",
        `FROM ${T(w, "g_requests")}`,
        "WHERE deal_status = 'open'",
        "  AND issue_status != 'done'",
        "  AND needed_to_close = TRUE",
        "ORDER BY deal_amount DESC",
        "LIMIT 5",
      ].join("\n"),
    columns: ["Request", "Account", "Deal stage", "Deal size"],
    rows: [
      ["PLAT-212 · Export results to the LIMS", "Talvisk Bio", "Evaluation", "$85k"],
      ["PLAT-198 · 21 CFR Part 11 audit trail", "Orrenby Labs", "Proposal", "$62k"],
      ["ENG-77 · Single sign-on", "Glissom Research", "Pilot", "$40k"],
    ],
    caption: "Open deals with an open, linked request the rep marked as needed to close. Invented accounts and keys.",
    answer: "Three open requests stand between the team and $187k of pipeline. The LIMS export is the largest; product has it scheduled for the next release.",
  },
  {
    id: "release",
    text: "What did the last release do for pipeline?",
    reads: ["g_releases", "g_definitions"],
    definition: "\"Followed by\" counts deals that moved forward within 30 days of a release on an account with a request it closed. It is not cause and effect.",
    sql: (w) =>
      [
        "SELECT release_name, shipped_on, requests_closed,",
        "       deals_moved_forward, pipeline_moved",
        `FROM ${T(w, "g_releases")}`,
        w === "BigQuery"
          ? "WHERE shipped_on >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)"
          : "WHERE shipped_on >= date_sub(current_date(), 30)",
        "ORDER BY shipped_on DESC",
      ].join("\n"),
    columns: ["Release", "Shipped", "Requests closed", "Deals moved forward", "Pipeline moved"],
    rows: [["v2.4", "Oct 2, 2026", "4", "6", "$310k"]],
    caption: "Deals that advanced within 30 days of the release on accounts whose requests it closed. Invented figures.",
    answer: "Release v2.4 closed four customer requests and was followed by six of those accounts' deals moving forward, $310k of pipeline. Followed by, not caused by.",
  },
  {
    id: "dark",
    text: "Which deals started in the dark funnel?",
    reads: ["g_attribution", "g_definitions"],
    definition: "Not traceable means no marketing touch was logged on the account before or during the deal.",
    sql: (w) =>
      [
        "SELECT attribution, COUNT(*) AS deals",
        `FROM ${T(w, "g_attribution")}`,
        w === "BigQuery"
          ? "WHERE created_on >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)"
          : "WHERE created_on >= add_months(current_date(), -12)",
        "GROUP BY attribution",
      ].join("\n"),
    columns: ["Attribution", "Deals"],
    rows: [["Originated", "16"], ["Influenced", "5"], ["Not traceable", "24"]],
    caption: "45 deals created in the last 12 months, grouped by the written attribution rule. Invented figures.",
    answer: "24 of 45 deals have no marketing touch the systems can see. That is the dark funnel: the well plate below shows them in blue.",
  },
];
