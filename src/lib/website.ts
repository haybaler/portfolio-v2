/**
 * "A website I update by asking AI": made-up content and analytics for Quillmere Bio, an invented company.
 * Two conversations on a phone: a site-wide rename through Sanity's MCP server, and a question for the PostHog
 * plugin about lead-gen form conversion that ends in a code change. Every count below is made up.
 */

export const RENAME = { from: "CAR-T", to: "Gene Therapy" } as const;

export type DocType = "Menu" | "Page" | "Product" | "Post" | "Settings";

export interface Mention {
  doc: string;
  type: DocType;
  field: string;
  before: string;
  /** The drafted change, when the mention is the brand name. */
  after?: string;
  /** Why Claude left it as written, when it isn't. */
  keep?: string;
}

export const MENTIONS: Mention[] = [
  { doc: "Main menu", type: "Menu", field: "Solutions › label", before: "CAR-T", after: "Gene Therapy" },
  { doc: "Home", type: "Page", field: "Hero card", before: "Explore CAR-T solutions", after: "Explore Gene Therapy solutions" },
  { doc: "Solutions: CAR-T", type: "Page", field: "Title", before: "CAR-T", after: "Gene Therapy" },
  { doc: "Solutions: CAR-T", type: "Page", field: "URL", before: "/solutions/car-t", after: "/solutions/gene-therapy" },
  { doc: "Solutions: CAR-T", type: "Page", field: "Intro", before: "Biomarker panels for CAR-T programs, from discovery to release.", after: "Biomarker panels for Gene Therapy programs, from discovery to release." },
  { doc: "Solutions: CAR-T", type: "Page", field: "SEO description", before: "CAR-T biomarker panels and potency assays from Quillmere Bio.", after: "Gene Therapy biomarker panels and potency assays from Quillmere Bio." },
  { doc: "Solutions: CAR-T", type: "Page", field: "Customer quote", before: "“The panel slotted straight into our CAR-T workflow.”", keep: "A customer's words, left as said" },
  { doc: "Cytokine release panel", type: "Product", field: "Description", before: "40 cytokines from one sample, built for CAR-T safety studies.", after: "40 cytokines from one sample, built for Gene Therapy safety studies." },
  { doc: "Persistence assay", type: "Product", field: "Description", before: "Tracks CAR-T persistence after infusion.", keep: "Describes the cells, not the brand" },
  { doc: "What we learned at the CAR-T Summit", type: "Post", field: "Title", before: "What we learned at the CAR-T Summit", keep: "The name of an event" },
  { doc: "Footer", type: "Settings", field: "Link label", before: "CAR-T", after: "Gene Therapy" },
];

const unique = <T,>(xs: T[]) => [...new Set(xs)];
export const DOCUMENTS = unique(MENTIONS.map((m) => m.doc));
export const CHANGES = MENTIONS.filter((m) => m.after);
export const KEPT = MENTIONS.filter((m) => m.keep);
export const CHANGED_DOCUMENTS = unique(CHANGES.map((m) => m.doc));
export const REDIRECT = { from: "/solutions/car-t", to: "/solutions/gene-therapy" };

/** Lead-gen forms, last 30 days. Started = typed in at least one field; conversion = submitted ÷ views. */
export interface Form {
  name: string;
  views: number;
  started: number;
  submitted: number;
  fields: number;
}

export const FORMS: Form[] = [
  { name: "Download validation data", views: 1380, started: 702, submitted: 456, fields: 4 },
  { name: "Request a quote", views: 2140, started: 612, submitted: 148, fields: 9 },
  { name: "Talk to a scientist", views: 860, started: 190, submitted: 41, fields: 7 },
];

export const pct = (n: number, of: number, digits = 1) => `${((n / of) * 100).toFixed(digits)}%`;
export const conversion = (f: Form) => pct(f.submitted, f.views);

/** The quote form, field by field: how many of the people who started it reached each field. */
export const QUOTE_FIELDS: { field: string; reached: number; required: boolean }[] = [
  { field: "Email", reached: 612, required: true },
  { field: "Name", reached: 601, required: true },
  { field: "Company", reached: 590, required: true },
  { field: "Phone", reached: 571, required: true },
  { field: "Job title", reached: 309, required: true },
  { field: "Company size", reached: 286, required: true },
  { field: "Budget", reached: 241, required: true },
  { field: "Timeline", reached: 196, required: true },
  { field: "Message", reached: 171, required: false },
];

/** Share of the people who reach a field and leave the form there (they never reach the next one). */
export function leaveRate(i: number): number {
  const here = QUOTE_FIELDS[i].reached;
  const next = i + 1 < QUOTE_FIELDS.length ? QUOTE_FIELDS[i + 1].reached : QUOTE_FORM_SUBMITTED;
  return (here - next) / here;
}
export const QUOTE_FORM_SUBMITTED = 148;
export const WORST_FIELD = QUOTE_FIELDS.reduce((w, _f, i) => (leaveRate(i) > leaveRate(w) ? i : w), 0);

/** Quote form conversion by device, last 30 days. */
export const QUOTE_DEVICES = [
  { device: "Phones", views: 980, submitted: 30 },
  { device: "Desktop", views: 1160, submitted: 118 },
];

/** The new quote form: phone optional; job title, company size, budget and timeline come from CRM enrichment. */
export const NEW_QUOTE_FIELDS = ["Email", "Name", "Company", "Phone (optional)", "Message"];

export const QUOTE_DIFF = `  <Field name="email" type="email" autoComplete="email" required />
  <Field name="name" autoComplete="name" required />
  <Field name="company" autoComplete="organization" required />
- <Field name="phone" type="tel" required />
+ <Field name="phone" type="tel" autoComplete="tel" label="Phone (Optional)" />
- <Field name="jobTitle" required />
- <Select name="companySize" options={SIZES} required />
- <Select name="budget" options={BUDGETS} required />
- <Select name="timeline" options={TIMELINES} required />
  <TextArea name="message" />
+ {/* Job title, company size, budget and timeline: filled by CRM enrichment after submit */}`;

export const diffStats = (diff: string) => ({
  added: diff.split("\n").filter((l) => l.startsWith("+ ")).length,
  removed: diff.split("\n").filter((l) => l.startsWith("- ")).length,
});
