import { useMemo, useState } from "react";
import { DemoFrame, Seg, StatusPill } from "@/components/demo-ui";
import { planStatus } from "@/lib/status";
import { useStack } from "@/components/stack";
import { money } from "@/lib/rng";
import { AS_OF, TERRITORIES, makeReps, rollup, type Period, type PlanRule, type Row, type Territory } from "@/lib/sales";

const PERIODS: readonly Period[] = ["MTD", "QTD", "YTD"];
const PERIOD_NAME: Record<Period, string> = { MTD: "October to date", QTD: "Q4 to date", YTD: "2026 to date" };
type SortKey = "label" | "goal" | "planToDate" | "actual" | "pctToPlan";
const RULES = ["Prorated by day", "Full month"] as const;
type RuleName = (typeof RULES)[number];
const RULE: Record<RuleName, PlanRule> = { "Prorated by day": "prorated", "Full month": "full" };

// The as-of day, for the rule's wording: "October's target counts 21 of its 31 days".
const asOf = new Date(`${AS_OF}T00:00:00Z`);
const DAY = asOf.getUTCDate();
const DAYS_IN_MONTH = new Date(Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() + 1, 0)).getUTCDate();
const MONTH = asOf.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });

const tone = (p: number) => (p >= 100 ? "good" : p >= 90 ? "warn" : "bad");

export default function SalesDashboard() {
  const { crm } = useStack();
  const reps = useMemo(() => makeReps(), []);
  const [period, setPeriod] = useState<Period>("QTD");
  const [territory, setTerritory] = useState<Territory | "All">("All");
  const [ruleName, setRuleName] = useState<RuleName>("Prorated by day");
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "pctToPlan", desc: false });
  const rule = RULE[ruleName];
  const { rows, total } = useMemo(() => rollup(reps, period, territory, AS_OF, rule), [reps, period, territory, rule]);
  const atRisk = rows.filter((r) => r.pctToPlan < 90).length;
  const unit = territory === "All" ? "territories" : "reps";

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number);
    });
    return sort.desc ? s.reverse() : s;
  }, [rows, sort]);

  const scale = Math.max(...rows.map((r) => Math.max(r.goal, r.actual)), 1);
  const head = (key: SortKey, text: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : false }))}>
        {text}
        {sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  return (
    <DemoFrame
      slug="sales-dashboard"
      problem="Sales leaders rebuilt the same report by hand every week, and every region counted “to plan” differently."
      built={[
        <>One dashboard by territory and rep, for month, quarter and year to date.</>,
        <>Written rules, like prorating this month's plan by days elapsed, so “% to plan” is fair any day of the month.</>,
        <>Rules agreed with sales leadership first; I wrote the queries and the build with AI.</>,
      ]}
    >
      <div className="dash">
        <div className="dash-bar">
          <div className="select">
            <span className="label" aria-hidden="true">Plan Rule</span>
            <Seg label="Plan rule" options={RULES} value={ruleName} onChange={setRuleName} nudge="Full month" />
          </div>
          <div className="select">
            <span className="label" aria-hidden="true">Period</span>
            <Seg label="Period" options={PERIODS} value={period} onChange={setPeriod} />
          </div>
          <label className="select">
            <span className="label">Territory</span>
            <select value={territory} onChange={(e) => setTerritory(e.target.value as Territory | "All")}>
              <option value="All">All territories</option>
              {TERRITORIES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <span className="label dash-asof">{PERIOD_NAME[period]} · From {crm.name} · As of Oct 21, 2026</span>
        </div>

        <p className="dash-hint" aria-live="polite">
          {rule === "prorated" ? (
            <>
              <b>The agreed rule:</b> {MONTH}'s target counts {DAY} of its {DAYS_IN_MONTH} days, so % to plan is fair on any
              day of the month. {atRisk} of {rows.length} {unit} at risk.
            </>
          ) : (
            <>
              <b>The old way:</b> {MONTH}'s whole target counts from day one, so on {MONTH.slice(0, 3)} {DAY} the team reads{" "}
              {total.pctToPlan}% and {atRisk} of {rows.length} {unit} look at risk. Same sales, different rule.
            </>
          )}
        </p>

        <div className="kpis">
          <Kpi label="Actual" value={money(total.actual)} />
          <Kpi label="Plan to Date" value={money(total.planToDate)} />
          <Kpi label="% to Plan" value={`${total.pctToPlan}%`} tone={tone(total.pctToPlan)} sub={planStatus(total.pctToPlan).word} />
          <Kpi label={`% of ${period === "MTD" ? "month" : period === "QTD" ? "quarter" : "year"} goal`} value={`${total.pctOfGoal}%`} sub={`Goal ${money(total.goal)}`} />
        </div>

        <div className="bullets" aria-label="Actual against goal, with plan to date marked">
          {sorted.map((r) => (
            <Bullet key={r.label} r={r} scale={scale} />
          ))}
          <p className="small muted bullets-key">
            <span className="key tone-bg-good" /><span className="key tone-bg-warn" /><span className="key tone-bg-bad" /> Actual: on plan, behind, at risk <span className="key key-goal" /> Goal <span className="key key-plan" /> Plan to date
          </p>
        </div>

        <div className="table-wrap">
          <table>
            <caption>Goal, plan to date ({ruleName.toLowerCase()}) and actual for the selected period and territory, as of Oct 21, 2026. Made-up data.</caption>
            <thead>
              <tr>
                {head("label", territory === "All" ? "Territory" : "Rep")}
                {head("goal", "Goal")}
                {head("planToDate", "Plan to date")}
                {head("actual", "Actual")}
                {head("pctToPlan", "% to plan")}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{money(r.goal)}</td>
                  <td>{money(r.planToDate)}
                  <td>{money(r.actual)}</td>
                  <td><StatusPill value={`${r.pctToPlan}%`} status={planStatus(r.pctToPlan)} /></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">{total.label}</th>
                <td>{money(total.goal)}</td>
                <td>{money(total.planToDate)}</td>
                <td>{money(total.actual)}</td>
                <td><StatusPill value={`${total.pctToPlan}%`} status={planStatus(total.pctToPlan)} /></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="rule">
          <b>Rule sales leadership agreed:</b> plan to date = each month's target for the months that have passed, plus
          this month's target × days elapsed ÷ days in month. <b>Full month</b> (how regions used to count it) takes this
          month's whole target from day one. % to plan = actual ÷ plan to date. Green ≥ 100%, yellow 90–99%, red below
          90%. Data as of Oct 21, 2026.
        </p>
      </div>
    </DemoFrame>
  );
}

function Kpi({ label, value, sub, tone: t }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className={`kpi-value ${t ? `tone-${t}` : ""}`}>{value}</span>
      {sub && <span className="small muted">{sub}</span>}
    </div>
  );
}

function Bullet({ r, scale }: { r: Row; scale: number }) {
  const w = (n: number) => `${Math.min(100, (n / scale) * 100)}%`;
  return (
    <div className="bullet">
      <span className="bullet-label">{r.label}</span>
      <div className="bullet-track" role="img" aria-label={`${r.label}: actual ${money(r.actual)}, plan to date ${money(r.planToDate)}, goal ${money(r.goal)}`}>
        <span className="bullet-goal" style={{ width: w(r.goal) }} />
        <span className={`bullet-actual tone-bg-${tone(r.pctToPlan)}`} style={{ width: w(r.actual) }} />
        <span className="bullet-plan" style={{ left: w(r.planToDate) }} />
      </div>
      <span className="bullet-num">{r.pctToPlan}%</span>
    </div>
  );
}
