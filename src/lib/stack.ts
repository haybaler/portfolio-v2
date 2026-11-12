/**
 * The systems a visitor can pick. Every demo reads the same choice, so the site shows the work on their stack.
 * Query text is illustrative: custom fields (territory) differ per company.
 */

export type CrmId = "netsuite" | "salesforce" | "hubspot";
export type MapId = "hubspot" | "pardot" | "mcloud";

export interface Crm {
  id: CrmId;
  name: string;
  kind: string;
  connector: string;
  language: string;
  tool: string;
  toolDescription: string;
}

export interface Map {
  id: MapId;
  name: string;
  short: string;
}

export const CRMS: Crm[] = [
  { id: "salesforce", name: "Salesforce", kind: "CRM", connector: "SOQL via the REST API", language: "SOQL", tool: "run_soql", toolDescription: "Run a read-only SOQL query against Salesforce." },
  { id: "hubspot", name: "HubSpot", kind: "CRM", connector: "CRM search API", language: "CRM search request", tool: "search_deals", toolDescription: "Search HubSpot deals (read-only) and total the results." },
  { id: "netsuite", name: "NetSuite", kind: "ERP", connector: "SuiteQL over REST", language: "SuiteQL", tool: "run_suiteql", toolDescription: "Run a read-only SuiteQL query against NetSuite." },
];

export const MAPS: Map[] = [
  { id: "hubspot", name: "HubSpot Marketing Hub", short: "HubSpot" },
  { id: "pardot", name: "Pardot (Account Engagement)", short: "Pardot" },
  { id: "mcloud", name: "Salesforce Marketing Cloud", short: "Marketing Cloud" },
];

export const crmById = (id: CrmId) => CRMS.find((c) => c.id === id)!;
export const mapById = (id: MapId) => MAPS.find((m) => m.id === id)!;

export interface Range {
  from: string;
  to?: string;
}

/** The query each system would run for "orders by territory in a date range". */
export function ordersQuery(crm: CrmId, r: Range): Record<string, unknown> {
  if (crm === "netsuite") {
    const where = r.to
      ? `t.trandate BETWEEN TO_DATE('${r.from}','YYYY-MM-DD') AND TO_DATE('${r.to}','YYYY-MM-DD')`
      : `t.trandate >= TO_DATE('${r.from}','YYYY-MM-DD')`;
    return {
      query: [
        "SELECT t.custbody_territory AS territory,",
        "       SUM(tl.netamount) AS orders",
        "FROM transaction t",
        "JOIN transactionline tl ON tl.transaction = t.id",
        "WHERE t.type = 'SalesOrd'",
        `  AND ${where}`,
        "GROUP BY t.custbody_territory",
      ].join("\n"),
    };
  }
  if (crm === "salesforce") {
    const where = r.to ? `CloseDate >= ${r.from} AND CloseDate <= ${r.to}` : `CloseDate >= ${r.from}`;
    return {
      query: [
        "SELECT Territory__c, SUM(Amount) orders",
        "FROM Opportunity",
        "WHERE IsWon = true",
        `  AND ${where}`,
        "GROUP BY Territory__c",
      ].join("\n"),
    };
  }
  const filters: Record<string, string>[] = [{ propertyName: "dealstage", operator: "EQ", value: "closedwon" }];
  filters.push(
    r.to
      ? { propertyName: "closedate", operator: "BETWEEN", value: r.from, highValue: r.to }
      : { propertyName: "closedate", operator: "GTE", value: r.from },
  );
  return { filterGroups: [{ filters }], properties: ["amount", "territory"], limit: 100 };
}

/** Human-readable text of the query, for the code panel. */
export function queryText(args: Record<string, unknown>): string {
  return typeof args.query === "string" ? args.query : JSON.stringify(args, null, 2);
}
