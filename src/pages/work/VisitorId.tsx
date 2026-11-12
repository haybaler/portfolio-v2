import { useMemo, useState } from "react";
import { DemoFrame, Seg } from "@/components/demo-ui";
import { useStack } from "@/components/stack";
import { FIT_LABEL, HOT, QUEUE, VISITS, WARM, actions, fit, intent, repFor, type Visit } from "@/lib/visitors";

const FILTERS = ["All", "Hot", "Warm", "Logged only"] as const;
type Filter = (typeof FILTERS)[number];

const PAGE_LABEL = { pricing: "Pricing", validation: "Validation data", demo: "Demo request", product: "Product", blog: "Blog", careers: "Careers" } as const;

export default function VisitorId() {
  const { crm, map } = useStack();
  const [visits, setVisits] = useState<Visit[]>(VISITS);
  const [filter, setFilter] = useState<Filter>("All");
  const [selected, setSelected] = useState<string>(VISITS[0].id);
  const queueLeft = QUEUE.filter((q) => !visits.some((v) => v.id === q.id));

  const rows = useMemo(
    () =>
      [...visits].reverse().map((v) => ({ v, i: intent(v), a: actions(v), f: fit(v) })).filter(({ i, a }) =>
        filter === "All" ? true : filter === "Logged only" ? !a.retarget : i.tier === filter,
      ),
    [visits, filter],
  );
  const sel = visits.find((v) => v.id === selected) ?? visits[0];
  const si = intent(sel);
  const sa = actions(sel);
  const counts = {
    alerts: visits.filter((v) => actions(v).alert).length,
    retarget: visits.filter((v) => actions(v).retarget).length,
  };

  function playNext() {
    const next = queueLeft[0];
    if (!next) return;
    setVisits((vs) => [...vs, next]);
    setSelected(next.id);
    setFilter("All");
  }

  return (
    <DemoFrame
      slug="visitor-id"
      problem="Most life-sciences buyers never fill in a form. A target account could read the validation data three times in a week and sales would never know."
      built={[
        <>Each visit matched to a company and job title, then scored by AI for fit and intent.</>,
        <>Every identified visit logged in {crm.name} with its marketing source.</>,
        <>Warm accounts retargeted through {map.short} and ads; hot ones go straight to the territory rep.</>,
      ]}
    >
      <div className="vid">

        <div className="vid-stats">
          <div className="kpi"><span className="label">Identified Today</span><span className="kpi-value">{visits.length}</span></div>
          <div className="kpi"><span className="label">Sales Alerts</span><span className="kpi-value tone-good">{counts.alerts}</span></div>
          <div className="kpi"><span className="label">Added to Retargeting</span><span className="kpi-value">{counts.retarget}</span></div>
          <button type="button" className={`btn primary vid-play ${queueLeft.length ? "nudge" : ""}`} onClick={playNext} disabled={!queueLeft.length}>
            {queueLeft.length ? "Play the next visit" : "No more visits today"}
          </button>
        </div>

        <div className="vid-main">
          <div className="vid-feed">
            <Seg label="Filter Visits" options={FILTERS} value={filter} onChange={setFilter} />
            <ul className="feed" aria-label="Identified visits, newest first">
              {rows.map(({ v, i, a }) => (
                <li key={v.id}>
                  <button type="button" className={`feed-row ${v.id === sel.id ? "on" : ""}`} aria-pressed={v.id === sel.id} onClick={() => setSelected(v.id)}>
                    <span className="feed-time">{v.time}</span>
                    <span className="feed-who">
                      <b>{v.company}</b>
                      <span className="small muted">{v.title}</span>
                    </span>
                    <span className="feed-tags">
                      <span className={`pill tier-${i.tier.toLowerCase()}`}>{i.tier} · {i.score}</span>
                      {a.alert && <span className="pill tone-good">Sales alerted</span>}
                    </span>
                  </button>
                </li>
              ))}
              {!rows.length && <li className="small muted feed-empty">No visits match this filter yet.</li>}
            </ul>
          </div>

          <div role="group" className="vid-detail" aria-label="Selected visit">
            <span className="label">{sel.time} · Via {sel.source}</span>
            <h3>{sel.company}</h3>
            <p className="muted">{sel.title}</p>
            <dl className="vid-facts">
              <div><dt>Fit</dt><dd>{FIT_LABEL[fit(sel)]}</dd></div>
              <div><dt>Segment</dt><dd>{sel.segment}{sel.target ? " · On target list" : ""}</dd></div>
              <div><dt>Pages</dt><dd>{sel.pages.map((p) => PAGE_LABEL[p]).join(", ")}</dd></div>
            </dl>

            <div className="vid-score">
              <span className="label">Intent Score</span>
              <ul>
                {si.breakdown.map((b) => (
                  <li key={b.reason}><span>{b.reason}</span><span className="num">+{b.points}</span></li>
                ))}
                <li className="vid-total"><span>Total</span><span className={`pill tier-${si.tier.toLowerCase()}`}>{si.score} · {si.tier}</span></li>
              </ul>
            </div>

            <div className="vid-record">
              <span className="label">Written to {crm.name}</span>
              <dl>
                <div><dt>Account</dt><dd>{sel.company}</dd></div>
                <div><dt>Job Title</dt><dd>{sel.title}</dd></div>
                <div><dt>Marketing Source</dt><dd>{sel.source}</dd></div>
                <div><dt>Intent</dt><dd>{si.tier} ({si.score})</dd></div>
                <div><dt>Owner</dt><dd>{repFor(sel.territory)}</dd></div>
              </dl>
            </div>

            <ul className="vid-actions" aria-label="Actions taken">
              <li className="done">Logged in {crm.name} with source</li>
              <li className={sa.retarget ? "done" : "skip"}>{sa.retarget ? `Added to ${map.short} and ads retargeting` : "Not retargeted"}</li>
              <li className={sa.alert ? "done" : "skip"}>{sa.alert ? `Alert sent to ${repFor(sel.territory)}` : "No sales alert"}</li>
            </ul>
          </div>
        </div>

        <section className="how-built vid-how" aria-labelledby="vid-how-title">
          <h3 id="vid-how-title" className="how-title">How It's Built</h3>
          <ol className="pipeline vid-pipe" aria-label="How a visit becomes an action">
            <li className="pipe-step"><span className="label">Step 1</span><b>Website visit</b><span className="small muted">Source from UTM or referrer</span></li>
            <li className="pipe-step"><span className="label">Step 2</span><b>Identity resolution</b><span className="small muted">Company and job title</span></li>
            <li className="pipe-step"><span className="label">Step 3</span><b>AI model</b><span className="small muted">Claude, ChatGPT or Gemini: scores fit and intent</span></li>
            <li className="pipe-step"><span className="label">Step 4</span><b>{crm.name} + {map.short}</b><span className="small muted">Log, retarget, alert sales</span></li>
          </ol>
        </section>
        <p className="rule">
          <b>Rules:</b> fit = target-account list or an ideal segment, plus a buyer title (biomarker discovery,
          translational and precision medicine, proteomics and genomics, companion diagnostics, lab managers, directors). Intent: demo page +40, pricing +30, validation data +25,
          product pages +10 (up to 20), blog +5, repeat visits +15 each (up to 30). Hot ≥ {HOT}, warm ≥ {WARM}. Hot buyers
          at fit accounts alert sales; warm or hot fit accounts are retargeted; no fit means logged only.
        </p>
        <p className="rule">
          <b>Privacy:</b> this page shows invented companies and job titles only. Real deployments honor consent and
          opt-outs and follow regional privacy law; in the EU and UK, person-level identification is restricted.
        </p>
      </div>
    </DemoFrame>
  );
}
