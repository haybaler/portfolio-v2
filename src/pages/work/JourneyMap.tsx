/**
 * The customer journey from the attribution case study, drawn as a flowchart: channels → intent scoring → stage →
 * nurture or a rep's review → sales sequence → revenue → ROI by channel. Dashed lines are the loops back.
 * Two hand-laid layouts: wide for desktop, tall for phones, so the text stays readable at either size.
 */

interface Box {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  lines: string[];
  hi?: boolean;
}
interface Wire {
  d: string;
  loop?: boolean;
  label?: { x: number; y: number; text: string; anchor?: "start" | "middle" | "end" };
}
interface Layout {
  w: number;
  h: number;
  boxes: Box[];
  wires: Wire[];
}

const WIDE: Layout = {
  w: 1040,
  h: 300,
  boxes: [
    { id: "ch", x: 0, y: 50, w: 150, h: 234, title: "Channels", lines: ["UTM on every touch", "", "Events", "Webinars", "Paid ads", "Email", "Organic search"] },
    { id: "score", x: 175, y: 135, w: 155, h: 64, title: "CRM Intent Scoring", lines: ["Stage = highest-", "intent action"] },
    { id: "lead", x: 360, y: 50, w: 140, h: 54, title: "Lead", lines: ["Event registration"] },
    { id: "mql", x: 360, y: 140, w: 140, h: 54, title: "MQL", lines: ["Attended a webinar"] },
    { id: "sql", x: 360, y: 230, w: 140, h: 54, title: "SQL", lines: ["Booth conversation"] },
    { id: "nurture", x: 540, y: 72, w: 170, h: 110, title: "Automated Nurture", lines: ["Story → Problem →", "Solution → Evidence", "", "For Leads and MQLs"] },
    { id: "review", x: 540, y: 230, w: 170, h: 54, title: "Rep Review", lines: ["Human in the loop"] },
    { id: "seq", x: 750, y: 230, w: 130, h: 54, title: "Sales Sequence", lines: ["Once approved"] },
    { id: "rev", x: 900, y: 230, w: 140, h: 54, title: "Closed Revenue", lines: ["Pipeline first"] },
    { id: "roi", x: 900, y: 110, w: 140, h: 70, title: "Marketing ROI", lines: ["By channel,", "W-shaped"], hi: true },
  ],
  wires: [
    { d: "M150,167 H173" },
    { d: "M330,167 C345,167 345,77 358,77" },
    { d: "M330,167 H358" },
    { d: "M330,167 C345,167 345,257 358,257" },
    { d: "M500,77 C520,77 520,110 538,110" },
    { d: "M500,167 C520,167 520,145 538,145" },
    { d: "M500,257 H538" },
    { d: "M710,257 H748" },
    { d: "M880,257 H898" },
    { d: "M970,230 V182" },
    { d: "M625,72 V24 H255 V133", loop: true, label: { x: 440, y: 18, text: "Engagement re-scores", anchor: "middle" } },
    { d: "M625,230 V184", loop: true, label: { x: 633, y: 211, text: "Not ready" } },
  ],
};

const TALL: Layout = {
  w: 364,
  h: 590,
  boxes: [
    { id: "ch", x: 16, y: 0, w: 340, h: 64, title: "Channels", lines: ["UTM on every touch: events, webinars,", "paid ads, email, organic search"] },
    { id: "score", x: 96, y: 96, w: 180, h: 64, title: "CRM Intent Scoring", lines: ["Stage = highest-intent", "action"] },
    { id: "lead", x: 16, y: 192, w: 104, h: 62, title: "Lead", lines: ["Event", "registration"] },
    { id: "mql", x: 134, y: 192, w: 104, h: 62, title: "MQL", lines: ["Attended a", "webinar"] },
    { id: "sql", x: 252, y: 192, w: 104, h: 62, title: "SQL", lines: ["Booth", "conversation"] },
    { id: "nurture", x: 16, y: 290, w: 160, h: 84, title: "Automated Nurture", lines: ["Story → Problem →", "Solution → Evidence", "Engagement re-scores"] },
    { id: "review", x: 196, y: 290, w: 160, h: 62, title: "Rep Review", lines: ["Human in the loop", "Not ready: nurture"] },
    { id: "seq", x: 196, y: 384, w: 160, h: 46, title: "Sales Sequence", lines: ["Once approved"] },
    { id: "rev", x: 196, y: 462, w: 160, h: 46, title: "Closed Revenue", lines: ["Pipeline first"] },
    { id: "roi", x: 196, y: 540, w: 160, h: 46, title: "Marketing ROI", lines: ["By channel, W-shaped"], hi: true },
  ],
  wires: [
    { d: "M186,64 V94" },
    { d: "M186,160 C186,176 68,176 68,190" },
    { d: "M186,160 V190" },
    { d: "M186,160 C186,176 304,176 304,190" },
    { d: "M68,254 V288" },
    { d: "M186,254 C186,272 150,272 150,288" },
    { d: "M304,254 C304,272 276,272 276,288" },
    { d: "M276,352 V382" },
    { d: "M276,430 V460" },
    { d: "M276,508 V538" },
    { d: "M196,321 H178", loop: true },
    { d: "M16,332 H8 V128 H94", loop: true },
  ],
};

function Diagram({ layout, className, id }: { layout: Layout; className: string; id: string }) {
  return (
    <svg className={`journey-svg ${className}`} viewBox={`0 0 ${layout.w} ${layout.h}`} role="img" aria-labelledby={`${id}-t ${id}-d`}>
      <title id={`${id}-t`}>Customer journey, from first click to closed revenue</title>
      <desc id={`${id}-d`}>
        UTM-tagged channels feed CRM intent scoring. Registering for an event makes a Lead, attending a webinar an MQL and a
        booth conversation an SQL. Leads and MQLs get an automated four-part nurture, and their engagement re-scores them.
        SQLs get a rep's review: approved ones get a sales sequence, the rest go back to nurture. Sales sequences lead to
        pipeline and closed revenue, which give marketing ROI by channel.
      </desc>
      <defs>
        <marker id={`${id}-head`} viewBox="0 0 8 8" refX="8" refY="4" markerWidth="7" markerHeight="7" markerUnits="userSpaceOnUse" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="journey-head" />
        </marker>
      </defs>
      {layout.wires.map((w, k) => (
        <g key={k}>
          <path d={w.d} className={`journey-wire${w.loop ? " loop" : ""}`} markerEnd={`url(#${id}-head)`} />
          {w.label && (
            <text x={w.label.x} y={w.label.y} textAnchor={w.label.anchor ?? "start"} className="journey-label">
              {w.label.text}
            </text>
          )}
        </g>
      ))}
      {layout.boxes.map((b) => (
        <g key={b.id}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} className={`journey-box${b.hi ? " hi" : ""}`} />
          <text x={b.x + 10} y={b.y + 20} className="journey-title">{b.title}</text>
          {b.lines.map((line, k) =>
            line ? (
              <text key={k} x={b.x + 10} y={b.y + 36 + k * 16} className="journey-line">{line}</text>
            ) : null,
          )}
        </g>
      ))}
    </svg>
  );
}

export function JourneyMap() {
  return (
    <figure className="journey">
      <Diagram layout={WIDE} className="wide" id="journey-wide" />
      <Diagram layout={TALL} className="tall" id="journey-tall" />
      <figcaption className="small muted">
        Solid lines move a contact forward; dashed lines are the loops back. The stage is set by the highest-intent
        action, not by how much a contact does.
      </figcaption>
    </figure>
  );
}
