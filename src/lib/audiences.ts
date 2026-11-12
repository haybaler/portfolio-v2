/**
 * HCP audience demo. Diagnosis codes are real ICD-10-CM codes (FY2027 set, checked against the code set).
 * The specialty mapping is illustrative. Every count is made up. Aggregates only: no names, no NPIs, no patient data.
 */
import { rng } from "@/lib/rng";
import { TERRITORIES, type Territory } from "@/lib/sales";

export interface Condition {
  code: string;
  label: string;
  description: string;
  specialties: string[];
}

export const CONDITIONS: Condition[] = [
  { code: "C91.10", label: "Chronic Lymphocytic Leukemia", description: "Chronic lymphocytic leukemia of B-cell type not having achieved remission", specialties: ["Hematology & Oncology", "Medical Oncology", "Hematopathology"] },
  { code: "C92.10", label: "Chronic Myeloid Leukemia", description: "Chronic myeloid leukemia, BCR/ABL-positive, not having achieved remission", specialties: ["Hematology & Oncology", "Medical Oncology", "Hematopathology"] },
  { code: "C90.00", label: "Multiple Myeloma", description: "Multiple myeloma not having achieved remission", specialties: ["Hematology & Oncology", "Medical Oncology", "Hematopathology"] },
  { code: "B20", label: "HIV Disease", description: "Human immunodeficiency virus [HIV] disease", specialties: ["Infectious Disease", "Internal Medicine"] },
  { code: "D69.6", label: "Thrombocytopenia", description: "Thrombocytopenia, unspecified", specialties: ["Hematology", "Hematology & Oncology", "Internal Medicine"] },
  { code: "C34.90", label: "Lung Cancer", description: "Malignant neoplasm of unspecified part of unspecified bronchus or lung", specialties: ["Medical Oncology", "Pulmonary Disease", "Thoracic Surgery"] },
  { code: "M05.9", label: "Rheumatoid Arthritis", description: "Rheumatoid arthritis with rheumatoid factor, unspecified", specialties: ["Rheumatology", "Internal Medicine"] },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Made-up count of HCPs in one specialty and territory who treat the condition. */
export function hcpCount(code: string, specialty: string, territory: Territory, rank: number): number {
  const r = rng(hash(`${code}|${specialty}|${territory}`));
  const base = rank === 0 ? 260 : rank === 1 ? 150 : 70;
  return Math.round(base * (0.6 + r() * 0.8));
}

export interface AudienceRow {
  specialty: string;
  hcps: number;
}

export function audience(code: string, territories: Territory[]): { rows: AudienceRow[]; total: number } {
  const c = CONDITIONS.find((x) => x.code === code);
  if (!c) return { rows: [], total: 0 };
  const rows = c.specialties.map((specialty, rank) => ({
    specialty,
    hcps: territories.reduce((s, t) => s + hcpCount(code, specialty, t, rank), 0),
  }));
  return { rows, total: rows.reduce((s, r) => s + r.hcps, 0) };
}

export interface ReportRow extends AudienceRow {
  reached: number;
  engaged: number;
  requests: number;
}

/** Made-up campaign results for the audience, in the funnel order a report-back would show. */
export function reportBack(rows: AudienceRow[], code: string): ReportRow[] {
  return rows.map((row) => {
    const r = rng(hash(`report|${code}|${row.specialty}`));
    const reached = Math.round(row.hcps * (0.6 + r() * 0.25));
    const engaged = Math.round(reached * (0.08 + r() * 0.12));
    const requests = Math.round(engaged * (0.06 + r() * 0.1));
    return { ...row, reached, engaged, requests };
  });
}

export { TERRITORIES };
