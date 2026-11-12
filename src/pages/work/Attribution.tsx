import { useMemo, useState } from "react";
import { DemoFrame, Seg } from "@/components/demo-ui";
import { useStack } from "@/components/stack";
import { titleCase } from "@/lib/titleCase";
import { JourneyMap } from "./JourneyMap";
import {
  CHANNELS,
  DEALS,
  MODELS,
  NEXT_STEP,
  RESAMPLES,
  WINDOWS,
  byChannel,
  credit,
  inWindow,
  milestones,
  significance,
  stages,
  totalSpend,
  touchesCounted,
  type Model,
  type Window,
} from "@/lib/attribution";

const MODEL_MEANS: Record<Model, string> = {
  "W-shaped": "30% each to the first touch, the touch that created the lead and the one that created the opportunity; 10% shared by the rest. Plotted, the three peaks make a W.",
  "First touch": "100% to whatever first brought the account in.",
};
const WINDOW_MEANS = (w: Window) =>
  w === "Full cycle" ? "every touch since the account arrived counts." : `only touches in the ${w} before the opportunity was created, plus everything after.`;

const usdK = (n: number) => `$${Math.round(n / 1000).toLocaleString("en-US")}k`;
const pct = (r: number) => `${r >= 0 ? "+" : "−"}${Math.abs(Math.round(r * 100))}%`;
const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** The channel W-shaped attribution lifts most compared with first touch: the point of the switch. */
function biggestLift() {
  const w = byChannel(DEALS, "W-shaped");
  const f = byChannel(DEALS, "First touch");
  return w.map((r, i) => ({ ...r, first: f[i] })).sort((a, b) => b.roi - b.first.roi - (a.roi - a.first.roi))[0];
}

export default function Attribution() {
  const { crm, map } = useStack();
  const [model, setModel] = useState<Model>("W-shaped");
  const [window, setWindow] = useState<Window>("Full cycle");
  const [dealId, setDealId] = useState(DEALS[0].id);
  const rows = byChannel(DEALS, model, window);
  const sig = useMemo(() => significance(DEALS, model, window), [model, window]);
  const counted = touchesCounted(DEALS, window);
  const full = byChannel(DEALS, model);
  const lost = rows.filter((r, i) => r.revenue === 0 && full[i].revenue > 0).map((r) => r.channel.toLowerCase());
  const revenue = DEALS.reduce((s, d) => s + d.amount, 0);
  const spend = totalSpend();
  const max = Math.max(...MODELS.flatMap((m) => WINDOWS.flatMap((w) => byChannel(DEALS, m, w).map((r) => r.revenue))));
  const lift = biggestLift();

  const deal = DEALS.find((d) => d.id === dealId)!;
  const s = stages(deal.touches);
  // Credit goes only to touches inside the window; the milestones are found among those touches.
  const counts = inWindow(deal.touches, window);
  const shares = credit(counts, model);
  const at = (k: number) => (k >= 0 ? deal.touches.indexOf(counts[k]) : -1);
  const wm = milestones(counts);
  const share = (i: number) => {
    const k = counts.indexOf(deal.touches[i]);
    return k < 0 ? null : shares[k];
  };
  const moment = (i: number) =>
    model === "First touch"
      ? i === at(0) ? "First touch" : ""
      : [i === at(wm.first) && "First touch", i === at(wm.lead) && "Lead created", i === at(wm.opp) && "Opportunity created"].filter(Boolean).join(" · ");

  return (
    <DemoFrame
      slug="attribution"
      problem="Channel tracking, lead scoring, routing and marketing ROI lived in separate tools and reports, so no one could trace a closed deal back to the channel and spend that produced it."
      built={[
        <>Stages set by intent: event registration makes a Lead, a webinar an MQL, a booth conversation an SQL. Nurture engagement re-scores.</>,
        <>Leads and MQLs get a four-part nurture in {map.short}: story, problem, solution, evidence. SQLs get a rep's review before any sales sequence.</>,
        <>UTMs on every touch and offline campaigns for events, so {crm.name} credits revenue by channel, W-shaped at the account level.</>,
      ]}
    >
      <div className="attr">
        <section className="attr-step" aria-labelledby="attr-s1">
          <p className="label">Step 1</p>
          <h3 id="attr-s1">The Journey</h3>
          <p className="dash-hint">Every contact enters with a source, a stage set by its highest-intent action and a next step.</p>
          <JourneyMap />
        </section>

        <section className="attr-step" aria-labelledby="attr-s2">
          <p className="label">Step 2</p>
          <h3 id="attr-s2">Revenue Credited by Channel</h3>
          <div className="attr-bar">
            <Seg label="Attribution Model" options={MODELS} value={model} onChange={setModel} nudge="First touch" />
            <Seg label="Lookback Window" options={WINDOWS} value={window} onChange={setWindow} />
          </div>
          <p className="dash-hint attr-def">
            <b>{titleCase(model)}:</b> {MODEL_MEANS[model]} <b>{titleCase(window)}:</b> {WINDOW_MEANS(window)}
          </p>
          <div className="kpis">
            <div className="kpi"><span className="label">Won Revenue</span><span className="kpi-value">{usdK(revenue)}</span><span className="small muted">{DEALS.length} deals this year</span></div>
            <div className="kpi"><span className="label">Fully Loaded Spend</span><span className="kpi-value">{usdK(spend)}</span><span className="small muted">Five channels</span></div>
            <div className="kpi"><span className="label">Marketing ROI</span><span className="kpi-value">{pct((revenue - spend) / spend)}</span><span className="small muted">The same under every setting</span></div>
          </div>
          <div className="table-wrap">
            <table className="attr-table">
              <caption>
                Won revenue credited to each channel, {model === "W-shaped" ? "W-shaped at the account level" : "all to the first touch"},{" "}
                {window === "Full cycle" ? "over the full cycle" : `with a ${window} window`}, against fully loaded spend. Made-up data.
              </caption>
              <thead>
                <tr><th scope="col">Channel</th><th scope="col">Spend</th><th scope="col">Attributed Revenue</th><th scope="col">ROI</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.channel}>
                    <th scope="row">{titleCase(r.channel)}</th>
                    <td>{usdK(r.spend)}</td>
                    <td>
                      <span className="attr-rev">
                        <span className="attr-track" aria-hidden="true"><span style={{ width: `${(r.revenue / max) * 100}%` }} /></span>
                        <span className="num">{usdK(r.revenue)}</span>
                      </span>
                    </td>
                    <td>{pct(r.roi)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="dash-hint">
            {window !== "Full cycle" ? (
              <>A {window} window counts <b>{counted.counted} of {counted.total}</b> touches. The ones that opened accounts months earlier drop out{lost.length ? <>, so <b>{lost.join(" and ")}</b> get no credit</> : ""}. A window shorter than the sales cycle undercounts the channels that start deals.</>
            ) : model === "W-shaped" ? (
              <>Counted W-shaped, <b>{lift.channel.toLowerCase()}</b> return <b>{pct(lift.roi)}</b> on spend. Switch to first touch to see what it misses.</>
            ) : (
              <>First touch credits <b>{lift.channel.toLowerCase()}</b> with {usdK(lift.first.revenue)} of revenue, <b>{pct(lift.first.roi)}</b> on spend{lift.first.revenue === 0 ? ". They never open an account, so this view says cut them" : ""}.</>
            )}
          </p>
        </section>

        <section className="attr-step attr-journey" aria-labelledby="attr-journey-title">
          <p className="label">Step 3</p>
          <div className="attr-journey-head">
            <h3 id="attr-journey-title">One Account's Path to Revenue</h3>
            <label className="select inline">
              <span className="label">Won Deal</span>
              <select value={dealId} onChange={(e) => setDealId(e.target.value)}>
                {DEALS.map((d) => (
                  <option key={d.id} value={d.id}>{d.company} · {usdK(d.amount)}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="table-wrap">
            <table className="attr-path">
              <caption>
                Every touch from the buying committee at {deal.company}, in order, with the stage it left the account in and its share of the {usdK(deal.amount)} deal{window === "Full cycle" ? "" : ` with a ${window} window`}.
              </caption>
              <thead>
                <tr><th scope="col">Date</th><th scope="col">Who</th><th scope="col">Channel</th><th scope="col">Action</th><th scope="col">Stage</th><th scope="col">Credit</th></tr>
              </thead>
              <tbody>
                {deal.touches.map((t, i) => (
                  <tr key={i} className={moment(i) ? "on" : undefined}>
                    <td>{day(t.date)}</td>
                    <td>{t.person}</td>
                    <td>{titleCase(t.channel)}</td>
                    <td>
                      {t.action}
                      {moment(i) && <span className="attr-moment">{moment(i)}</span>}
                    </td>
                    <td>{s[i] ?? "–"}</td>
                    <td>{share(i) === null ? <span className="muted">Outside window</span> : <>{Math.round(share(i)! * 100)}% · {usdK(share(i)! * deal.amount)}</>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="small muted">
            Next step at each stage: Lead and MQL, {NEXT_STEP.Lead.toLowerCase()}; SQL, {NEXT_STEP.SQL.toLowerCase()}. An SQL that
            isn't ready goes back to nurture. This deal closed won on {day(deal.closed)}.
          </p>
        </section>

        <section className="attr-step" aria-labelledby="attr-s4">
          <p className="label">Step 4</p>
          <h3 id="attr-s4">Is the Return Real?</h3>
          <p className="dash-hint">
            Six deals is a small sample. Redraw them {RESAMPLES.toLocaleString("en-US")} times and see whether each channel still earns
            back its spend. Same settings as step 2.
          </p>
          <div className="table-wrap">
            <table className="attr-sig">
              <caption>
                ROI by channel with the range 95% of redraws fall in, and p: the share of redraws where the channel failed to earn back its
                spend. "Yes" means p &lt; 0.05. Made-up data.
              </caption>
              <thead>
                <tr><th scope="col">Channel</th><th scope="col">ROI</th><th scope="col">95% Range</th><th scope="col">Earns Back Spend?</th></tr>
              </thead>
              <tbody>
                {sig.map((r) => (
                  <tr key={r.channel}>
                    <th scope="row">{titleCase(r.channel)}</th>
                    <td>{pct(r.roi)}</td>
                    <td>{pct(r.low)} to {pct(r.high)}</td>
                    <td>
                      <span className={`pill tone-${r.significant ? "good" : "warn"}`}>{r.significant ? "Yes" : "Not proven"}</span>
                      <span className="attr-p">p {r.p < 0.001 ? "< 0.001" : `= ${r.p.toFixed(3)}`}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <h3 className="how-title">How It's Built</h3>
        <p className="rule">
          <b>Rules:</b> marketing ROI = (attributed revenue − channel spend) ÷ channel spend. Spend is fully loaded: for
          events, booth, travel, shipping and materials. W-shaped gives 30% each to the first touch, the touch that created
          the lead and the touch that created the opportunity; the other touches share 10%. Credit is counted at the account,
          so touches from everyone on the buying committee roll up to the deal. A lookback window counts touches up to 30, 60
          or 90 days before the opportunity was created, plus everything after; in production it is set longer than the
          sales cycle. Data-driven attribution is left out on purpose: a focused account list closes too few deals to train it.
        </p>
        <p className="rule">
          <b>Significance:</b> a bootstrap test. The year's {DEALS.length} won deals are redrawn with replacement{" "}
          {RESAMPLES.toLocaleString("en-US")} times and each channel's ROI recalculated; p is the share of redraws where the
          channel failed to earn back its spend. "Yes" means p &lt; 0.05. Six deals is a small sample, so wide ranges and
          "Not proven" are the honest answer, not a fault in the channel.
        </p>
        <p className="rule">
          <b>Also tracked:</b> pipeline created by channel, the leading indicator while revenue lags by quarters, and a
          "How did you hear about us?" field for word of mouth that UTMs miss. Channel list: {CHANNELS.map((c) => titleCase(c)).join(", ")}.
        </p>
      </div>
    </DemoFrame>
  );
}
