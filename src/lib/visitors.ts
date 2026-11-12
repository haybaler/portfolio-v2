/**
 * Website visitor identification demo, on made-up data.
 * A provider resolves a visit to a company and job title; these rules decide fit, intent and what happens next.
 * Companies are invented. No personal names, ever: company and job title only.
 */
import type { Territory } from "@/lib/sales";

export type Segment = "Biopharma" | "CRO" | "Academic medical center" | "Diagnostics" | "Other";
export type Page = "pricing" | "validation" | "demo" | "product" | "blog" | "careers";
export type Source = "LinkedIn ad" | "Paid search" | "Email" | "Organic search" | "Event QR code" | "Direct";

export interface Visit {
  id: string;
  time: string;
  company: string;
  segment: Segment;
  /** On the named target-account list. */
  target: boolean;
  territory: Territory;
  title: string;
  source: Source;
  pages: Page[];
  /** Visits from this company in the last 14 days, including this one. */
  visits14d: number;
}

export const ICP_SEGMENTS: Segment[] = ["Biopharma", "CRO", "Academic medical center", "Diagnostics"];
const BUYER = /(biomarker|translational|precision medicine|companion diagnostic|proteomic|genomic|lab(oratory)? manager|director|head of)/i;
const NOT_BUYER = /(recruit|talent|student|sales|marketing)/i;

export const isBuyerTitle = (title: string) => BUYER.test(title) && !NOT_BUYER.test(title);
export const isFitCompany = (v: Visit) => v.target || ICP_SEGMENTS.includes(v.segment);

export type Fit = "target-buyer" | "fit-buyer" | "fit-other" | "none";

export function fit(v: Visit): Fit {
  if (!isFitCompany(v)) return "none";
  if (!isBuyerTitle(v.title)) return "fit-other";
  return v.target ? "target-buyer" : "fit-buyer";
}

export const FIT_LABEL: Record<Fit, string> = {
  "target-buyer": "Target account, buyer title",
  "fit-buyer": "Fit account, buyer title",
  "fit-other": "Fit account, other role",
  none: "No fit",
};

export const POINTS: Record<Page, number> = { demo: 40, pricing: 30, validation: 25, product: 10, blog: 5, careers: 0 };
export const REPEAT_POINTS = 15;
export const REPEAT_CAP = 30;
export const HOT = 70;
export const WARM = 40;

export type Tier = "Hot" | "Warm" | "Cold";

export function intent(v: Visit): { score: number; tier: Tier; breakdown: { reason: string; points: number }[] } {
  const breakdown: { reason: string; points: number }[] = [];
  const seen = new Set<Page>();
  let productPoints = 0;
  for (const p of v.pages) {
    if (p === "product") {
      if (productPoints < 20) {
        productPoints += POINTS.product;
        breakdown.push({ reason: "Viewed a product page", points: POINTS.product });
      }
      continue;
    }
    if (seen.has(p) || POINTS[p] === 0) continue;
    seen.add(p);
    const reason = { demo: "Opened the demo request page", pricing: "Viewed pricing", validation: "Downloaded validation data", blog: "Read a blog post", careers: "" }[p];
    breakdown.push({ reason, points: POINTS[p] });
  }
  const repeat = Math.min(REPEAT_CAP, Math.max(0, v.visits14d - 1) * REPEAT_POINTS);
  if (repeat) breakdown.push({ reason: `${v.visits14d} visits in 14 days`, points: repeat });
  const score = breakdown.reduce((s, b) => s + b.points, 0);
  return { score, tier: score >= HOT ? "Hot" : score >= WARM ? "Warm" : "Cold", breakdown };
}

export interface Actions {
  logged: true;
  retarget: boolean;
  alert: boolean;
}

/** Every identified visit is logged with its source; outreach depends on fit and intent. */
export function actions(v: Visit): Actions {
  const f = fit(v);
  const { tier } = intent(v);
  const fitCompany = f !== "none";
  return {
    logged: true,
    retarget: fitCompany && tier !== "Cold",
    alert: (f === "target-buyer" || f === "fit-buyer") && tier === "Hot",
  };
}

export const repFor = (t: Territory) => `${t} rep (${t.slice(0, 2).toUpperCase()}-1)`;

export const VISITS: Visit[] = [
  { id: "v1", time: "08:12", company: "Talvisk Bio", segment: "Biopharma", target: true, territory: "Northeast", title: "Director, Biomarker Discovery", source: "LinkedIn ad", pages: ["product", "validation", "pricing"], visits14d: 3 },
  { id: "v2", time: "08:47", company: "Orrenby Labs", segment: "CRO", target: true, territory: "Midwest", title: "Associate Director, Translational Medicine", source: "Email", pages: ["product", "product"], visits14d: 1 },
  { id: "v3", time: "09:05", company: "Mallowin Staffing", segment: "Other", target: false, territory: "West", title: "Technical Recruiter", source: "Organic search", pages: ["careers", "product"], visits14d: 1 },
  { id: "v4", time: "09:31", company: "Kendrova Therapeutics", segment: "Biopharma", target: false, territory: "Southeast", title: "Senior Scientist, Immunology", source: "Paid search", pages: ["product", "pricing", "validation"], visits14d: 2 },
  { id: "v5", time: "10:02", company: "Lunderby University Medical Center", segment: "Academic medical center", target: true, territory: "West", title: "Head of Precision Medicine", source: "Event QR code", pages: ["product", "demo", "pricing"], visits14d: 2 },
  { id: "v6", time: "10:40", company: "Narvelle Dx", segment: "Diagnostics", target: false, territory: "Southwest", title: "Laboratory Manager", source: "Organic search", pages: ["blog", "product"], visits14d: 1 },
  { id: "v7", time: "11:15", company: "Glissom Research", segment: "CRO", target: true, territory: "Southeast", title: "Head of Proteomics", source: "Direct", pages: ["validation", "pricing"], visits14d: 4 },
];

/** Visits that arrive when the visitor presses "Play the next visit". */
export const QUEUE: Visit[] = [
  { id: "v8", time: "11:52", company: "Pellivor Biosciences", segment: "Biopharma", target: true, territory: "Northeast", title: "Director, Translational Sciences", source: "LinkedIn ad", pages: ["product", "demo"], visits14d: 2 },
  { id: "v9", time: "12:20", company: "Starnwick Analytics", segment: "Other", target: false, territory: "Midwest", title: "Marketing Manager", source: "Paid search", pages: ["blog"], visits14d: 1 },
  { id: "v10", time: "12:58", company: "Calvenna Genomics", segment: "Diagnostics", target: false, territory: "West", title: "Director, Companion Diagnostics", source: "Email", pages: ["validation", "product", "pricing"], visits14d: 1 },
];
