/**
 * Brand-guidelines demo for an invented company, Quillmere Bio.
 * The same rules the guidelines file states are checked in code, so the checklist can't drift from the doc.
 */

export const BRAND = {
  colors: { teal: "#0e6e6b", ink: "#17202a", mist: "#eef3f2", signal: "#f2a541" },
  font: "Source Sans 3",
  banned: ["best", "revolutionary", "guaranteed", "world-class", "breakthrough"],
  ruo: "For Research Use Only. Not for use in diagnostic procedures.",
  maxHeadlineWords: 8,
};

export const GUIDELINES_MD = `# Quillmere Bio brand guidelines

## Color
- Teal ${BRAND.colors.teal}: primary, buttons and links
- Ink ${BRAND.colors.ink}: text
- Mist ${BRAND.colors.mist}: backgrounds
- Signal ${BRAND.colors.signal}: one highlight per piece, never text

## Type
- ${BRAND.font} for everything. No other faces.

## Voice
- Plain and specific. Write for a translational scientist.
- Headlines: ${BRAND.maxHeadlineWords} words or fewer.
- Never: ${BRAND.banned.map((w) => `"${w}"`).join(", ")}.
- Every performance claim points to data on file.

## Required
- Every piece carries: "${BRAND.ruo}"
- Logo clear space: the height of the Q on all sides.
`;

export interface Collateral {
  headline: string;
  body: string;
  cta: string;
  footer: string;
  colors: string[];
  font: string;
}

export const DRAFT: Collateral = {
  headline: "The Best Revolutionary Biomarker Platform Ever Made For Your Lab!",
  body: "Guaranteed results every single time. Order today and see why everyone is switching.",
  cta: "Buy now!!!",
  footer: "",
  colors: ["#7b2ff7", "#f107a3"],
  font: "Arial",
};

export const ON_BRAND: Collateral = {
  headline: "Find your next biomarker in one run",
  body: "Profile hundreds of proteins from a single plasma sample, so translational teams reach validation sooner. Validation data on file.",
  cta: "Request the validation data",
  footer: BRAND.ruo,
  colors: [BRAND.colors.teal, BRAND.colors.ink, BRAND.colors.mist],
  font: BRAND.font,
};

export interface Check {
  rule: string;
  pass: boolean;
  detail: string;
}

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function checkBrand(c: Collateral): Check[] {
  const palette = Object.values(BRAND.colors);
  const offPalette = c.colors.filter((x) => !palette.includes(x.toLowerCase()));
  const text = `${c.headline} ${c.body} ${c.cta}`.toLowerCase();
  const bannedHit = BRAND.banned.filter((w) => new RegExp(`\\b${w}\\b`).test(text));
  return [
    { rule: "Colors from the palette", pass: offPalette.length === 0, detail: offPalette.length ? `Off-palette: ${offPalette.join(", ")}` : "Teal, ink and mist only" },
    { rule: `Typeface is ${BRAND.font}`, pass: c.font === BRAND.font, detail: c.font === BRAND.font ? BRAND.font : `Uses ${c.font}` },
    { rule: `Headline ${BRAND.maxHeadlineWords} words or fewer`, pass: words(c.headline) <= BRAND.maxHeadlineWords, detail: `${words(c.headline)} words` },
    { rule: "No banned words", pass: bannedHit.length === 0, detail: bannedHit.length ? `Found: ${bannedHit.join(", ")}` : "None found" },
    { rule: "Claims point to data on file", pass: /data on file|validation data/i.test(`${c.body} ${c.cta}`), detail: /data on file|validation data/i.test(`${c.body} ${c.cta}`) ? "Cites validation data" : "Unsupported claim" },
    { rule: "Research Use Only line", pass: c.footer.includes(BRAND.ruo), detail: c.footer.includes(BRAND.ruo) ? "Present" : "Missing" },
  ];
}
