import { useLayoutEffect, useRef, useState } from "react";
import { titleCase } from "@/lib/titleCase";

/**
 * Wire diagram for the board deck: which source fields feed which sheet tab, and which tabs feed each slide.
 * It follows the slide open in the deck; picking a slide here opens it there too.
 */

type Col = "src" | "tab" | "build" | "slide";
interface FlowNode {
  id: string;
  col: Col;
  name: string;
  note: string;
}

export interface FlowSlide {
  id: string;
  name: string;
  tabs: string[];
}

/** Edges between nodes. Slides are wired to "charts" and "draft" separately. */
const EDGES: [string, string][] = [
  ["opps", "territory"],
  ["quota", "territory"],
  ["contacts", "channel"],
  ["goals", "channel"],
  ["contacts", "funnel"],
  ["plans", "context"],
  ["territory", "charts"],
  ["channel", "charts"],
  ["funnel", "charts"],
  ["territory", "draft"],
  ["channel", "draft"],
  ["funnel", "draft"],
  ["context", "draft"],
];
const TABS = new Set(["territory", "channel", "funnel", "context"]);

const COLS: { col: Col; title: string; rule: string }[] = [
  { col: "src", title: "Sources", rule: "The AI model pulls Q3 rows read-only, through MCP." },
  { col: "tab", title: "Spreadsheet", rule: "Google Sheets or Excel: the numbers of record." },
  { col: "build", title: "Build", rule: "Numbers and words take separate paths." },
  { col: "slide", title: "Slide deck", rule: "Google Slides or PowerPoint." },
];

export function BoardFlow({
  crm,
  map,
  slides,
  current,
  onPick,
}: {
  crm: string;
  map: string;
  slides: FlowSlide[];
  current: number;
  onPick: (k: number) => void;
}) {
  const nodes: FlowNode[] = [
    { id: "opps", col: "src", name: "Opportunities", note: `${crm} · closed-won amount, close date, territory` },
    { id: "quota", col: "src", name: "Quotas", note: `${crm} · Q3 plan by territory` },
    { id: "contacts", col: "src", name: "Contacts", note: `${map} · MQL and SQL dates, original source` },
    { id: "goals", col: "src", name: "Campaign goals", note: `${map} · MQL goal by channel` },
    { id: "plans", col: "src", name: "Business context", note: "Hiring, marketing and operating plans, sales playbook" },
    { id: "territory", col: "tab", name: "Territory tab", note: "% to plan = closed-won ÷ quota" },
    { id: "channel", col: "tab", name: "Channel tab", note: "% of goal = MQLs ÷ goal; MQL → SQL = SQLs ÷ MQLs" },
    { id: "funnel", col: "tab", name: "Funnel tab", note: "Days to convert = average days from MQL to SQL" },
    { id: "context", col: "tab", name: "Context tab", note: "What changed this quarter that the numbers can't show" },
    { id: "charts", col: "build", name: "Linked charts and tables", note: "Read straight from the sheet, never retyped" },
    { id: "draft", col: "build", name: "AI draft, my edit", note: "Claude, ChatGPT or Gemini drafts the headline and insights from metrics and context; I rewrite them" },
    ...slides.map((s, k) => ({ id: `slide-${s.id}`, col: "slide" as Col, name: `${k + 1}. ${s.name}`, note: s.tabs.map(tabName).join(", ") })),
  ];
  const slide = slides[current];
  const edges: [string, string][] = [
    ...EDGES,
    ...slides.flatMap((s) => [["charts", `slide-${s.id}`] as [string, string], ["draft", `slide-${s.id}`] as [string, string]]),
  ];

  // What the open slide depends on: its tabs, the sources behind them, both build paths and the slide itself.
  const lit = new Set<string>([...slide.tabs, "charts", "draft", `slide-${slide.id}`]);
  for (const [a, b] of EDGES) if (slide.tabs.includes(b)) lit.add(a);
  const litEdge = ([a, b]: [string, string]) =>
    lit.has(a) && lit.has(b) && (!TABS.has(a) || slide.tabs.includes(a));

  const box = useRef<HTMLDivElement>(null);
  const [wires, setWires] = useState<{ d: string; on: boolean; key: string }[]>([]);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const draw = () => {
      const o = el.getBoundingClientRect();
      const at = (id: string) => el.querySelector<HTMLElement>(`[data-node="${id}"]`)?.getBoundingClientRect();
      const out: { d: string; on: boolean; key: string }[] = [];
      const rects = new Map<string, DOMRect>();
      for (const id of new Set(edges.flat())) {
        const r = at(id);
        if (r) rects.set(id, r);
      }
      // Wires only when columns sit side by side; stacked on a phone, the arrows between columns do the job.
      const drawn = edges.filter(([a, b]) => {
        const ra = rects.get(a);
        const rb = rects.get(b);
        return ra && rb && rb.left >= ra.right;
      });
      // Each box spreads its wires down its edge, ordered by where the other end sits, so they leave and
      // arrive side by side instead of knotting at one point.
      const mid = (id: string) => rects.get(id)!.top + rects.get(id)!.height / 2;
      const port = (id: string, side: "out" | "in", other: string) => {
        const list = drawn.filter((e) => (side === "out" ? e[0] : e[1]) === id).map((e) => (side === "out" ? e[1] : e[0]));
        list.sort((x, y) => mid(x) - mid(y));
        const r = rects.get(id)!;
        const span = Math.min(r.height * 0.6, list.length * 10);
        const i = list.indexOf(other);
        return r.top + r.height / 2 - span / 2 + (list.length > 1 ? (span * i) / (list.length - 1) : span / 2) - o.top;
      };
      for (const e of drawn) {
        const a = rects.get(e[0])!;
        const b = rects.get(e[1])!;
        const x1 = a.right - o.left;
        const y1 = port(e[0], "out", e[1]);
        const x2 = b.left - o.left - 1;
        const y2 = port(e[1], "in", e[0]);
        const c = (x2 - x1) * 0.5;
        out.push({ d: `M${x1},${y1} C${x1 + c},${y1} ${x2 - c},${y2} ${x2},${y2}`, on: litEdge(e), key: e.join(">") });
      }
      out.sort((p, q) => Number(p.on) - Number(q.on));
      setWires(out);
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, crm, map]);

  return (
    <figure className="flow-fig">
      <div className="flow" ref={box}>
        <svg className="flow-wires" aria-hidden="true">
          <defs>
            <marker id="flow-head" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="flow-head" />
            </marker>
            <marker id="flow-head-on" viewBox="0 0 8 8" refX="8" refY="4" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="flow-head on" />
            </marker>
          </defs>
          {wires.map((w) => (
            <path key={w.key} d={w.d} className={w.on ? "on" : ""} markerEnd={`url(#${w.on ? "flow-head-on" : "flow-head"})`} />
          ))}
        </svg>
        {COLS.map((c) => (
          <section key={c.col} className={`layer flow-col flow-${c.col}`} aria-label={c.title}>
            <h4 className="layer-title">{titleCase(c.title)}</h4>
            <p className="layer-rule">{c.rule}</p>
            <ul>
              {nodes
                .filter((n) => n.col === c.col)
                .map((n) => {
                  const state = lit.has(n.id) ? "lit" : "dim";
                  if (n.col === "slide") {
                    const k = slides.findIndex((s) => `slide-${s.id}` === n.id);
                    return (
                      <li key={n.id}>
                        <button
                          type="button"
                          data-node={n.id}
                          className={`src flow-slide ${k === current ? "on" : ""}`}
                          aria-pressed={k === current}
                          onClick={() => onPick(k)}
                        >
                          <b>{titleCase(n.name)}</b>
                          <span className="small">Uses {n.note}</span>
                        </button>
                      </li>
                    );
                  }
                  return (
                    <li key={n.id} data-node={n.id} className={`tbl flow-node ${state}`}>
                      <b>{titleCase(n.name)}</b>
                      <span className="small muted">{n.note}</span>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
      <figcaption className="small muted">
        Tracing slide {current + 1}, {titleCase(slide.name)}: highlighted boxes and bold wires are the data it uses. Pick another slide to
        trace it. Made-up data.
      </figcaption>
    </figure>
  );
}

function tabName(id: string) {
  return { territory: "Territory", channel: "Channel", funnel: "Funnel", context: "Context" }[id] ?? id;
}
