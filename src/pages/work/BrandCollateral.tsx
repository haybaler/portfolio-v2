import { useState } from "react";
import { DemoFrame, Seg } from "@/components/demo-ui";
import { useStack } from "@/components/stack";
import { BRAND, DRAFT, GUIDELINES_MD, ON_BRAND, checkBrand, type Collateral } from "@/lib/brand";

const MODES = ["Without guidelines", "With brand-guidelines.md"] as const;
type Mode = (typeof MODES)[number];

export default function BrandCollateral() {
  const { map } = useStack();
  const [mode, setMode] = useState<Mode>("With brand-guidelines.md");
  const piece = mode === MODES[0] ? DRAFT : ON_BRAND;
  const checks = checkBrand(piece);
  const passed = checks.filter((c) => c.pass).length;

  return (
    <DemoFrame
      slug="brand-collateral"
      problem="Every flyer and ad went through rounds of “wrong blue, wrong font, missing RUO line.” Reviews were about the brand, not the message."
      built={[
        <>A single <code>brand-guidelines.md</code>: palette, type, voice, banned claims and required lines.</>,
        <>Automatic checks on every draft, before anyone reviews it.</>,
        <>Used with Claude Code, Codex or Gemini CLI to produce {map.short} emails, ads and pages.</>,
      ]}
    >
      <div className="brand">
        <div className="brand-bar">
          <Seg label="Draft" options={MODES} value={mode} onChange={setMode} nudge="Without guidelines" />
          <span className="label">Quillmere Bio Is an Invented Company</span>
        </div>
        <div className="brand-grid">
          <figure className="brand-md">
            <figcaption className="label">brand-guidelines.md</figcaption>
            <pre>{GUIDELINES_MD}</pre>
          </figure>
          <div className="brand-out">
            <AdPreview c={piece} />
            <div className="checks">
              <p className="checks-head">
                <b>{passed} of {checks.length}</b> brand rules pass
              </p>
              <ul>
                {checks.map((c) => (
                  <li key={c.rule} className={c.pass ? "pass" : "fail"}>
                    <span className="check-mark" aria-hidden>{c.pass ? "✓" : "✕"}</span>
                    <span><b>{c.rule}</b> <span className="muted">{c.detail}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}

function AdPreview({ c }: { c: Collateral }) {
  const onBrand = c.font === BRAND.font;
  const bg = onBrand ? BRAND.colors.mist : `linear-gradient(135deg, ${c.colors[0]}, ${c.colors[1]})`;
  const ink = onBrand ? BRAND.colors.ink : "#ffffff";
  const btn = onBrand ? BRAND.colors.teal : "#ffe600";
  const btnInk = onBrand ? "#ffffff" : "#000000";
  return (
    <div className="ad" style={{ background: bg, color: ink, fontFamily: `"${c.font}", Arial, sans-serif` }} role="img" aria-label={`Ad preview: ${c.headline}`}>
      <div className="ad-logo" style={{ color: onBrand ? BRAND.colors.teal : "#ffffff" }}>Quillmere Bio</div>
      <p className="ad-headline">{c.headline}</p>
      <p className="ad-body">{c.body}</p>
      <span className="ad-cta" style={{ background: btn, color: btnInk }}>{c.cta}</span>
      <p className="ad-foot">{c.footer || " "}</p>
    </div>
  );
}
