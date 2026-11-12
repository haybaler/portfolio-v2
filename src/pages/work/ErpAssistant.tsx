import { useMemo, useState } from "react";
import { DemoFrame, Seg, StatusPill } from "@/components/demo-ui";
import { planStatus } from "@/lib/status";
import { useStack } from "@/components/stack";
import { VENDORS, questions, toolCall, type Vendor } from "@/lib/erp";
import { queryText } from "@/lib/stack";
import { titleCase } from "@/lib/titleCase";

export default function ErpAssistant() {
  const { crm } = useStack();
  const qs = useMemo(() => questions(crm.id), [crm.id]);
  const [qid, setQid] = useState("q3");
  const [vendor, setVendor] = useState<Vendor>("Claude");
  const q = qs.find((x) => x.id === qid) ?? qs[0];

  return (
    <DemoFrame
      slug="erp-assistant"
      problem="Finance and sales ops answered the same questions every week, each one a report, an export and a spreadsheet."
      built={[
        <>One read-only connection to {crm.name}, exposed as a single tool any model can call.</>,
        <>Works the same in Claude, ChatGPT and Gemini, so each team keeps its assistant.</>,
        <>Every answer shows its query and every query is logged, so finance can check it.</>,
      ]}
    >
      <div className="erp">
        <div className="erp-ask">
          <span className="label">Try It: Ask a Question</span>
          <div className="erp-questions">
            {qs.map((x) => (
              <button key={x.id} type="button" className={`erp-q ${x.id === q.id ? "on" : ""}`} aria-pressed={x.id === q.id} onClick={() => setQid(x.id)}>
                {x.text}
              </button>
            ))}
          </div>
          <div className="erp-tabs">
            <span className="label">Answered By</span>
            <Seg label="Model" options={VENDORS} value={vendor} onChange={setVendor} nudge="ChatGPT" />
            <span className="small muted">Same answer from each, because they share one tool.</span>
          </div>
        </div>

        <div className="erp-answer">
          <p className="erp-summary">{vendor}: {q.summary}</p>
          <div className="table-wrap">
            <table>
              <caption>The rows the query returned, summed by territory. % to plan = orders ÷ plan. Made-up data shared with the territory dashboard.</caption>
              <thead>
                <tr>{q.columns.map((c) => <th key={c} scope="col">{titleCase(c)}</th>)}</tr>
              </thead>
              <tbody>
                {q.rows.map((r) => (
                  <tr key={r[0]}>
                    <th scope="row">{r[0]}</th>
                    {r.slice(1).map((cell, i) => (
                      <td key={i}>{/^\d+%$/.test(cell) ? <StatusPill value={cell} status={planStatus(parseInt(cell, 10))} /> : cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <section className="how-built" aria-labelledby="erp-how-title">
          <h3 id="erp-how-title" className="how-title">How It Works</h3>
          <div className="arch" aria-label="How the connection works">
            <div className="arch-models">
              {VENDORS.map((v) => (
                <button key={v} type="button" className={`arch-model ${v === vendor ? "on" : ""}`} aria-pressed={v === vendor} onClick={() => setVendor(v)}>
                  {v}
                </button>
              ))}
            </div>
            <div className="arch-arrow" aria-hidden />
            <div className="arch-box">
              <span className="label">One Tool</span>
              <b>{crm.tool}</b>
              <span className="small muted">Read-only · Queries logged</span>
            </div>
            <div className="arch-arrow" aria-hidden />
            <div className="arch-box arch-erp">
              <span className="label">{crm.kind}</span>
              <b>{crm.name}</b>
              <span className="small muted">{crm.connector}</span>
            </div>
          </div>
          <div className="erp-cols">
            <figure className="code-block">
              <figcaption className="label">{vendor} Calls the Tool</figcaption>
              <pre>{toolCall(vendor, crm.id, q.args)}</pre>
            </figure>
            <figure className="code-block">
              <figcaption className="label">{crm.language} Sent to {crm.name} (Same for Every Model)</figcaption>
              <pre>{queryText(q.args)}</pre>
            </figure>
          </div>
          <p className="rule">
            <b>Simulation:</b> no model or business system is called on this page. The tool-call formats match each
            model vendor's API shape, and the query matches {crm.name}'s query style; custom fields like territory are
            examples and differ per company. The answer comes from the same made-up data as the sales dashboard example.
          </p>
        </section>
      </div>
    </DemoFrame>
  );
}
