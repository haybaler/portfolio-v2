/**
 * What each case-study card's preview shows: one label, one number, one line and a short list.
 * Every figure is read from the case study's own made-up data, so a card can never disagree with its example.
 */
import { DEALS, byChannel } from "@/lib/attribution";
import { audience, CONDITIONS } from "@/lib/audiences";
import { buildDeck } from "@/lib/board";
import { DRAFT, ON_BRAND, checkBrand } from "@/lib/brand";
import { sources } from "@/lib/context";
import { drivers } from "@/lib/drivers";
import { ASSISTANTS, Q3_SOLD } from "@/lib/meaning";
import { money } from "@/lib/rng";
import { AS_OF, TERRITORIES, makeReps, rollup } from "@/lib/sales";
import { HOT, QUEUE, VISITS, intent } from "@/lib/visitors";
import { CHANGES, FORMS, KEPT, MENTIONS, QUOTE_FIELDS, RENAME, WORST_FIELD, leaveRate } from "@/lib/website";

export interface ThumbRow {
  name: string;
  /** Right-aligned text: a figure or a status word. */
  display: string;
  /** 0–1: draws a bar. Left out where the row has no size. */
  share?: number;
  /** The one highlighted row. */
  hi?: boolean;
  tone?: "good" | "bad";
}

export interface ThumbData {
  /** The window's title bar. */
  title: string;
  label: string;
  value: string;
  /** One line of running text under the number. */
  note: string;
  sideLabel: string;
  rows: ThumbRow[];
}

const whole = (n: number) => n.toLocaleString("en-US");
const pct = (n: number) => `${Math.round(n * 100)}%`;
const signed = (ratio: number) => `${ratio < 0 ? "−" : "+"}${Math.abs(Math.round(ratio * 100))}%`;
/** Bars are drawn against the largest row. */
const shares = <T,>(items: T[], size: (t: T) => number) => {
  const max = Math.max(...items.map(size));
  return (t: T) => (max === 0 ? 0 : size(t) / max);
};

function boardSlides(): ThumbData {
  const deck = buildDeck(AS_OF, 2);
  const share = shares(deck.regions, (r) => r.pctToPlan);
  const top = Math.max(...deck.regions.map((r) => r.pctToPlan));
  return {
    title: `${deck.quarter} 2026 · Quarterly Business Review`,
    label: "Sales vs Plan",
    value: `${deck.salesPct}%`,
    note: `MQLs reached ${deck.mqlPct}% of goal.`,
    sideLabel: "By Region",
    rows: deck.regions.map((r) => ({ name: r.territory, display: `${r.pctToPlan}%`, share: share(r), hi: r.pctToPlan === top })),
  };
}

function businessContextEngine(): ThumbData {
  return {
    title: "Business Context Engine",
    label: "Agreed Answer · Q3 Sales",
    value: money(Q3_SOLD),
    note: "One rule, for people and AI agents.",
    sideLabel: "Sources, Read-Only",
    rows: sources("Salesforce", "HubSpot").slice(0, 5).map((s) => ({ name: s.name, display: s.kind })),
  };
}

function erpAssistant(): ThumbData {
  return {
    title: "Chat with Your CRM",
    label: "What Were Q3 Sales?",
    value: money(Q3_SOLD),
    note: "Closed-won, by close date.",
    sideLabel: "Same Answer Everywhere",
    rows: ASSISTANTS.map((a) => ({ name: a.name, display: money(Q3_SOLD) })),
  };
}

function attribution(): ThumbData {
  const w = byChannel(DEALS, "W-shaped");
  const first = byChannel(DEALS, "First touch");
  const web = w.find((r) => r.channel === "Webinars")!;
  const share = shares(w, (r) => r.revenue);
  return {
    title: "CRM Lifecycle and Attribution",
    label: "Webinar ROI · W-Shaped",
    value: signed(web.roi),
    note: `${signed(first.find((r) => r.channel === "Webinars")!.roi)} under first touch.`,
    sideLabel: "Revenue by Channel",
    rows: w.map((r) => ({ name: r.channel, display: money(r.revenue), share: share(r), hi: r.channel === "Webinars" })),
  };
}

function visitorId(): ThumbData {
  const scored = [...QUEUE, ...VISITS].map((v) => ({ v, ...intent(v) }));
  const best = scored.reduce((a, b) => (b.score > a.score ? b : a));
  const tiers = (["Hot", "Warm", "Cold"] as const).map((tier) => ({ tier, n: scored.filter((s) => s.tier === tier).length }));
  const share = shares(tiers, (t) => t.n);
  return {
    title: "Website Visitor Identification",
    label: `Hottest Visitor · ${best.v.company}`,
    value: String(best.score),
    note: `Intent score. Hot starts at ${HOT}.`,
    sideLabel: `${scored.length} Visitors by Intent`,
    rows: tiers.map((t) => ({ name: t.tier, display: String(t.n), share: share(t), hi: t.tier === "Hot" })),
  };
}

function crmCompliance(): ThumbData {
  const d = drivers();
  const share = shares(d.rows, (r) => r.importance);
  const short: Record<string, string> = { meetings: "Meetings", emails: "Emails", events: "Events", fast: "Fast Reply", calls: "Calls" };
  return {
    title: "CRM Compliance Report",
    label: "Signals the Test Verified",
    value: `${d.rows.filter((r) => r.verified).length} of ${d.rows.length}`,
    note: `${d.n} accounts, p < 0.05.`,
    sideLabel: "Model Ranking, Then the Test",
    rows: d.rows.map((r) => ({ name: short[r.key] ?? r.name, display: r.verified ? "Verified" : "Rejected", share: share(r), tone: r.verified ? "good" : "bad" })),
  };
}

function salesDashboard(): ThumbData {
  const reps = makeReps();
  const prorated = rollup(reps, "MTD", "All");
  const full = rollup(reps, "MTD", "All", AS_OF, "full");
  const share = shares(prorated.rows, (r) => r.pctToPlan);
  const top = Math.max(...prorated.rows.map((r) => r.pctToPlan));
  return {
    title: "Territory Dashboard · Oct 21",
    label: "% to Plan · Prorated by Day",
    value: `${prorated.total.pctToPlan}%`,
    note: `${full.total.pctToPlan}% under the full-month rule.`,
    sideLabel: "By Territory",
    rows: prorated.rows.map((r) => ({ name: r.label, display: `${r.pctToPlan}%`, share: share(r), hi: r.pctToPlan === top })),
  };
}

function hcpAudiences(): ThumbData {
  const c = CONDITIONS[0];
  const a = audience(c.code, [...TERRITORIES]);
  const share = shares(a.rows, (r) => r.hcps);
  return {
    title: "HCP Audiences · Aggregates Only",
    label: `Audience · ${c.code}`,
    value: whole(a.total),
    note: "Clinicians, all territories.",
    sideLabel: "By Specialty",
    rows: a.rows.map((r, i) => ({ name: r.specialty, display: whole(r.hcps), share: share(r), hi: i === 0 })),
  };
}

/** Short names for the six brand rules, in checkBrand's order (a test checks the count). */
export const BRAND_CHECKS = ["Palette", "Typeface", "Headline Length", "Banned Words", "Claims", "Research Use Line"];

function brandCollateral(): ThumbData {
  const passed = checkBrand(ON_BRAND);
  const draft = checkBrand(DRAFT);
  const ok = (cs: typeof passed) => cs.filter((x) => x.pass).length;
  return {
    title: "Brand Collateral Review",
    label: "Brand Checks Passed",
    value: `${ok(passed)} of ${passed.length}`,
    note: `The first draft passed ${ok(draft)}.`,
    sideLabel: "Quillmere Bio · Brand File",
    rows: passed.map((x, i) => ({ name: BRAND_CHECKS[i] ?? x.rule, display: x.pass ? "Passed" : "Failed", tone: x.pass ? "good" : "bad" })),
  };
}

function websiteAi(): ThumbData {
  return {
    title: "Website Content Updates",
    label: `${RENAME.from} → ${RENAME.to}`,
    value: `${CHANGES.length} of ${MENTIONS.length}`,
    note: "Mentions changed across the site.",
    sideLabel: "What Happened to Each",
    rows: [
      { name: "Found", display: String(MENTIONS.length) },
      { name: "Changed", display: String(CHANGES.length), tone: "good" },
      { name: "Kept as Written", display: String(KEPT.length) },
    ],
  };
}

function websiteCro(): ThumbData {
  const form = FORMS.find((f) => f.name === "Request a quote")!;
  const steps = [
    { name: "Viewed", n: form.views },
    { name: "Started", n: form.started },
    { name: "Submitted", n: form.submitted },
  ];
  const share = shares(steps, (s) => s.n);
  return {
    title: "Website Conversion Rate Optimization",
    label: "Quote Form · Conversion",
    value: `${((form.submitted / form.views) * 100).toFixed(1)}%`,
    note: `${pct(leaveRate(WORST_FIELD))} leave at ${QUOTE_FIELDS[WORST_FIELD].field}.`,
    sideLabel: "Form Funnel",
    rows: steps.map((s, i) => ({ name: s.name, display: whole(s.n), share: share(s), hi: i === steps.length - 1 })),
  };
}

const BUILD: Record<string, () => ThumbData> = {
  "board-slides": boardSlides,
  "business-context-engine": businessContextEngine,
  "erp-assistant": erpAssistant,
  attribution,
  "visitor-id": visitorId,
  "crm-compliance": crmCompliance,
  "sales-dashboard": salesDashboard,
  "hcp-audiences": hcpAudiences,
  "brand-collateral": brandCollateral,
  "website-ai": websiteAi,
  "website-cro": websiteCro,
};

const cache = new Map<string, ThumbData>();
export const THUMB_SLUGS = Object.keys(BUILD);
export function thumbData(slug: string): ThumbData | null {
  if (!BUILD[slug]) return null;
  if (!cache.has(slug)) cache.set(slug, BUILD[slug]());
  return cache.get(slug)!;
}
