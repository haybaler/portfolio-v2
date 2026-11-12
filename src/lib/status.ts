/** Status always comes with a word, never colour alone (design system: Badge). */
export type Tone = "good" | "warn" | "bad";
export interface Status {
  tone: Tone;
  word: string;
}

export function planStatus(pct: number): Status {
  if (pct >= 100) return { tone: "good", word: "On plan" };
  if (pct >= 90) return { tone: "warn", word: "Behind plan" };
  return { tone: "bad", word: "At risk" };
}

export function complianceStatus(pct: number): Status {
  if (pct >= 85) return { tone: "good", word: "Compliant" };
  if (pct >= 70) return { tone: "warn", word: "Needs work" };
  return { tone: "bad", word: "At risk" };
}
