/**
 * Model-agnostic assistant demo for an ERP or CRM. Scripted: no model or business system is called.
 * One tool definition per system is shared by Claude, ChatGPT and Gemini; only the wire format of the call differs.
 * Answers come from the same made-up sales data as the dashboard demo, whichever system is picked.
 */
import { money } from "@/lib/rng";
import { makeReps, quarterByTerritory, rollup } from "@/lib/sales";
import { crmById, ordersQuery, type CrmId } from "@/lib/stack";

export type Vendor = "Claude" | "ChatGPT" | "Gemini";
export const VENDORS: Vendor[] = ["Claude", "ChatGPT", "Gemini"];

export interface Question {
  id: string;
  text: string;
  args: Record<string, unknown>;
  columns: string[];
  rows: string[][];
  summary: string;
}

const reps = makeReps();

export function questions(crm: CrmId): Question[] {
  const q3 = quarterByTerritory(reps, 3);
  const worst = [...q3].sort((a, b) => a.pctToPlan - b.pctToPlan)[0];
  const best = [...q3].sort((a, b) => b.pctToPlan - a.pctToPlan)[0];
  const { rows, total } = rollup(reps, "YTD", "All");
  const sorted = [...rows].sort((a, b) => a.pctToPlan - b.pctToPlan);
  return [
    {
      id: "q3",
      text: "How did Q3 orders compare to plan, by territory?",
      args: ordersQuery(crm, { from: "2026-07-01", to: "2026-09-30" }),
      columns: ["Territory", "Plan", "Orders", "% to plan"],
      rows: q3.map((d) => [d.territory, money(d.plan), money(d.actual), `${d.pctToPlan}%`]),
      summary: `${best.territory} led Q3 at ${best.pctToPlan}% of plan. ${worst.territory} was furthest behind at ${worst.pctToPlan}%.`,
    },
    {
      id: "ytd",
      text: "Which territory is furthest behind plan this year?",
      args: ordersQuery(crm, { from: "2026-01-01" }),
      columns: ["Territory", "Plan to date", "Orders", "% to plan"],
      rows: sorted.map((r) => [r.label, money(r.planToDate), money(r.actual), `${r.pctToPlan}%`]),
      summary: `${sorted[0].label} is furthest behind at ${sorted[0].pctToPlan}% of plan to date. The company overall is at ${total.pctToPlan}%.`,
    },
  ];
}

/** The same tool call as each model vendor's API returns it. */
export function toolCall(vendor: Vendor, crm: CrmId, args: Record<string, unknown>): string {
  const name = crmById(crm).tool;
  if (vendor === "Claude") return JSON.stringify({ type: "tool_use", id: "toolu_01", name, input: args }, null, 2);
  if (vendor === "Gemini") return JSON.stringify({ functionCall: { name, args } }, null, 2);
  return JSON.stringify(
    { tool_calls: [{ id: "call_01", type: "function", function: { name, arguments: JSON.stringify(args) } }] },
    null,
    2,
  );
}
