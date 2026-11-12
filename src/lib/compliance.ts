/**
 * CRM compliance report on made-up data, shown with HubSpot. Five invented reps, one quarter (Q3 2026).
 * Every number is generated here with a fixed seed so the page and its tests always agree.
 */
import { rng } from "@/lib/rng";
import { median } from "@/lib/stats";

export const SLA_HOURS = 4;

export interface Rep {
  id: string;
  name: string;
  territory: string;
}

export const REPS: Rep[] = [
  { id: "r1", name: "Maya R.", territory: "Northeast" },
  { id: "r2", name: "Jordan T.", territory: "Southeast" },
  { id: "r3", name: "Priya S.", territory: "Midwest" },
  { id: "r4", name: "Sam K.", territory: "Southwest" },
  { id: "r5", name: "Leo M.", territory: "West" },
];

// How each invented rep works: activity per deal, logging discipline, speed to lead, close skill.
const TRAITS: Record<string, { activity: number; discipline: number; responseH: number; skill: number }> = {
  r1: { activity: 14, discipline: 0.94, responseH: 1.2, skill: 0.62 },
  r2: { activity: 7, discipline: 0.61, responseH: 9.5, skill: 0.44 },
  r3: { activity: 11, discipline: 0.83, responseH: 2.8, skill: 0.55 },
  r4: { activity: 5, discipline: 0.52, responseH: 14.0, skill: 0.4 },
  r5: { activity: 10, discipline: 0.77, responseH: 3.6, skill: 0.5 },
};

export interface Lead {
  rep: string;
  responseH: number;
  sql: boolean;
  daysToSql: number;
  customer: boolean;
  daysToCustomer: number;
}

export interface Deal {
  rep: string;
  activities: number;
  won: boolean;
  revenue: number;
  nextStep: boolean;
  closeDateCurrent: boolean;
}

export interface Hygiene {
  nextStep: number;
  closeDateCurrent: number;
  lifecycleSet: number;
  loggedIn24h: number;
  meetingOutcome: number;
}

export interface RepRow extends Rep {
  meetings: number;
  activities: number;
  mqls: number;
  sqls: number;
  customers: number;
  mqlToSql: number;
  sqlToCustomer: number;
  daysToSql: number;
  daysToCustomer: number;
  responseMedianH: number;
  withinSla: number;
  revenue: number;
  hygiene: Hygiene;
  compliance: number;
}

const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

export function generate(seed = 42) {
  const r = rng(seed);
  const leads: Lead[] = [];
  const deals: Deal[] = [];
  const rows: RepRow[] = [];

  for (const rep of REPS) {
    const t = TRAITS[rep.id];
    const repLeads: Lead[] = [];
    const mqls = 55 + Math.floor(r() * 25);
    for (let i = 0; i < mqls; i++) {
      const responseH = Math.max(0.1, t.responseH * (0.3 + r() * 1.4));
      const fast = responseH <= SLA_HOURS;
      const sql = r() < (fast ? 0.42 : 0.2) + (t.skill - 0.5) * 0.3;
      const customer = sql && r() < t.skill * 0.55;
      repLeads.push({
        rep: rep.id,
        responseH,
        sql,
        daysToSql: sql ? Math.round(6 + r() * 18 + (fast ? 0 : 6)) : 0,
        customer,
        daysToCustomer: customer ? Math.round(30 + r() * 50 - t.skill * 20) : 0,
      });
    }
    leads.push(...repLeads);

    const repDeals: Deal[] = [];
    const nDeals = 26 + Math.floor(r() * 8);
    for (let i = 0; i < nDeals; i++) {
      const activities = Math.max(0, Math.round(t.activity * (0.35 + r() * 1.3)));
      const winP = Math.min(0.85, 0.12 + activities * 0.028 + (t.skill - 0.5) * 0.4);
      const won = r() < winP;
      const size = 18_000 + r() * 40_000 + activities * 1_400;
      repDeals.push({
        rep: rep.id,
        activities,
        won,
        revenue: won ? Math.round(size / 100) * 100 : 0,
        nextStep: r() < t.discipline,
        closeDateCurrent: r() < Math.min(0.98, t.discipline + 0.05),
      });
    }
    deals.push(...repDeals);

    const sqls = repLeads.filter((l) => l.sql);
    const customers = repLeads.filter((l) => l.customer);
    const hygiene: Hygiene = {
      nextStep: pct(repDeals.filter((d) => d.nextStep).length, repDeals.length),
      closeDateCurrent: pct(repDeals.filter((d) => d.closeDateCurrent).length, repDeals.length),
      lifecycleSet: Math.min(100, Math.round(t.discipline * 100 + 4 + r() * 3)),
      loggedIn24h: Math.round(t.discipline * 96 - r() * 4),
      meetingOutcome: Math.round(t.discipline * 92 + r() * 4),
    };
    const h = Object.values(hygiene);
    rows.push({
      ...rep,
      meetings: Math.round(repDeals.reduce((s, d) => s + d.activities, 0) * 0.22),
      activities: repDeals.reduce((s, d) => s + d.activities, 0),
      mqls,
      sqls: sqls.length,
      customers: customers.length,
      mqlToSql: pct(sqls.length, mqls),
      sqlToCustomer: pct(customers.length, sqls.length),
      daysToSql: median(sqls.map((l) => l.daysToSql)),
      daysToCustomer: median(customers.map((l) => l.daysToCustomer)),
      responseMedianH: Math.round(median(repLeads.map((l) => l.responseH)) * 10) / 10,
      withinSla: pct(repLeads.filter((l) => l.responseH <= SLA_HOURS).length, mqls),
      revenue: repDeals.reduce((s, d) => s + d.revenue, 0),
      hygiene,
      compliance: Math.round(h.reduce((s, x) => s + x, 0) / h.length),
    });
  }
  return { leads, deals, rows };
}

export const HYGIENE_LABEL: Record<keyof Hygiene, string> = {
  nextStep: "Open deals with a next step",
  closeDateCurrent: "Close dates not in the past",
  lifecycleSet: "Contacts with a lifecycle stage",
  loggedIn24h: "Activities logged within 24 hours",
  meetingOutcome: "Meetings with an outcome recorded",
};

/** Speed to lead: SQL conversion for leads answered inside vs outside the SLA. */
export function speedToLead(leads: Lead[]) {
  const fast = leads.filter((l) => l.responseH <= SLA_HOURS);
  const slow = leads.filter((l) => l.responseH > SLA_HOURS);
  return {
    fast: pct(fast.filter((l) => l.sql).length, fast.length),
    slow: pct(slow.filter((l) => l.sql).length, slow.length),
    nFast: fast.length,
    nSlow: slow.length,
  };
}

export function team(rows: RepRow[]) {
  const sum = (k: "meetings" | "mqls" | "sqls" | "customers" | "revenue" | "activities") => rows.reduce((s, x) => s + x[k], 0);
  return {
    meetings: sum("meetings"),
    mqlToSql: pct(sum("sqls"), sum("mqls")),
    sqlToCustomer: pct(sum("customers"), sum("sqls")),
    revenue: sum("revenue"),
    compliance: Math.round(rows.reduce((s, x) => s + x.compliance, 0) / rows.length),
    withinSla: pct(rows.reduce((s, x) => s + (x.withinSla * x.mqls) / 100, 0), sum("mqls")),
  };
}

export function formatP(p: number): string {
  return p < 0.001 ? "p < 0.001" : `p = ${p.toFixed(3)}`;
}
