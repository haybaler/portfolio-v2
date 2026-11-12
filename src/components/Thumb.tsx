import "./Thumb.css";
import { thumbData, type ThumbData, type ThumbRow } from "@/lib/thumbs";

/**
 * Previews for the case-study cards: a small window showing one number from the case study's own made-up data
 * (src/lib/thumbs.ts) and the list behind it. Two drawings, because one drawing scaled to every card left small
 * cards with text nobody could read: a compact one for every card, and a wide one that takes over on cards at
 * least 600px across (the featured cards on desktop). Each fits its box whole; nothing is cropped.
 * Decorative and aria-hidden: the card's title and summary carry the meaning.
 */

function Chrome({ w, title }: { w: number; title?: string }) {
  return (
    <>
      <rect width={w} height="9" className="tp-chrome" />
      {[5, 9.5, 14].map((x) => (
        <circle key={x} cx={x} cy="4.5" r="1.2" className="tp-chrome-dot" />
      ))}
      {title && <text x="20" y="5.9" className="tp-meta">{title}</text>}
      <text x={w - 5} y="5.9" className="tp-meta" textAnchor="end">Made-Up Data</text>
    </>
  );
}

const fill = (r: ThumbRow) => (r.hi ? "tp-blue" : "tp-chart");
const tone = (r: ThumbRow) => (r.tone === "good" ? " tp-good" : r.tone === "bad" ? " tp-bad" : "");

/** 120 × 60: a label, the number, bars or a short list beside it, and one line. Read at 300px and up. */
function Compact({ d }: { d: ThumbData }) {
  const bars = d.rows.filter((r) => r.share !== undefined);
  const list = d.rows.slice(0, 3);
  return (
    <svg className="thumb thumb-sm" viewBox="0 0 120 60" aria-hidden="true" focusable="false">
      <rect width="120" height="60" className="tp-window" />
      <Chrome w={120} />
      <text x="6" y="19" className="tp-label">{d.label}</text>
      <text x="6" y="38" className="tp-value">{d.value}</text>
      {bars.length > 0
        ? bars.slice(0, 5).map((r, i, all) => {
            const pitch = 18 / all.length;
            const h = Math.min(3, pitch - 1);
            return (
              <g key={r.name}>
                <rect x="70" y={23 + i * pitch} width="44" height={h} className="tp-track" />
                <rect x="70" y={23 + i * pitch} width={44 * r.share!} height={h} className={fill(r)} />
              </g>
            );
          })
        : list.map((r, i) => (
            <text key={r.name} x="114" y={27 + i * 6} className={`tp-row${tone(r)}`} textAnchor="end">
              {r.name.length > 18 ? r.display : r.name}
            </text>
          ))}
      <text x="6" y="52" className="tp-note">{d.note}</text>
    </svg>
  );
}

/** 240 × 80: the same number with its list spelled out. Shown from 600px wide. */
function Wide({ d }: { d: ThumbData }) {
  const pitch = Math.min(8.5, 40 / d.rows.length);
  const hasBars = d.rows.some((r) => r.share !== undefined);
  return (
    <svg className="thumb thumb-lg" viewBox="0 0 240 80" aria-hidden="true" focusable="false">
      <rect width="240" height="80" className="tp-window" />
      <Chrome w={240} title={d.title} />
      <text x="10" y="24" className="tp-label">{d.label}</text>
      <text x="10" y="48" className="tp-value tp-value-lg">{d.value}</text>
      <text x="10" y="62" className="tp-note">{d.note}</text>
      <rect x="112" y="15" width="122" height="59" className="tp-panel" />
      <text x="118" y="24" className="tp-label">{d.sideLabel}</text>
      {d.rows.map((r, i) => {
        const y = 32.5 + i * pitch;
        return (
          <g key={r.name}>
            <text x="118" y={y} className="tp-row">{r.name}</text>
            {hasBars && r.share !== undefined && (
              <>
                <rect x="166" y={y - 3.2} width="34" height="3.6" className="tp-track" />
                <rect x="166" y={y - 3.2} width={34 * r.share} height="3.6" className={fill(r)} />
              </>
            )}
            <text x="229" y={y} className={`tp-fig${tone(r)}`} textAnchor="end">{r.display}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Thumb({ slug, large = false }: { slug: string; large?: boolean }) {
  const d = thumbData(slug);
  if (!d) return null;
  return (
    <>
      <Compact d={d} />
      {large && <Wide d={d} />}
    </>
  );
}
