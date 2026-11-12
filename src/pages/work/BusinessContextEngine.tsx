import { useMemo, useState } from "react";
import { titleCase } from "@/lib/titleCase";
import { DemoFrame, Seg } from "@/components/demo-ui";
import { useStack } from "@/components/stack";
import WellPlate from "@/components/WellPlate";
import {
  LAYER_RULE,
  QUESTIONS,
  TABLES,
  WAREHOUSES,
  downstream,
  fqName,
  sources,
  tableById,
  type Layer,
  type Warehouse,
} from "@/lib/context";

const LAYERS: Layer[] = ["bronze", "silver", "gold"];

/** Table names may wrap only after a dot or underscore, never mid-word. */
function Name({ text }: { text: string }) {
  const parts = text.split(/(?<=[._])/);
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}
const LAYER_TITLE: Record<Layer, string> = { bronze: "Bronze", silver: "Silver", gold: "Gold" };

export default function BusinessContextEngine() {
  const { crm, map } = useStack();
  // NetSuite is already the ERP source, so the CRM column shows a CRM.
  const crmName = crm.id === "netsuite" ? "Salesforce" : crm.name;
  const srcs = useMemo(() => sources(crmName, map.short), [crmName, map.short]);
  const [warehouse, setWarehouse] = useState<Warehouse>("BigQuery");
  const [source, setSource] = useState<string | null>(null);
  const [qid, setQid] = useState(QUESTIONS[0].id);
  const [crmOnly, setCrmOnly] = useState(false);
  // The table lists start closed; picking a source opens them so the trace is visible.
  const [showTables, setShowTables] = useState(false);
  const tablesOpen = showTables || source !== null;
  const lit = useMemo(() => (source ? downstream(source) : null), [source]);
  const q = QUESTIONS.find((x) => x.id === qid)!;
  const pickedName = srcs.find((s) => s.id === source)?.name;

  return (
    <DemoFrame
      slug="business-context-engine"
      problem="Every team kept its own version of the truth. Leadership argued from split scoreboards, and an AI agent pointed at one system saw only a slice."
      built={[
        <>A BigQuery or Databricks warehouse in three layers: raw copies (<b>bronze</b>), cleaned and joined data (<b>silver</b>), and business-ready tables with a written rule per metric (<b>gold</b>).</>,
        <>Read-only connectors from every system that holds part of the story.</>,
        <>Agents on Claude, ChatGPT or Gemini that read only the gold layer, so they quote the numbers leadership uses.</>,
      ]}
    >
      <div className="bce">
        <section className="bce-ask" aria-labelledby="ask-title">
          <h3 id="ask-title">Ask the Agent</h3>
          <div className="erp-questions">
            {QUESTIONS.map((x) => (
              <button key={x.id} type="button" className={`erp-q ${x.id === q.id ? "on" : x.id === "dark" ? "nudge" : ""}`} aria-pressed={x.id === q.id} onClick={() => setQid(x.id)}>
                {x.text}
              </button>
            ))}
          </div>
          <div className="bce-answer">
            <div className="bce-reads">
              <span className="label">Reads</span>
              {q.reads.map((r) => (
                <code key={r}>{fqName(warehouse, tableById(r))}</code>
              ))}
            </div>
            <p className="erp-summary">{q.answer}</p>
            {q.id === "dark" ? (
              <div className="bce-plate">
                <figure className="cs-visual bce-visual">
                  <WellPlate crmOnly={crmOnly} />
                  <div className="seg" role="group" aria-label="Which view of the plate">
                    <button type="button" aria-pressed={!crmOnly} onClick={() => setCrmOnly(false)}>What Happened</button>
                    <button type="button" aria-pressed={crmOnly} onClick={() => setCrmOnly(true)}>What the CRM Saw</button>
                  </div>
                  <figcaption className="legend">
                    <span><i className="w-o" />16 originated</span>
                    <span><i className="w-i" />5 influenced</span>
                    <span><i className="w-d" />24 not traceable</span>
                  </figcaption>
                </figure>
                <div className="bce-copy">
                  <span className="label">One Gold Table: Pipeline Attribution</span>
                  <h3 id="plate-title">Every Well Is a Deal</h3>
                  <p>
                    Each colour matches the legend: originated by marketing, influenced by it, or not traceable. The blue
                    ones started somewhere no system recorded: a KOL's talk, a colleague down the hall, a distributor visit.
                    Switch to "What the CRM Saw" and they disappear, which is how most pipelines get reported.
                  </p>
                  <p className="rule">
                    <b>Rules:</b> originated = a marketing touch in the 90 days before the deal was created; influenced = a
                    touch while the deal was open; not traceable = no marketing touch logged. 45 example deals from the last
                    12 months.
                  </p>
                </div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <caption>{q.caption}</caption>
                  <thead>
                    <tr>{q.columns.map((c) => <th key={c} scope="col">{titleCase(c)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {q.rows.map((r) => (
                      <tr key={r[0]}>
                        <th scope="row">{r[0]}</th>
                        {r.slice(1).map((cell, i) => <td key={i}>{cell}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="bce-def">
              <span className="label">Definition, from Confluence</span> {q.definition}
            </p>
            <figure className="code-block">
              <figcaption className="label">Query the agent runs in {warehouse}</figcaption>
              <pre>{q.sql(warehouse)}</pre>
            </figure>
          </div>
        </section>

        <section className="bce-how" aria-labelledby="bce-how-title">
          <h3 id="bce-how-title">How It's Built</h3>
          <div className="bce-bar">
            <div className="bce-control">
              <span className="label">Warehouse</span>
              <Seg label="Warehouse" options={WAREHOUSES} value={warehouse} onChange={setWarehouse} />
            </div>
            <p className="small muted bce-hint">
              {source ? (
                <>
                  Showing everything {pickedName} feeds.{" "}
                  <button type="button" className="linkbtn" onClick={() => setSource(null)}>
                    Clear
                  </button>
                </>
              ) : (
                "Pick a source to trace where its data goes."
              )}{" "}
              <button
                type="button"
                className="linkbtn"
                aria-expanded={tablesOpen}
                onClick={() => {
                  setShowTables(!tablesOpen);
                  if (tablesOpen) setSource(null);
                }}
              >
                {tablesOpen ? "Hide the Tables" : `Show All ${TABLES.length} Tables`}
              </button>
            </p>
          </div>

          <div className="layers" aria-label="How data flows from sources to agents">
            <section className="layer layer-sources" aria-label="Sources">
              <h3 className="layer-title">Sources</h3>
              <p className="layer-rule">Read-only connectors.</p>
              <ul>
                {srcs.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className={`src ${source === s.id ? "on" : ""}`}
                      aria-pressed={source === s.id}
                      onClick={() => setSource(source === s.id ? null : s.id)}
                    >
                      <b>{s.name}</b>
                      <span className="mono-sm">{s.kind}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {LAYERS.map((layer) => (
              <section key={layer} className={`layer layer-${layer}`} aria-label={`${LAYER_TITLE[layer]} layer`}>
                <h3 className="layer-title">
                  <span className={`layer-dot dot-${layer}`} aria-hidden="true" />
                  {LAYER_TITLE[layer]}
                </h3>
                <p className="layer-rule">{LAYER_RULE[layer]}</p>
                {!tablesOpen && <p className="small muted layer-count">{TABLES.filter((t) => t.layer === layer).length} tables</p>}
                <ul hidden={!tablesOpen}>
                  {TABLES.filter((t) => t.layer === layer).map((t) => {
                    const state = !lit ? "" : lit.has(t.id) ? "lit" : "dim";
                    return (
                      <li key={t.id} className={`tbl ${state}`}>
                        <code><Name text={fqName(warehouse, t)} /></code>
                        <span className="small muted">{t.what}</span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}

            <section className="layer layer-agents" aria-label="Agents">
              <h3 className="layer-title">Agents</h3>
              <p className="layer-rule">Read the gold layer only, through MCP.</p>
              <ul>
                {["Claude", "ChatGPT", "Gemini"].map((a) => (
                  <li key={a} className="agent">
                    <b>{a}</b>
                  </li>
                ))}
              </ul>
            </section>
          </div>
          <p className="mono-sm muted">
            {warehouse === "BigQuery"
              ? "BigQuery: one dataset per layer (bronze, silver, gold)."
              : "Databricks: Unity Catalog schemas per layer in the main catalog, stored as Delta tables."}
          </p>
        </section>

        <section className="bce-gov" aria-labelledby="gov-title">
          <h3 id="gov-title">Guardrails</h3>
          <ul>
            <li><b>Read-only connectors.</b> Nothing writes back to the CRM, ERP or code repositories.</li>
            <li><b>Personal data masked at silver.</b> Gold tables and agents never see names or emails they don't need.</li>
            <li><b>One definition per metric.</b> Written once in Confluence, versioned with the gold table that uses it.</li>
            <li><b>Agents read gold only.</b> Every answer shows the tables and the query behind it.</li>
          </ul>
        </section>
      </div>
    </DemoFrame>
  );
}
