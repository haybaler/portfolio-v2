import { useMemo, useState } from "react";
import { DemoFrame, Seg } from "@/components/demo-ui";
import { useStack } from "@/components/stack";
import { CONDITIONS, TERRITORIES, audience, reportBack } from "@/lib/audiences";
import type { Territory } from "@/lib/sales";

const VIEWS = ["Build the audience", "Report back"] as const;
type View = (typeof VIEWS)[number];
const n = (x: number) => x.toLocaleString("en-US");

export default function HcpAudiences() {
  const { map } = useStack();
  const [code, setCode] = useState(CONDITIONS[0].code);
  const [terrs, setTerrs] = useState<Territory[]>([...TERRITORIES]);
  const [view, setView] = useState<View>("Build the audience");
  const cond = CONDITIONS.find((c) => c.code === code)!;
  const aud = useMemo(() => audience(code, terrs), [code, terrs]);
  const report = useMemo(() => reportBack(aud.rows, code), [aud, code]);
  const max = Math.max(...aud.rows.map((r) => r.hcps), 1);

  const toggle = (t: Territory) =>
    setTerrs((cur) => (cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : [...cur, t]));

  const sum = (k: "reached" | "engaged" | "requests") => report.reduce((s, r) => s + r[k], 0);

  return (
    <DemoFrame
      slug="hcp-audiences"
      problem="Marketing bought broad physician lists and couldn't say who a campaign actually reached."
      built={[
        <>Audiences built from diagnosis and procedure codes, mapped to the specialties that treat those patients.</>,
        <>Each audience sent to {map.short} and the ad platforms, with results reported by specialty.</>,
        <>De-identified, aggregated data only. I built the mappings and the report with AI.</>,
      ]}
    >
      <div className="aud">
        <div className="aud-controls">
          <fieldset>
            <legend className="label">1 · Condition (ICD-10-CM)</legend>
            <div className="aud-conditions">
              {CONDITIONS.map((c) => (
                <label key={c.code} className={`radio-card ${c.code === code ? "on" : ""}`}>
                  <input type="radio" name="condition" value={c.code} checked={c.code === code} onChange={() => setCode(c.code)} />
                  <span className="code">{c.code}</span>
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="label">2 · Territories</legend>
            <div className="aud-terrs">
              {TERRITORIES.map((t) => (
                <label key={t} className="check">
                  <input type="checkbox" checked={terrs.includes(t)} onChange={() => toggle(t)} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="aud-result">
          <div className="aud-head">
            <div>
              <span className="label">{cond.code}</span>
              <p className="aud-desc">{cond.description}</p>
            </div>
            <Seg label="View" options={VIEWS} value={view} onChange={setView} nudge="Report back" />
          </div>

          {view === "Build the audience" ? (
            <>
              <div className="aud-total">
                <span className="kpi-value">{n(aud.total)}</span>
                <span className="muted">HCPs in {terrs.length === TERRITORIES.length ? "all territories" : terrs.join(", ")}</span>
              </div>
              <ul className="aud-bars">
                {aud.rows.map((r) => (
                  <li key={r.specialty}>
                    <span>{r.specialty}</span>
                    <span className="aud-track"><span style={{ width: `${(r.hcps / max) * 100}%` }} /></span>
                    <span className="num">{n(r.hcps)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="small muted">Results pulled from {map.name} and ad platforms.</p>
              <div className="funnel">
                <FunnelStep label="Audience" value={aud.total} of={aud.total} />
                <FunnelStep label="Reached" value={sum("reached")} of={aud.total} />
                <FunnelStep label="Engaged" value={sum("engaged")} of={aud.total} />
                <FunnelStep label="Requested a Demo or Sample" value={sum("requests")} of={aud.total} />
              </div>
              <div className="table-wrap">
                <table>
                  <caption>Campaign results by specialty: audience, reached, engaged and requests for a demo or sample. Made-up counts.</caption>
                  <thead>
                    <tr><th scope="col">Specialty</th><th scope="col">Audience</th><th scope="col">Reached</th><th scope="col">Engaged</th><th scope="col">Requests</th></tr>
                  </thead>
                  <tbody>
                    {report.map((r) => (
                      <tr key={r.specialty}>
                        <th scope="row">{r.specialty}</th>
                        <td>{n(r.hcps)}</td><td>{n(r.reached)}</td><td>{n(r.engaged)}</td><td>{n(r.requests)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <p className="rule">
            <b>How real work handles data:</b> audiences are built from de-identified, aggregated claims data and public
            provider registries. No patient-level data, and no individual is shown here. The codes are real FY2027
            ICD-10-CM codes; the specialty mapping is illustrative and every count is made up.
          </p>
        </div>
      </div>
    </DemoFrame>
  );
}

function FunnelStep({ label, value, of }: { label: string; value: number; of: number }) {
  return (
    <div className="funnel-step">
      <span className="label">{label}</span>
      <span className="kpi-value">{n(value)}</span>
      <span className="funnel-bar"><span style={{ width: `${of ? (value / of) * 100 : 0}%` }} /></span>
    </div>
  );
}
