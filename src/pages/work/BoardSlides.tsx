import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type TouchEvent } from "react";
import { DemoFrame, StatusPill } from "@/components/demo-ui";
import { planStatus } from "@/lib/status";
import { BOARD_MEETINGS, FUNNEL_GOAL, REFRESH_DAYS_BEFORE, buildDeck, fmtDate, refreshDate } from "@/lib/board";
import { money } from "@/lib/rng";
import { AS_OF } from "@/lib/sales";
import { useStack } from "@/components/stack";
import { both } from "@/lib/content";
import { BoardFlow } from "./BoardFlow";

/** Which sheet tabs each slide reads. */
const SLIDE_TABS: Record<string, string[]> = {
  summary: ["territory", "channel", "funnel", "context"],
  kpis: ["territory", "channel", "funnel", "context"],
  marketing: ["channel", "context"],
  sales: ["territory", "context"],
};

/** Last quarter's deck was refreshed a week before the July meeting. */
const LAST_REFRESH = "2026-07-15";
const STEP_MS = 700;

type Phase = "stale" | "running" | "done";

export default function BoardSlides() {
  const { crm, map } = useStack();
  const RUN = [
    { name: `Pull Q3 rows from ${both(crm.name, map.short)}`, note: "Read-only, through MCP" },
    { name: "Update the metrics sheet", note: "Territory, Channel and Funnel tabs recalculate" },
    { name: "Read the business context", note: "Hiring plan, marketing plan, sales playbook, operating plan" },
    { name: "Draft headlines and insights", note: "Metrics and context together; I review before it goes out" },
    { name: "Rebuild the slides", note: "Charts and tables linked to the sheet" },
  ];
  const stale = useMemo(() => buildDeck(LAST_REFRESH, 2), []);
  const fresh = useMemo(() => buildDeck(), []);
  const [phase, setPhase] = useState<Phase>("stale");
  const [step, setStep] = useState(0);
  const deck = phase === "done" ? fresh : stale;
  const [i, setI] = useState(0);
  const n = deck.slides.length;
  const slide = deck.slides[i];
  const go = (k: number) => setI(Math.max(0, Math.min(n - 1, k)));

  // The run steps through the same task the schedule runs, one step at a time, then swaps in the new deck.
  useEffect(() => {
    if (phase !== "running") return;
    const t = window.setTimeout(() => {
      if (step < RUN.length - 1) setStep(step + 1);
      else {
        setPhase("done");
        setI(0);
      }
    }, STEP_MS);
    return () => window.clearTimeout(t);
  }, [phase, step, RUN.length]);
  const refresh = () => {
    setStep(0);
    setPhase("running");
  };
  const stepState = (k: number) =>
    phase === "done" || (phase === "running" && k < step) ? "done" : phase === "running" && k === step ? "running" : "waiting";

  const touchX = useRef<number | null>(null);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
  };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
  };
  const upcoming = BOARD_MEETINGS.filter((m) => m >= AS_OF).slice(0, 2);

  return (
    <DemoFrame
      slug="board-slides"
      problem="Every quarter the board deck took 2–3 days of exports, iterations and revisions, and still arrived as a wall of numbers. Directors got data, not meaning."
      built={[
        <>A deck template the executive team agreed first, so each quarter only the numbers and the story change.</>,
        <>An AI engine built once on the business context engine. One click, or the schedule a week before each meeting, refreshes the sheet and rebuilds the deck.</>,
        <>Key insights on every slide, built on business context (plans, hiring, budget changes) as well as the metrics.</>,
      ]}
    >
      <div className="board">
        <div className="refresh">
          <div className="refresh-bar">
            <button type="button" className="btn primary nudge" onClick={refresh} disabled={phase === "running"}>
              {phase === "running" ? "Refreshing…" : "Refresh Quarterly Business Review"}
            </button>
            <p className="small muted refresh-hint" aria-live="polite">
              {phase === "stale" && (
                <>
                  Showing last quarter's deck (Q2, refreshed {fmtDate(LAST_REFRESH)}). The button runs the task the schedule
                  runs {REFRESH_DAYS_BEFORE} days before each board meeting.
                </>
              )}
              {phase === "running" && <>Step {step + 1} of {RUN.length}: {RUN[step].name}.</>}
              {phase === "done" && (
                <>
                  Q3 deck ready for the {deck.meeting ? fmtDate(deck.meeting) : ""} board meeting: new numbers, new headlines,
                  and insights that explain them.
                </>
              )}
            </p>
          </div>
          <ol className="refresh-steps" aria-label="Refresh steps">
            {RUN.map((r, k) => {
              const st = stepState(k);
              return (
                <li key={r.name} className={`refresh-step ${st}`}>
                  <span className={`pill ${st === "done" ? "tone-good" : st === "running" ? "tone-warn" : "pill-wait"}`}>
                    {st === "done" ? "Done" : st === "running" ? "Running" : "Waiting"}
                  </span>
                  <b>{r.name}</b>
                  <span className="small muted">{r.note}</span>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="context-callout">
          <span className="label">Why Key Insights</span>
          Metrics show what happened. A board needs to know why and what to do next, so every slide's insights read the
          business context (plans, hiring, budget changes) alongside the numbers.
        </p>

        <div
          className={`deck ${phase === "running" ? "rebuilding" : ""}`}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${deck.quarter} 2026 quarterly business review`}
          tabIndex={0}
          onKeyDown={onKey}
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={onTouchEnd}
        >
          <div className="deck-bar">
            <span className="label">{deck.quarter} 2026 · Quarterly Business Review</span>
            <div className="deck-bar-nav">
              <button type="button" className="btn icon" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous slide">←</button>
              <span className="label">Slide {i + 1} of {n}</span>
              <button type="button" className="btn icon" onClick={() => go(i + 1)} disabled={i === n - 1} aria-label="Next slide">→</button>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            Slide {i + 1} of {n}: {slide.plainTitle}, {deck.quarter}
          </p>
          <div className="deck-stage">
            {deck.slides.map((s, k) => (
              <div
                key={`${deck.quarter}-${s.id}`}
                className={`slide with-insights ${k === i ? "on" : ""}`}
                aria-hidden={k !== i}
                aria-roledescription="slide"
                aria-label={`${k + 1} of ${n}`}
              >
                <header className={`slide-head ${phase === "done" ? "added" : ""}`}>
                  <h3 className="slide-headline">{s.headline}</h3>
                  <p className="slide-sub">{s.subheadline}</p>
                </header>
                <div className="slide-body">
                  <div className="slide-data">
                    <SlideData id={s.id} deck={deck} />
                  </div>
                  <div role="group" className={`slide-insights ${phase === "done" ? "added" : ""}`} aria-label="Key insights">
                    <span className="label">Key Insights</span>
                    <ul>
                      {s.insights.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                    <div className="slide-context">
                      <span className="label">Business Context Used</span>
                      <ul>
                        {s.context.map((c) => (
                          <li key={c.note}>
                            {c.note} <span className="muted">· {c.from}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                <footer className="slide-foot">
                  <span>Source: {both(crm.name, map.short)} via the {deck.quarter} metrics sheet, refreshed {deck.refresh ? fmtDate(deck.refresh) : ""}</span>
                  <span>{k + 1} / {n}</span>
                </footer>
              </div>
            ))}
          </div>

          <ol className="deck-thumbs" aria-label="All slides">
            {deck.slides.map((s, k) => (
              <li key={s.id}>
                <button type="button" className={`deck-thumb ${k === i ? "on" : ""}`} aria-current={k === i ? "true" : undefined} onClick={() => go(k)}>
                  <span className="label">Slide {k + 1}</span>
                  <span className="deck-thumb-title">{s.headline}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <section className="board-how" aria-labelledby="board-how-title">
          <h3 id="board-how-title" className="how-title">How It's Built</h3>
          <p className="small muted">How the data flows, field by field. It follows the slide open above.</p>
          <BoardFlow
            crm={crm.name}
            map={map.short}
            slides={deck.slides.map((s) => ({ id: s.id, name: s.plainTitle, tabs: SLIDE_TABS[s.id] ?? [] }))}
            current={i}
            onPick={go}
          />

          <div className="schedule">
            <div className="schedule-task">
              <span className="label">Scheduled Task</span>
              <p className="schedule-prompt">"Refresh commercial metrics {REFRESH_DAYS_BEFORE} days before the next quarterly board meeting."</p>
            </div>
            <ul className="schedule-dates" aria-label="Upcoming runs">
              {upcoming.map((m) => (
                <li key={m}>
                  <span className="small muted">Board meeting {fmtDate(m)}</span>
                  <b>Refresh {fmtDate(refreshDate(m))}</b>
                  {refreshDate(m) === AS_OF && <span className="pill tone-good">Ran today</span>}
                </li>
              ))}
            </ul>
          </div>
          <p className="rule">
            <b>Simulation:</b> the refresh, pipeline and schedule are shown, not run. Numbers and business context are made
            up; sales are shared with the sales dashboard example. The insights are generated from those numbers and that
            context, so the bullets always match the charts.
          </p>
        </section>
      </div>
    </DemoFrame>
  );
}

type Deck = ReturnType<typeof buildDeck>;

function SlideData({ id, deck }: { id: string; deck: Deck }) {
  const f = deck.funnel;
  if (id === "summary") {
    return (
      <div className="slide-kpis">
        <Tile label={`${deck.quarter} Sales vs Plan`} value={`${deck.salesPct}%`} />
        <Tile label="MQLs vs Goal" value={`${deck.mqlPct}%`} sub={`${f.mqls} of ${f.mqlGoal}`} />
        <Tile label="MQL → SQL" value={`${f.conversion}%`} sub={`Target ${FUNNEL_GOAL.conversion}%`} />
        <Tile label="Days to Convert" value={`${f.daysToConvert}`} sub={`Was ${f.priorDaysToConvert} · Goal ${FUNNEL_GOAL.daysToConvert}`} />
      </div>
    );
  }
  if (id === "kpis") {
    return (
      <div className="slide-grid">
        <div>
          <span className="label">Marketing: MQLs vs Goal</span>
          <Bars rows={deck.channels.map((c) => ({ label: c.name, pct: c.pct }))} />
        </div>
        <div className="slide-funnel">
          <span className="label">MQL → SQL</span>
          <div className="funnel-row"><b>{f.mqls}</b><span className="small muted">MQLs</span></div>
          <div className="funnel-row"><b>{f.sqls}</b><span className="small muted">SQLs · {f.conversion}% (target {FUNNEL_GOAL.conversion}%)</span></div>
          <div className="funnel-row"><b>{f.daysToConvert} days</b><span className="small muted">to convert (goal {FUNNEL_GOAL.daysToConvert})</span></div>
        </div>
        <div>
          <span className="label">Sales by Region vs Plan</span>
          <Bars rows={deck.regions.map((r) => ({ label: r.territory, pct: r.pctToPlan }))} />
        </div>
      </div>
    );
  }
  if (id === "marketing") {
    return (
      <div className="table-wrap">
        <table>
          <caption>{deck.quarter} MQLs against each channel's goal, and the share that became sales-qualified. Made-up data.</caption>
          <thead>
            <tr><th scope="col">Channel</th><th scope="col">MQL Goal</th><th scope="col">MQLs</th><th scope="col">% of Goal</th><th scope="col">SQLs</th><th scope="col">MQL → SQL</th></tr>
          </thead>
          <tbody>
            {deck.channels.map((c) => (
              <tr key={c.name}>
                <th scope="row">{c.name}</th>
                <td>{c.goal}</td><td>{c.mqls}</td>
                <td><StatusPill value={`${c.pct}%`} status={planStatus(c.pct)} /></td>
                <td>{c.sqls}</td><td>{c.conv}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table>
        <caption>{deck.quarter} orders against plan by territory, full months. Same made-up data as the territory dashboard.</caption>
        <thead>
          <tr><th scope="col">Territory</th><th scope="col">Plan</th><th scope="col">Actual</th><th scope="col">% to Plan</th></tr>
        </thead>
        <tbody>
          {[...deck.regions].sort((a, b) => b.pctToPlan - a.pctToPlan).map((r) => (
            <tr key={r.territory}>
              <th scope="row">{r.territory}</th>
              <td>{money(r.plan)}</td><td>{money(r.actual)}</td>
              <td><StatusPill value={`${r.pctToPlan}%`} status={planStatus(r.pctToPlan)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <span className="kpi-value">{value}</span>
      {sub && <span className="small muted">{sub}</span>}
    </div>
  );
}

/** Horizontal bars as % of goal, with a 100% line. Scale tops out at 140%. */
function Bars({ rows }: { rows: { label: string; pct: number }[] }) {
  const w = (p: number) => `${Math.min(100, (p / 140) * 100)}%`;
  return (
    <ul className="pbars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="pbar-label">{r.label}</span>
          <span className="pbar-track" role="img" aria-label={`${r.label}: ${r.pct}% of goal`}>
            <span className={`pbar-fill tone-bg-${r.pct >= 100 ? "good" : r.pct >= 90 ? "warn" : "bad"}`} style={{ width: w(r.pct) }} />
            <span className="pbar-goal" style={{ left: w(100) }} />
          </span>
          <span className="pbar-num">{r.pct}%</span>
        </li>
      ))}
    </ul>
  );
}
