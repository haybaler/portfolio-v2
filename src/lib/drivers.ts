/**
 * What moves revenue: HubSpot engagement per account, joined in the business context engine to the revenue the
 * NetSuite general ledger booked to that account in the next 90 days. Made-up accounts with a fixed seed.
 *
 * Two steps, as in the real work:
 * 1. A machine-learning model (gradient-boosted decision stumps) ranks the signals by how much they help predict
 *    booked revenue (gain importance).
 * 2. A significance test verifies each signal: a multiple regression of revenue on all signals at once, with a
 *    two-sided t-test on each coefficient. A signal is verified at p < 0.05.
 * The model can credit a signal that only rides along with a real driver (email volume rises with meetings); the
 * test, which holds the other signals fixed, is what catches it.
 */
import { rng } from "@/lib/rng";
import { ibeta, mean } from "@/lib/stats";

export const SIGNALS = [
  { key: "meetings", name: "Meetings held", unit: "per meeting" },
  { key: "emails", name: "Emails sent", unit: "per email" },
  { key: "calls", name: "Calls logged", unit: "per call" },
  { key: "fast", name: "First reply within 4 hours", unit: "when it happens" },
  { key: "events", name: "Events attended", unit: "per event" },
] as const;
export type SignalKey = (typeof SIGNALS)[number]["key"];

/** How each signal reads inside a sentence ("meetings, events and fast first replies move revenue"). */
export const SIGNAL_PHRASE: Record<SignalKey, string> = {
  meetings: "meetings",
  emails: "email volume",
  calls: "call volume",
  fast: "fast first replies",
  events: "events",
};

/** "a", "a and b", "a, b and c". */
export const listOf = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export interface Account {
  id: string;
  signals: Record<SignalKey, number>;
  /** Revenue the general ledger booked to the account in the 90 days after the quarter. */
  glRevenue: number;
}

/** Made-up accounts. Revenue depends on meetings, fast first replies and events; emails and calls only ride along. */
export function accounts(n = 160, seed = 11): Account[] {
  const r = rng(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
  const out: Account[] = [];
  for (let i = 0; i < n; i++) {
    const meetings = Math.floor(r() * 9) + (r() < 0.3 ? Math.floor(r() * 4) : 0);
    const emails = Math.round(meetings * 2.6 + r() * 10);
    const calls = Math.floor(r() * 10);
    const fast = r() < 0.55 ? 1 : 0;
    const events = r() < 0.4 ? (r() < 0.3 ? 2 : 1) : 0;
    const revenue = 4_300 + 1_500 * meetings + 3_400 * fast + 2_150 * events + normal() * 5_000;
    out.push({
      id: `A-${String(i + 1).padStart(3, "0")}`,
      signals: { meetings, emails, calls, fast, events },
      glRevenue: Math.max(500, Math.round(revenue / 10) * 10),
    });
  }
  return out;
}

/**
 * Gradient-boosted decision stumps (squared error). Returns each feature's share of the total gain, in percent.
 * Small and deterministic: enough to rank five signals on a few hundred rows.
 */
export function boostedImportance(X: number[][], y: number[], rounds = 150, rate = 0.1): number[] {
  const n = y.length;
  const k = X[0].length;
  const base = mean(y);
  const pred = new Array(n).fill(base);
  const gain = new Array(k).fill(0);
  const order = Array.from({ length: k }, (_, j) => Array.from({ length: n }, (_, i) => i).sort((a, b) => X[a][j] - X[b][j]));
  for (let round = 0; round < rounds; round++) {
    const res = y.map((v, i) => v - pred[i]);
    const total = res.reduce((s, v) => s + v, 0);
    let best = { gain: 0, j: -1, cut: 0, left: 0, right: 0 };
    for (let j = 0; j < k; j++) {
      let sumL = 0;
      for (let p = 0; p < n - 1; p++) {
        const i = order[j][p];
        sumL += res[i];
        const next = order[j][p + 1];
        if (X[i][j] === X[next][j]) continue; // only split between different values
        const nL = p + 1;
        const nR = n - nL;
        const sumR = total - sumL;
        const g = (sumL * sumL) / nL + (sumR * sumR) / nR - (total * total) / n;
        if (g > best.gain) best = { gain: g, j, cut: (X[i][j] + X[next][j]) / 2, left: sumL / nL, right: sumR / nR };
      }
    }
    if (best.j < 0) break;
    gain[best.j] += best.gain;
    for (let i = 0; i < n; i++) pred[i] += rate * (X[i][best.j] <= best.cut ? best.left : best.right);
  }
  const sum = gain.reduce((s, g) => s + g, 0);
  return gain.map((g) => (sum === 0 ? 0 : (g / sum) * 100));
}

/** Inverse of a small square matrix (Gauss-Jordan with partial pivoting). */
function invert(m: number[][]): number[][] {
  const n = m.length;
  const a = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(a[r][c]) > Math.abs(a[p][c])) p = r;
    if (Math.abs(a[p][c]) < 1e-12) throw new Error("singular matrix");
    [a[c], a[p]] = [a[p], a[c]];
    const d = a[c][c];
    for (let j = 0; j < 2 * n; j++) a[c][j] /= d;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = a[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) a[r][j] -= f * a[c][j];
    }
  }
  return a.map((row) => row.slice(n));
}

/** Two-sided p-value for a t statistic with df degrees of freedom. */
export function tP(t: number, df: number): number {
  if (!Number.isFinite(t)) return 0;
  return ibeta(df / (df + t * t), df / 2, 0.5);
}

/**
 * Ordinary least squares with an intercept. Returns coefficients (intercept first), their standard errors, t, p,
 * the degrees of freedom and R².
 */
export function ols(X: number[][], y: number[]) {
  const n = y.length;
  const A = X.map((row) => [1, ...row]);
  const k = A[0].length;
  const xtx = Array.from({ length: k }, (_, i) => Array.from({ length: k }, (_, j) => A.reduce((s, row) => s + row[i] * row[j], 0)));
  const xty = Array.from({ length: k }, (_, i) => A.reduce((s, row, r) => s + row[i] * y[r], 0));
  const inv = invert(xtx);
  const beta = inv.map((row) => row.reduce((s, v, j) => s + v * xty[j], 0));
  const fitted = A.map((row) => row.reduce((s, v, j) => s + v * beta[j], 0));
  const sse = y.reduce((s, v, i) => s + (v - fitted[i]) ** 2, 0);
  const my = mean(y);
  const sst = y.reduce((s, v) => s + (v - my) ** 2, 0);
  const df = n - k;
  const sigma2 = sse / df;
  const se = inv.map((row, i) => Math.sqrt(Math.max(0, sigma2 * row[i])));
  const t = beta.map((b, i) => (se[i] === 0 ? Infinity : b / se[i]));
  const p = t.map((v) => tP(v, df));
  return { beta, se, t, p, df, r2: sst === 0 ? 0 : 1 - sse / sst };
}

export interface Driver {
  key: SignalKey;
  name: string;
  unit: string;
  /** Share of the model's total gain, in percent. */
  importance: number;
  /** Rank by importance, 1 = most important. */
  rank: number;
  /** Booked revenue per unit of the signal, holding the others fixed (regression coefficient). */
  effect: number;
  p: number;
  verified: boolean;
}

/** Rank the signals with the model, then verify each with the regression test. */
export function drivers(list: Account[] = accounts()) {
  const X = list.map((a) => SIGNALS.map((s) => a.signals[s.key]));
  const y = list.map((a) => a.glRevenue);
  const imp = boostedImportance(X, y);
  const fit = ols(X, y);
  const rows: Driver[] = SIGNALS.map((s, j) => ({
    key: s.key,
    name: s.name,
    unit: s.unit,
    importance: imp[j],
    rank: 0,
    effect: fit.beta[j + 1],
    p: fit.p[j + 1],
    verified: fit.p[j + 1] < 0.05,
  }));
  [...rows].sort((a, b) => b.importance - a.importance).forEach((d, i) => (d.rank = i + 1));
  rows.sort((a, b) => a.rank - b.rank);
  return { rows, n: list.length, r2: fit.r2, df: fit.df, revenue: y.reduce((s, v) => s + v, 0) };
}
