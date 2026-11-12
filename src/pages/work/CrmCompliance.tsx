import { useMemo, useState } from "react";
import { DemoFrame, StatusPill } from "@/components/demo-ui";
import { complianceStatus } from "@/lib/status";
import { money } from "@/lib/rng";
import { titleCase } from "@/lib/titleCase";
import { HYGIENE_LABEL, SLA_HOURS, formatP, generate, speedToLead, team, type Hygiene, type RepRow } from "@/lib/compliance";
import { SIGNAL_PHRASE as SHORT, drivers, listOf as list, type Driver } from "@/lib/drivers";

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
/** Effects are small per unit, so round to the nearest $10 instead of thousands. */
const dollars = (v: number) => `$${(Math.round(Math.abs(v) / 10) * 10).toLocaleString("en-US")}`;
const signed = (v: number) => `${v < 0 ? "−" : "+"}${dollars(v)}`;

type SortKey = "name" | "meetings" | "responseMedianH" | "mqlToSql" | "sqlToCustomer" | "revenue" | "compliance";
const tone = (p: number) => (p >= 85 ? "good" : p >= 70 ? "warn" : "bad");

export default function CrmCompliance() {
  const data = useMemo(() => generate(), []);
  const { rows, leads } = data;
  const t = useMemo(() => team(rows), [rows]);
  const drv = useMemo(() => drivers(), []);
  const [tested, setTested] = useState(false);
  const speed = useMemo(() => speedToLead(leads), [leads]);
  const verified = drv.rows.filter((d) => d.verified);
  const failed = drv.rows.filter((d) => !d.verified);
  // The signal the model leaned on most that the test rejects: the reason verification matters.
  const decoy = failed[0];
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "compliance", desc: true });
  const [sel, setSel] = useState(rows[0].id);
  const rep = rows.find((r) => r.id === sel)!;

  const sorted = useMemo(() => {
    const s = [...rows].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      return typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number);
    });
    return sort.desc ? s.reverse() : s;
  }, [rows, sort]);

  const byComp = [...rows].sort((a, b) => b.compliance - a.compliance);

  const head = (key: SortKey, text: string) => (
    <th scope="col" aria-sort={sort.key === key ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ key, desc: s.key === key ? !s.desc : key !== "name" && key !== "responseMedianH" }))}>
        {text}
        {sort.key === key ? (sort.desc ? " ↓" : " ↑") : ""}
      </button>
    </th>
  );

  return (
    <DemoFrame
      slug="crm-compliance"
      problem="Leadership couldn't tell a real pipeline from a poorly logged one, or which sales activity actually turned into booked revenue."
      built={[
        <>HubSpot engagement joined to general-ledger revenue in the business context engine, so every activity traces to booked dollars.</>,
        <>A machine-learning model that ranks what predicts revenue, and a significance test that verifies each signal before it reaches coaching.</>,
        <>A weekly report per rep on rules the team agreed first: logging, response time and conversion.</>,
      ]}
    >
      <div className="crm">
        <section className="crm-card drivers" aria-labelledby="drv-title">
          <span className="label">Engagement → General Ledger</span>
          <h3 id="drv-title">
            {tested
              ? titleCase(`${list(verified.map((d) => SHORT[d.key]))} move revenue; ${decoy ? `${SHORT[decoy.key]} doesn't` : "every signal holds up"}`)
              : "Which Activity Predicts Booked Revenue?"}
          </h3>
          <p className="small muted">
            {drv.n} accounts. Q3 engagement from HubSpot, joined in the business context engine to the revenue the NetSuite
            general ledger booked to each account in the next 90 days.
          </p>
          <div className="drivers-bar">
            {tested ? (
              <button type="button" className="btn" onClick={() => setTested(false)}>
                Back to the Model's Ranking
              </button>
            ) : (
              <button type="button" className="btn primary nudge" onClick={() => setTested(true)}>
                Verify with a Significance Test
              </button>
            )}
            <p className="small muted" aria-live="polite">
              {tested ? (
                <>
                  <b>Step 2 of 2:</b> each signal tested with the others held fixed. {verified.length} of {drv.rows.length} hold up
                  {decoy ? `; ${SHORT[decoy.key]} rode along with meetings` : ""}.
                </>
              ) : (
                <>
                  <b>Step 1 of 2:</b> a machine-learning model ranks the signals by how much they help predict booked revenue.
                </>
              )}
            </p>
          </div>
          <div className="table-wrap">
            <table className="drivers-table" role="table">
              <caption>
                Five engagement signals, ranked by the model's weight. Effect = booked revenue per unit of the signal with the
                others held fixed. Made-up accounts.
              </caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader">Signal</th>
                  <th scope="col" role="columnheader">Model Weight</th>
                  <th scope="col" role="columnheader">Effect on Revenue</th>
                  <th scope="col" role="columnheader">Significance</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {drv.rows.map((d) => (
                  <DriverRow key={d.key} d={d} tested={tested} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <span className="label crm-report-label">The Weekly Report · Q3, Five Reps</span>
        <div className="kpis">
          <Kpi label="Meetings Booked" value={String(t.meetings)} sub="Q3, five reps" />
          <Kpi label="MQL → SQL" value={`${t.mqlToSql}%`} />
          <Kpi label="SQL → Customer" value={`${t.sqlToCustomer}%`} />
          <Kpi label={`Answered within ${SLA_HOURS}h`} value={`${t.withinSla}%`} />
          <Kpi label="CRM Compliance" value={`${t.compliance}%`} tone={tone(t.compliance)} sub={complianceStatus(t.compliance).word} />
        </div>

        <p className="small muted">Try it: select a rep to see their logging breakdown below.</p>
        <div className="table-wrap">
          <table className="crm-table">
            <caption>Q3 by rep. Response time is the median hours to first touch; days are medians; compliance averages five logging checks. Made-up data.</caption>
            <thead>
              <tr>
                {head("name", "Rep")}
                {head("meetings", "Meetings")}
                {head("responseMedianH", "Response time")}
                {head("mqlToSql", "MQL → SQL")}
                {head("sqlToCustomer", "SQL → customer")}
                {head("revenue", "Revenue")}
                {head("compliance", "Compliance")}
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className={r.id === sel ? "on" : ""}>
                  <th scope="row">
                    <button type="button" className="rowpick" aria-pressed={r.id === sel} onClick={() => setSel(r.id)}>
                      {r.name}
                    </button>
                    <span className="small muted"> {r.territory}</span>
                  </th>
                  <td>{r.meetings}</td>
                  <td>
                    {r.responseMedianH}h <span className="small muted">· {r.withinSla}% in SLA</span>
                  </td>
                  <td>
                    {r.mqlToSql}% <span className="small muted">· {r.daysToSql}d</span>
                  </td>
                  <td>
                    {r.sqlToCustomer}% <span className="small muted">· {r.daysToCustomer}d</span>
                  </td>
                  <td>{money(r.revenue)}</td>
                  <td>
                    <StatusPill value={`${r.compliance}%`} status={complianceStatus(r.compliance)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="crm-grid">
          <section className="crm-card" aria-labelledby="hyg-title">
            <span className="label">Logging Hygiene</span>
            <h3 id="hyg-title">{rep.name} · {rep.compliance}% Compliant</h3>
            <HygieneBars rep={rep} rows={rows} />
          </section>

          <section className="crm-card" aria-labelledby="speed-title">
            <span className="label">Speed to Lead</span>
            <h3 id="speed-title">Fast responses convert {(speed.fast / Math.max(1, speed.slow)).toFixed(1)}x better</h3>
            <div className="speed">
              <div>
                <span className="kpi-value tone-good">{speed.fast}%</span>
                <span className="small muted">became SQLs when answered within {SLA_HOURS}h ({speed.nFast} leads)</span>
              </div>
              <div>
                <span className="kpi-value tone-bad">{speed.slow}%</span>
                <span className="small muted">when answered later ({speed.nSlow} leads)</span>
              </div>
            </div>
          </section>
        </div>

        <div role="group" className="slide-insights crm-insights" aria-label="Key insights">
          <span className="label">Key Insights</span>
          <ul>
            {tested ? (
              <>
                <li>
                  Verified, holding the other signals fixed:{" "}
                  {list(verified.map((d) => `${d.key === "fast" ? "a first reply within 4 hours adds" : `each ${d.unit.replace("per ", "")} adds`} about ${dollars(d.effect)}`))}{" "}
                  of booked revenue.
                </li>
                {decoy && (
                  <li>
                    {cap(SHORT[decoy.key])} carried {Math.round(decoy.importance)}% of the model's weight but fails the test ({formatP(decoy.p)}): it rises with meetings rather than moving revenue on its own. Coach on meetings and reply time, not {SHORT[decoy.key]}.
                  </li>
                )}
              </>
            ) : (
              <li>Run the significance test above to see which activities hold up.</li>
            )}
            <li>{byComp[0].name} logs most consistently ({byComp[0].compliance}%); {byComp[byComp.length - 1].name} trails at {byComp[byComp.length - 1].compliance}%, so their pipeline is the least reliable to forecast.</li>
          </ul>
        </div>

        <p className="rule">
          <b>Rules:</b> compliance is the average of five checks, each the share of a rep's records that pass: open deals
          with a next step, close dates not in the past, contacts with a lifecycle stage, activities logged within 24
          hours, and meetings with an outcome. Green ≥ 85%, yellow 70-84%, red below 70%. Response time is the median
          hours from a new MQL to the rep's first logged touch; the SLA is {SLA_HOURS} hours. Model: gradient-boosted
          decision stumps (150 rounds, learning rate 0.1); a signal's weight is its share of the model's total gain.
          Test: a multiple regression of booked revenue on all five signals (R² = {drv.r2.toFixed(2)}), with a two-sided
          t-test on each coefficient ({drv.df} degrees of freedom); verified at p &lt; 0.05. Booked revenue = what the
          general ledger booked to the account in the 90 days after Q3.
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

function HygieneBars({ rep, rows }: { rep: RepRow; rows: RepRow[] }) {
  const keys = Object.keys(HYGIENE_LABEL) as (keyof Hygiene)[];
  return (
    <ul className="pbars hyg">
      {keys.map((k) => {
        const v = rep.hygiene[k];
        const avg = Math.round(rows.reduce((s, r) => s + r.hygiene[k], 0) / rows.length);
        return (
          <li key={k}>
            <span className="pbar-label">{HYGIENE_LABEL[k]}</span>
            <span className="pbar-track" role="img" aria-label={`${HYGIENE_LABEL[k]}: ${v}%, team average ${avg}%`}>
              <span className={`pbar-fill tone-bg-${tone(v)}`} style={{ width: `${v}%` }} />
              <span className="pbar-goal" style={{ left: `${avg}%` }} title={`Team average ${avg}%`} />
            </span>
            <span className="pbar-num">{v}%</span>
          </li>
        );
      })}
      <li className="small muted hyg-key">The dark tick marks the team average.</li>
    </ul>
  );
}

function DriverRow({ d, tested }: { d: Driver; tested: boolean }) {
  return (
    <tr className={tested && !d.verified ? "drv-failed" : ""} role="row">
      <th scope="row" role="rowheader">{d.name}</th>
      <td role="cell">
        <span className="drv-weight">
          <span className="drv-track" role="img" aria-label={`Model weight ${Math.round(d.importance)}%`}>
            <span style={{ width: `${Math.max(1, d.importance)}%` }} />
          </span>
          <span className="drv-num">{Math.round(d.importance)}%</span>
        </span>
      </td>
      <td role="cell">{tested ? `${signed(d.effect)} ${d.unit}` : "–"}</td>
      <td role="cell">
        {tested ? (
          d.verified ? (
            <StatusPill value={formatP(d.p)} status={{ tone: "good", word: "Verified" }} />
          ) : (
            <span className="pill pill-wait">{formatP(d.p)} · Not significant</span>
          )
        ) : (
          <span className="pill pill-wait">Not tested yet</span>
        )}
      </td>
    </tr>
  );
}
