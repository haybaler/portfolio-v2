/**
 * Board-slides demo on made-up data. Pipeline: NetSuite (MCP) -> Claude -> Google Sheet -> Google Slides,
 * refreshed by a scheduled task one week before each quarterly board meeting.
 * Insights are derived from the numbers so the bullets can never disagree with the charts.
 */
import { pctOf, rng } from "@/lib/rng";
import { AS_OF, makeReps, quarterByTerritory } from "@/lib/sales";

export const BOARD_MEETINGS = ["2026-01-28", "2026-04-22", "2026-07-22", "2026-10-28", "2027-01-27"];
export const REFRESH_DAYS_BEFORE = 7;

const DAY = 86_400_000;
const t = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export function nextBoard(asOf: string, meetings = BOARD_MEETINGS): string | null {
  return meetings.find((m) => t(m) >= t(asOf)) ?? null;
}

export function refreshDate(meeting: string, daysBefore = REFRESH_DAYS_BEFORE): string {
  return iso(t(meeting) - daysBefore * DAY);
}

export function fmtDate(d: string): string {
  return new Date(t(d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export interface Channel {
  name: string;
  goal: number;
  mqls: number;
  sqls: number;
}

/** Q3 marketing by channel: MQL goal, MQLs and the SQLs they became. */
export function channels(seed = 3): Channel[] {
  const r = rng(seed);
  const spec: [string, number, number][] = [
    ["Paid search", 180, 1.25],
    ["LinkedIn", 140, 0.82],
    ["Email", 120, 1.08],
    ["Events", 90, 0.71],
    ["Website & SEO", 110, 1.12],
    ["Distributors", 60, 0.95],
  ];
  return spec.map(([name, goal, form]) => {
    const mqls = Math.round(goal * form * (0.95 + r() * 0.1));
    const sqls = Math.round(mqls * (0.18 + r() * 0.16));
    return { name, goal, mqls, sqls };
  });
}

export const FUNNEL_GOAL = { conversion: 28, daysToConvert: 21 };

export function funnel(ch: Channel[], seed = 5) {
  const r = rng(seed);
  const mqls = ch.reduce((s, c) => s + c.mqls, 0);
  const sqls = ch.reduce((s, c) => s + c.sqls, 0);
  const mqlGoal = ch.reduce((s, c) => s + c.goal, 0);
  return {
    mqls,
    sqls,
    mqlGoal,
    conversion: pctOf(sqls, mqls),
    daysToConvert: Math.round(17 + r() * 10),
    priorDaysToConvert: Math.round(24 + r() * 8),
  };
}

/** A fact the metrics can't show (a plan, a vacancy, a budget change) and the document it comes from. */
export interface ContextNote {
  note: string;
  from: string;
}

export interface Slide {
  id: string;
  plainTitle: string;
  headline: string;
  subheadline: string;
  insights: string[];
  /** Business context the insights draw on, alongside the metrics. */
  context: ContextNote[];
}

/** The deck for one quarter. Each quarter has its own made-up marketing numbers; sales share the dashboard's reps. */
export function buildDeck(asOf = AS_OF, quarter: 2 | 3 = 3) {
  const Q = `Q${quarter}`;
  const reps = makeReps();
  const regions = quarterByTerritory(reps, quarter);
  const ch = channels(quarter);
  const prior = funnel(channels(quarter - 1), quarter + 1);
  const f = { ...funnel(ch, quarter + 2), priorDaysToConvert: prior.daysToConvert };
  const salesPlan = regions.reduce((s, x) => s + x.plan, 0);
  const salesActual = regions.reduce((s, x) => s + x.actual, 0);
  const salesPct = pctOf(salesActual, salesPlan);
  const byPct = [...regions].sort((a, b) => b.pctToPlan - a.pctToPlan);
  const chPct = ch.map((c) => ({ ...c, pct: pctOf(c.mqls, c.goal), conv: pctOf(c.sqls, c.mqls) }));
  const chByPct = [...chPct].sort((a, b) => b.pct - a.pct);
  const chByConv = [...chPct].sort((a, b) => b.conv - a.conv);
  const behind = regions.filter((x) => x.pctToPlan < 95);
  const mqlPct = pctOf(f.mqls, f.mqlGoal);
  const meeting = nextBoard(asOf);
  const worst = byPct[byPct.length - 1];
  const chWorst = chByPct[chByPct.length - 1];
  const faster = f.daysToConvert < f.priorDaysToConvert;

  // Made-up business context. It names whichever territory and channel the numbers put last, so it always fits.
  const vacancy: ContextNote = { note: `${worst.territory} had one of its two rep seats open for six weeks.`, from: "Hiring plan" };
  const budget: ContextNote = { note: `${chWorst.name} budget was cut by a third mid-quarter.`, from: "Marketing plan" };
  const followUp: ContextNote = { note: "Sales development moved to a 24-hour follow-up rule on new MQLs.", from: "Sales playbook" };
  const coverage: ContextNote = { note: `Next quarter's plan adds coverage in ${worst.territory} if the board approves it.`, from: "Operating plan" };

  const slides: Slide[] = [
    {
      id: "summary",
      plainTitle: "Executive summary",
      headline: salesPct >= 100 ? `${Q} closed at ${salesPct}% of plan` : `${Q} closed at ${salesPct}% of plan, short in ${behind.length} region${behind.length === 1 ? "" : "s"}`,
      subheadline: `Demand is ${mqlPct >= 100 ? "ahead of" : "behind"} goal and converting ${faster ? "faster" : "slower"} than last quarter.`,
      insights: [
        `${byPct[0].territory} and ${byPct[1].territory} carried the quarter at ${byPct[0].pctToPlan === byPct[1].pctToPlan ? `${byPct[0].pctToPlan}% of plan each` : `${byPct[0].pctToPlan}% and ${byPct[1].pctToPlan}% of plan`}; ${worst.territory} trailed at ${worst.pctToPlan}% with a rep seat open for six weeks.`,
        `MQLs reached ${mqlPct}% of goal, and ${f.conversion}% became sales-qualified against a ${FUNNEL_GOAL.conversion}% target.`,
        `Ask of the board: ${behind.length ? `approve the coverage plan for ${behind.map((b) => b.territory).join(" and ")}` : "hold the plan; no region needs new coverage"}.`,
      ],
      context: [vacancy, coverage],
    },
    {
      id: "kpis",
      plainTitle: "KPI dashboard",
      headline: `Demand is ${mqlPct >= 100 ? "ahead of" : "behind"} goal; ${f.conversion >= FUNNEL_GOAL.conversion ? "conversion is on target" : "conversion is the constraint"}`,
      subheadline: `Leads move from MQL to SQL in ${f.daysToConvert} days, ${faster ? "down" : "up"} from ${f.priorDaysToConvert}.`,
      insights: [
        `${chByPct.filter((c) => c.pct >= 100).length} of ${ch.length} channels hit their MQL goal.`,
        f.daysToConvert <= FUNNEL_GOAL.daysToConvert
          ? `Time to convert beat the ${FUNNEL_GOAL.daysToConvert}-day goal at ${f.daysToConvert} days.`
          : `Time to convert ${faster ? "improved" : "slipped"} to ${f.daysToConvert} days, above the ${FUNNEL_GOAL.daysToConvert}-day goal${faster ? "; the 24-hour follow-up rule is working" : ""}.`,
        `Sales finished the quarter at ${salesPct}% of plan across all regions.`,
      ],
      context: [followUp, budget],
    },
    {
      id: "marketing",
      plainTitle: "Marketing by channel",
      headline: `${chByPct[0].name} beat goal; ${chByPct[chByPct.length - 1].name} fell furthest short`,
      subheadline: `${chByConv[0].name} turns the most MQLs into SQLs (${chByConv[0].conv}%).`,
      insights: [
        `${chByPct[0].name} reached ${chByPct[0].pct}% of its MQL goal; ${chWorst.name} reached ${chWorst.pct}% after its budget was cut by a third.`,
        `${chByConv[0].name} converts at ${chByConv[0].conv}% vs ${chByConv[chByConv.length - 1].conv}% for ${chByConv[chByConv.length - 1].name}: volume isn't the same as quality.`,
        `Recommendation: shift budget toward ${chByConv[0].name} before adding volume elsewhere.`,
      ],
      context: [budget],
    },
    {
      id: "sales",
      plainTitle: "Sales by territory",
      headline: `${byPct[0].territory} led ${Q} at ${byPct[0].pctToPlan}% of plan`,
      subheadline: behind.length ? `${behind.map((b) => b.territory).join(" and ")} finished below 95% of plan.` : "Every territory finished within 5% of plan or better.",
      insights: [
        `${regions.filter((x) => x.pctToPlan >= 100).length} of ${regions.length} territories met or beat plan.`,
        `${worst.territory} closed at ${worst.pctToPlan}% of plan, the widest gap; one of its two rep seats was open for six weeks.`,
        `${worst.territory} gets a coverage review next quarter; progress comes back to the board at the following meeting.`,
      ],
      context: [vacancy, coverage],
    },
  ];
  return { quarter: Q, slides, regions, channels: chPct, funnel: f, salesPct, mqlPct, meeting, refresh: meeting ? refreshDate(meeting) : null };
}
