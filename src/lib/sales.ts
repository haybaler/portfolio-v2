/**
 * Sales dashboard logic on made-up data. Fiscal year = calendar year.
 * Goal = the full period's target. Plan to date = the target for the part of the period that has passed,
 * with the current month prorated by days elapsed. % to plan = actual / plan to date.
 */
import { rng } from "@/lib/rng";

export const AS_OF = "2026-10-21";
export const TERRITORIES = ["Northeast", "Southeast", "Midwest", "Southwest", "West"] as const;
export type Territory = (typeof TERRITORIES)[number];
export type Period = "MTD" | "QTD" | "YTD";

// Share of the annual goal in each month (sums to 1). Q4 is heaviest, as budgets flush at year end.
export const SEASONALITY = [0.07, 0.07, 0.085, 0.08, 0.08, 0.085, 0.07, 0.065, 0.085, 0.1, 0.1, 0.11];

export interface Rep {
  id: string;
  territory: Territory;
  annualGoal: number;
  /** Actual booked revenue per month, Jan..Dec. Future months are 0; the current month is partial. */
  actualByMonth: number[];
}

function parts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Months in the period (0-based) with how much of each has elapsed as of the date (0..1). */
export function periodMonths(period: Period, asOf: string): { month: number; elapsed: number }[] {
  const { y, m, d } = parts(asOf);
  const cur = m - 1;
  const frac = d / daysInMonth(y, m);
  const first = period === "MTD" ? cur : period === "QTD" ? cur - (cur % 3) : 0;
  const last = period === "MTD" ? cur : period === "QTD" ? first + 2 : 11;
  const out: { month: number; elapsed: number }[] = [];
  for (let i = first; i <= last; i++) out.push({ month: i, elapsed: i < cur ? 1 : i === cur ? frac : 0 });
  return out;
}

export function makeReps(seed = 7, asOf = AS_OF): Rep[] {
  const r = rng(seed);
  const { y, m, d } = parts(asOf);
  const cur = m - 1;
  const frac = d / daysInMonth(y, m);
  const reps: Rep[] = [];
  for (const t of TERRITORIES) {
    for (let k = 1; k <= 2; k++) {
      const annualGoal = Math.round((1_100_000 + r() * 900_000) / 10_000) * 10_000;
      const form = 0.78 + r() * 0.36; // this rep's typical attainment
      const actualByMonth = SEASONALITY.map((w, i) => {
        if (i > cur) return 0;
        const month = annualGoal * w * form * (0.85 + r() * 0.3);
        return Math.round(i === cur ? month * frac : month);
      });
      reps.push({ id: `${t.slice(0, 2).toUpperCase()}-${k}`, territory: t, annualGoal, actualByMonth });
    }
  }
  return reps;
}

export interface Row {
  label: string;
  goal: number;
  planToDate: number;
  actual: number;
  pctToPlan: number;
  pctOfGoal: number;
}

/**
 * How this month's target counts toward plan to date. "prorated" is the rule sales leadership agreed: this month's
 * target × days elapsed ÷ days in month. "full" is how regions used to count it: the whole month's target from day one.
 */
export type PlanRule = "prorated" | "full";

function row(label: string, reps: Rep[], period: Period, asOf: string, rule: PlanRule): Row {
  const months = periodMonths(period, asOf);
  let goal = 0;
  let plan = 0;
  let actual = 0;
  for (const rep of reps) {
    for (const { month, elapsed } of months) {
      const target = rep.annualGoal * SEASONALITY[month];
      goal += target;
      plan += target * (rule === "full" && elapsed > 0 ? 1 : elapsed);
      actual += rep.actualByMonth[month];
    }
  }
  return {
    label,
    goal: Math.round(goal),
    planToDate: Math.round(plan),
    actual,
    pctToPlan: plan === 0 ? 0 : Math.round((actual / plan) * 100),
    pctOfGoal: goal === 0 ? 0 : Math.round((actual / goal) * 100),
  };
}

/** One row per territory (or per rep when a territory is chosen), plus a total. */
export function rollup(reps: Rep[], period: Period, territory: Territory | "All", asOf = AS_OF, rule: PlanRule = "prorated") {
  const scope = territory === "All" ? reps : reps.filter((r) => r.territory === territory);
  const rows =
    territory === "All"
      ? TERRITORIES.map((t) => row(t, reps.filter((r) => r.territory === t), period, asOf, rule))
      : scope.map((r) => row(r.id, [r], period, asOf, rule));
  return { rows, total: row(territory === "All" ? "All territories" : territory, scope, period, asOf, rule) };
}

/** Full-month figures for a past quarter (used by the ERP assistant demo). */
export function quarterByTerritory(reps: Rep[], quarter: 1 | 2 | 3 | 4) {
  const months = [0, 1, 2].map((i) => (quarter - 1) * 3 + i);
  return TERRITORIES.map((t) => {
    const rs = reps.filter((r) => r.territory === t);
    const plan = Math.round(rs.reduce((s, r) => s + months.reduce((a, mo) => a + r.annualGoal * SEASONALITY[mo], 0), 0));
    const actual = rs.reduce((s, r) => s + months.reduce((a, mo) => a + r.actualByMonth[mo], 0), 0);
    return { territory: t, plan, actual, pctToPlan: Math.round((actual / plan) * 100) };
  });
}
