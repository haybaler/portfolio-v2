// Title Case for headings, titles, nav, buttons and labels (Nov 5, 2026: Title Case across the site).
// Small words stay lowercase unless they start or end a phrase; a phrase restarts after ":", "·", "—", "?" or "!".
// Words that already carry their own capitals (HubSpot, bioRxiv, CRM, CAR-T) and file names are left alone.

const SMALL = new Set([
  "a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "nor", "of", "on", "onto", "or", "per",
  "the", "to", "vs", "via", "with",
]);
const BREAK = /^(:|·|—|–|\?|!|→)$/;

const cap = (w: string) => {
  if (/[A-Z]/.test(w.slice(1)) || /\.\w/.test(w) || /^\(.\)$/.test(w)) return w; // HubSpot, file.md, (r)
  const i = w.search(/[a-zA-Z]/);
  return i < 0 ? w : w.slice(0, i) + w[i].toUpperCase() + w.slice(i + 1);
};

export function titleCase(text: string): string {
  const parts = text.split(/(\s+)/);
  const words = parts.map((p, i) => ({ p, i })).filter(({ p }) => p.trim());
  const out = [...parts];
  let start = true;
  words.forEach(({ p, i }, n) => {
    if (BREAK.test(p)) {
      start = true;
      return;
    }
    const next = words[n + 1]?.p;
    const end = !next || BREAK.test(next) || /[:?!]$/.test(p);
    if (/\.\w/.test(p) && !/\s/.test(p) && !/\.$/.test(p)) {
      start = false; // a file name: leave it as written
      return;
    }
    out[i] = p
      .split("-")
      .map((piece, k) => {
        const bare = piece.replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "").toLowerCase();
        const small = SMALL.has(bare) && piece === piece.toLowerCase();
        return (start && k === 0) || (end && k === p.split("-").length - 1) || !small ? cap(piece) : piece;
      })
      .join("-");
    start = /[:?!]$/.test(p);
  });
  return out.join("");
}
