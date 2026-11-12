/**
 * CRM lifecycle and attribution demo, on made-up data.
 * Every touch carries its channel (UTMs online, offline campaigns for events). A contact's stage is set by the
 * highest-intent action at the account, and won revenue is credited back to channels at the account level.
 * Companies are invented. People appear by job title only.
 */
import { rng } from "@/lib/rng";

export const CHANNELS = ["Events", "Webinars", "Paid ads", "Email", "Organic search"] as const;
export type Channel = (typeof CHANNELS)[number];

/** Fully loaded spend for the year. Events include booth, travel, shipping and materials, not just the fee. */
export const SPEND: Record<Channel, number> = {
  Events: 140_000,
  Webinars: 25_000,
  "Paid ads": 70_000,
  Email: 12_000,
  "Organic search": 18_000,
};

export type Stage = "Lead" | "MQL" | "SQL";
export const STAGES: Stage[] = ["Lead", "MQL", "SQL"];

export type Action =
  | "Clicked an ad"
  | "Found us in search"
  | "Clicked a nurture email"
  | "Registered for an event"
  | "Registered for a webinar"
  | "Attended a webinar"
  | "Talked to us at a booth";

/** The stage an action earns on its own. Actions without one keep the current stage. */
export const ACTION_STAGE: Partial<Record<Action, Stage>> = {
  "Registered for an event": "Lead",
  "Registered for a webinar": "Lead",
  "Attended a webinar": "MQL",
  "Talked to us at a booth": "SQL",
};

/** What happens next at each stage. */
export const NEXT_STEP: Record<Stage, string> = {
  Lead: "Automated nurture",
  MQL: "Automated nurture",
  SQL: "Rep review, then sales sequence",
};

export interface Touch {
  date: string;
  /** Job title only, never a name. */
  person: string;
  channel: Channel;
  action: Action;
}

export interface Deal {
  id: string;
  company: string;
  amount: number;
  closed: string;
  touches: Touch[];
}

export type Model = "W-shaped" | "First touch";
export const MODELS: Model[] = ["W-shaped", "First touch"];

/** W-shaped weights: first touch, lead creation and opportunity creation 30% each; the rest share 10%. */
export const W_MILESTONE = 0.3;
export const W_REST = 0.1;

const rank = (s: Stage | null) => (s ? STAGES.indexOf(s) + 1 : 0);

/** The account's stage after each touch: the highest-intent action so far, never lower. */
export function stages(touches: Touch[]): (Stage | null)[] {
  let best: Stage | null = null;
  return touches.map((t) => {
    const s = ACTION_STAGE[t.action] ?? null;
    if (rank(s) > rank(best)) best = s;
    return best;
  });
}

/** Index of the touch that created the lead (first to reach Lead) and the opportunity (first to reach SQL). */
export function milestones(touches: Touch[]): { first: number; lead: number; opp: number } {
  const s = stages(touches);
  return { first: 0, lead: s.findIndex((x) => rank(x) >= 1), opp: s.findIndex((x) => x === "SQL") };
}

/** Share of the deal each touch earns under a model. Shares always add up to 1. */
export function credit(touches: Touch[], model: Model): number[] {
  const w = touches.map(() => 0);
  if (!touches.length) return w;
  if (model === "First touch") {
    w[0] = 1;
    return w;
  }
  const m = milestones(touches);
  const key = [...new Set([m.first, m.lead, m.opp].filter((i) => i >= 0))];
  for (const i of [m.first, m.lead, m.opp]) if (i >= 0) w[i] += W_MILESTONE;
  const rest = touches.map((_, i) => i).filter((i) => !key.includes(i));
  for (const i of rest) w[i] += W_REST / rest.length;
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => x / total);
}

/** Lookback window: how far before the opportunity was created a touch can be and still earn credit. */
export type Window = "30 days" | "60 days" | "90 days" | "Full cycle";
export const WINDOWS: Window[] = ["30 days", "60 days", "90 days", "Full cycle"];
const WINDOW_DAYS: Record<Window, number> = { "30 days": 30, "60 days": 60, "90 days": 90, "Full cycle": Infinity };

const DAY = 86_400_000;
const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);

/** The touches that count: up to N days before the opportunity was created, plus everything after it. */
export function inWindow(touches: Touch[], window: Window): Touch[] {
  const opp = milestones(touches).opp;
  if (opp < 0) return touches;
  const oppDate = touches[opp].date;
  return touches.filter((t) => daysBetween(t.date, oppDate) <= WINDOW_DAYS[window]);
}

export interface ChannelRow {
  channel: Channel;
  spend: number;
  revenue: number;
  /** (Attributed revenue − spend) ÷ spend. */
  roi: number;
}

export function byChannel(deals: Deal[], model: Model, window: Window = "Full cycle"): ChannelRow[] {
  const revenue = Object.fromEntries(CHANNELS.map((c) => [c, 0])) as Record<Channel, number>;
  for (const d of deals) {
    const touches = inWindow(d.touches, window);
    credit(touches, model).forEach((share, i) => {
      revenue[touches[i].channel] += share * d.amount;
    });
  }
  return CHANNELS.map((channel) => {
    const r = Math.round(revenue[channel]);
    return { channel, spend: SPEND[channel], revenue: r, roi: (r - SPEND[channel]) / SPEND[channel] };
  });
}

export const totalSpend = () => CHANNELS.reduce((s, c) => s + SPEND[c], 0);

/** Touches that earn credit under a window, out of all touches. */
export function touchesCounted(deals: Deal[], window: Window) {
  return {
    counted: deals.reduce((s, d) => s + inWindow(d.touches, window).length, 0),
    total: deals.reduce((s, d) => s + d.touches.length, 0),
  };
}

export interface Significance {
  channel: Channel;
  /** ROI on the actual deals. */
  roi: number;
  /** 95% of resampled years fall between these ROIs. */
  low: number;
  high: number;
  /** Share of resampled years where the channel did not earn back its spend (one-sided). */
  p: number;
  significant: boolean;
}

export const RESAMPLES = 2000;
export const ALPHA = 0.05;

/**
 * Bootstrap test: redraw the year's won deals with replacement many times and recompute each channel's ROI. A channel
 * earns back its spend with significance when fewer than 5% of redraws leave its ROI at or below zero.
 */
export function significance(deals: Deal[], model: Model, window: Window = "Full cycle", seed = 7): Significance[] {
  const draw = rng(seed);
  const actual = byChannel(deals, model, window);
  const samples = CHANNELS.map(() => [] as number[]);
  for (let r = 0; r < RESAMPLES; r++) {
    const pick = deals.map(() => deals[Math.floor(draw() * deals.length)]);
    byChannel(pick, model, window).forEach((row, i) => samples[i].push(row.roi));
  }
  return CHANNELS.map((channel, i) => {
    const xs = samples[i].sort((a, b) => a - b);
    const at = (q: number) => xs[Math.min(xs.length - 1, Math.floor(q * xs.length))];
    const p = xs.filter((x) => x <= 0).length / xs.length;
    return { channel, roi: actual[i].roi, low: at(0.025), high: at(0.975), p, significant: p < ALPHA };
  });
}

export const DEALS: Deal[] = [
  {
    id: "d1",
    company: "Quorvane Therapeutics",
    amount: 180_000,
    closed: "2026-09-18",
    touches: [
      { date: "2026-01-12", person: "Director, Biomarker Discovery", channel: "Paid ads", action: "Clicked an ad" },
      { date: "2026-02-03", person: "Laboratory Manager", channel: "Events", action: "Registered for an event" },
      { date: "2026-02-20", person: "Laboratory Manager", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-03-11", person: "Senior Scientist, Proteomics", channel: "Webinars", action: "Attended a webinar" },
      { date: "2026-04-14", person: "Director, Biomarker Discovery", channel: "Events", action: "Talked to us at a booth" },
    ],
  },
  {
    id: "d2",
    company: "Ettlemoor Labs",
    amount: 95_000,
    closed: "2026-08-07",
    touches: [
      { date: "2026-02-09", person: "Head of Translational Science", channel: "Organic search", action: "Found us in search" },
      { date: "2026-02-24", person: "Head of Translational Science", channel: "Webinars", action: "Registered for a webinar" },
      { date: "2026-03-10", person: "Head of Translational Science", channel: "Webinars", action: "Attended a webinar" },
      { date: "2026-03-30", person: "Laboratory Manager", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-05-19", person: "Head of Translational Science", channel: "Events", action: "Talked to us at a booth" },
    ],
  },
  {
    id: "d3",
    company: "Pindrel Bio",
    amount: 240_000,
    closed: "2026-07-24",
    touches: [
      { date: "2026-03-02", person: "VP, Precision Medicine", channel: "Events", action: "Registered for an event" },
      { date: "2026-04-14", person: "VP, Precision Medicine", channel: "Events", action: "Talked to us at a booth" },
      { date: "2026-05-06", person: "Procurement Manager", channel: "Email", action: "Clicked a nurture email" },
    ],
  },
  {
    id: "d4",
    company: "Tamsery Genomics",
    amount: 120_000,
    closed: "2026-10-02",
    touches: [
      { date: "2026-03-16", person: "Director, Genomics Core", channel: "Paid ads", action: "Clicked an ad" },
      { date: "2026-04-01", person: "Director, Genomics Core", channel: "Webinars", action: "Registered for a webinar" },
      { date: "2026-04-22", person: "Senior Scientist, Genomics", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-05-13", person: "Senior Scientist, Genomics", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-06-09", person: "Director, Genomics Core", channel: "Events", action: "Talked to us at a booth" },
    ],
  },
  {
    id: "d5",
    company: "Corvallin Dx",
    amount: 70_000,
    closed: "2026-09-29",
    touches: [
      { date: "2026-04-06", person: "Laboratory Director", channel: "Organic search", action: "Found us in search" },
      { date: "2026-04-20", person: "Laboratory Director", channel: "Events", action: "Registered for an event" },
      { date: "2026-05-12", person: "Clinical Scientist", channel: "Webinars", action: "Attended a webinar" },
      { date: "2026-05-28", person: "Laboratory Director", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-06-09", person: "Laboratory Director", channel: "Events", action: "Talked to us at a booth" },
    ],
  },
  {
    id: "d6",
    company: "Brisholt Research",
    amount: 150_000,
    closed: "2026-10-16",
    touches: [
      { date: "2026-04-27", person: "Head of Proteomics", channel: "Email", action: "Clicked a nurture email" },
      { date: "2026-05-18", person: "Head of Proteomics", channel: "Events", action: "Registered for an event" },
      { date: "2026-06-09", person: "Head of Proteomics", channel: "Events", action: "Talked to us at a booth" },
      { date: "2026-07-14", person: "Associate Director, Proteomics", channel: "Paid ads", action: "Clicked an ad" },
    ],
  },
];
