import type { WorkItem } from './content';

export const WORK: WorkItem[] = [
  {
    slug: 'board-slides',
    title: 'Board Slides on Autopilot',
    headline: 'Board Slides Went from 2–3 Days to One Click',
    summary:
      'Once the executive team agreed the template, I built the AI on top of the business context engine. Each refresh now pulls the numbers, reads the context and drafts the insights.',
    capability: 'Automation & Integration',
    tags: ['Commercial Operations', 'Finance'],
    role: 'Product, AI workflow, data modeling',
    builtWith: ['Claude', 'Google Sheets', 'Google Slides', 'HubSpot', 'NetSuite', 'Salesforce'],
    problem:
      'Every board meeting began the same way: two to three days of pulling numbers, reconciling versions and writing the commentary, mostly re-done each cycle.',
    outcome:
      'A weekly-early draft of the deck, assembled with the latest numbers and drafted key insights, ready for review one week before each board meeting.',
    approach:
      'NetSuite and HubSpot feed a model context protocol (MCP) connection; Claude pulls the agreed metrics into Google Sheets, then drafts the commentary into Google Slides on a schedule. A human approves before anything is presented.',
    featured: true,
    builtOn: 'business-context-engine',
    demo: true,
    worksWith: ['Salesforce', 'HubSpot', 'NetSuite', 'Pardot', 'Marketing Cloud', 'Google Sheets', 'Excel', 'Google Slides', 'PowerPoint', 'Claude', 'ChatGPT', 'Gemini'],
    area: 'Commercial Operations',
  },
  {
    slug: 'business-context-engine',
    title: 'Business Context Engine',
    headline: 'One Version of the Truth, for People and AI Agents',
    summary:
      'CRM, ERP, Jira and Confluence land in one warehouse that traces every customer touch to the general ledger. AI agents answer from it, using the same written rules as leadership.',
    capability: 'Data Products & Dashboards',
    tags: ['Commercial Operations', 'Data'],
    role: 'Product, architecture, data modeling, AI workflow',
    builtWith: ['BigQuery', 'Databricks', 'Salesforce', 'HubSpot', 'NetSuite', 'Jira', 'Confluence', 'Claude'],
    problem:
      'Every team had its own numbers. The same question asked in sales, marketing and finance returned three different answers, and nobody could say why.',
    outcome:
      'One warehouse that traces every customer touch to the general ledger, with agents answering from it using the same written rules as leadership.',
    approach:
      'Bronze, silver and gold layers in BigQuery or Databricks, fed by the CRM, ERP, marketing platform, Jira, Linear, Confluence and GitHub. Lineage is traceable by source; AI agents answer only from the gold layer.',
    featured: true,
    demo: true,
    worksWith: ['BigQuery', 'Databricks', 'Salesforce', 'HubSpot', 'NetSuite', 'Jira', 'Linear', 'Confluence', 'GitHub', 'Claude', 'ChatGPT', 'Gemini'],
    area: 'Commercial Operations',
  },
  {
    slug: 'visitor-id',
    title: 'Know Who Is on Your Website',
    headline: 'Sales Hears About Buyers Who Never Fill Out a Form',
    summary:
      'AI matches each website visit to a company, scores fit and intent, logs it in the CRM with its source and alerts the rep when the account is ready.',
    capability: 'Revenue Systems',
    tags: ['Sales', 'Marketing'],
    role: 'Product, AI workflow, CRM integration',
    builtWith: ['Salesforce', 'HubSpot', 'LinkedIn Ads', 'Google Ads', 'Claude'],
    problem:
      'Most buyers research anonymously. The first signal sales received was often a form fill that arrived late, or never.',
    outcome:
      'Company-level identification with fit and intent scoring, logged in the CRM with its marketing source, retargeted, and routed to the rep when the account is hot.',
    approach:
      'Website visits are resolved to company and job title only — no personal names. Fit and intent are scored from firmographic and behavioral signals, written to the CRM, and an alert fires when an account crosses the threshold.',
    demo: true,
    worksWith: ['Salesforce', 'HubSpot', 'NetSuite', 'Pardot', 'Marketing Cloud', 'LinkedIn Ads', 'Google Ads', 'Claude', 'ChatGPT', 'Gemini'],
    area: 'Sales',
  },
  {
    slug: 'crm-compliance',
    title: 'CRM Compliance Report',
    headline: 'Know Which Sales Activity Moves Revenue, and Prove It',
    summary:
      'The business context engine ties every CRM activity to revenue in the general ledger. Machine learning finds the activities that matter, and a significance test verifies each one.',
    capability: 'Data Products & Dashboards',
    tags: ['Sales', 'Data'],
    role: 'Product, data modeling, statistics',
    builtWith: ['HubSpot', 'NetSuite', 'BigQuery', 'Databricks'],
    problem:
      'Sales activity was measured by volume, not effect. Leadership could not say which activities actually moved revenue, and reps were coached on hunches.',
    outcome:
      'A per-rep compliance report: meetings, MQL → SQL → customer conversion rates and days, response time vs SLA, logging hygiene, and activity vs revenue with a Pearson r and a t-test p-value.',
    approach:
      'Every CRM activity is tied to revenue in the general ledger through the context engine. Machine learning surfaces the activities that correlate with won deals; a significance test verifies each one before it reaches the report.',
    builtOn: 'business-context-engine',
    demo: true,
    worksWith: ['HubSpot', 'NetSuite', 'BigQuery', 'Databricks'],
    area: 'Sales',
  },
  {
    slug: 'sales-dashboard',
    title: 'Territory Dashboards to Plan',
    headline: 'One “% to Plan” the Whole Sales Team Trusts',
    summary:
      'Built from the CRM on rules sales leadership agreed first. The weekly hand-built report is gone, and every region counts “to plan” the same way.',
    capability: 'Data Products & Dashboards',
    tags: ['Sales', 'Data'],
    role: 'Product, data modeling, frontend',
    builtWith: ['Salesforce', 'HubSpot', 'NetSuite'],
    problem:
      'Each region kept its own spreadsheet with its own definition of “to plan.” The number depended on who built the report that week.',
    outcome:
      'Goal, plan to date, actual and percent to plan by territory and rep, for month, quarter and year to date, from one set of rules.',
    approach:
      'AI built it from the CRM on rules sales leadership agreed first. One model of territories and quotas; every number shows its rule and how it was counted.',
    demo: true,
    worksWith: ['Salesforce', 'HubSpot', 'NetSuite'],
    area: 'Sales',
  },
  {
    slug: 'hcp-audiences',
    title: 'HCP Audiences from Diagnosis Codes',
    headline: 'Reach Clinicians by the Patients They Treat, Not Their Titles',
    summary:
      'AI maps diagnosis and procedure codes to the specialties that treat them, sizes the audience by territory and reports who each campaign reached. Aggregated data only.',
    capability: 'Revenue Systems',
    tags: ['Marketing', 'Data'],
    role: 'Product, data modeling, compliance',
    builtWith: ['ICD-10 codes', 'CPT codes', 'HubSpot', 'Pardot', 'Marketing Cloud'],
    problem:
      'Healthcare audiences were built from titles and affiliations, so campaigns reached administrators as often as the treating clinicians.',
    outcome:
      'Audiences sized by territory from the patients clinicians actually treat, with a report back on who each campaign reached. Aggregated and de-identified only.',
    approach:
      'Real ICD-10-CM diagnosis codes map to the specialties that treat them, then to audience by territory, and the campaign report flows back into the marketing platform.',
    demo: true,
    worksWith: ['ICD-10 codes', 'CPT codes', 'HubSpot', 'Pardot', 'Marketing Cloud'],
    area: 'Marketing',
  },
  {
    slug: 'brand-collateral',
    title: 'On-Brand Collateral, Faster',
    headline: 'Every Draft Arrives on Brand',
    summary:
      'Claude Code, Codex or Gemini CLI write from one brand file and check every draft before anyone sees it, so reviews stop being about the wrong blue.',
    capability: 'AI Products',
    tags: ['Marketing'],
    role: 'Product, AI workflow, brand rules',
    builtWith: ['HubSpot', 'Pardot', 'Claude Code', 'Codex', 'Gemini CLI'],
    problem:
      'Every campaign started with a blank page and a style guide nobody read, so the first review was about formatting, not substance.',
    outcome:
      'Drafts that arrive inside the brand system — voice, colors, typography and claims — checked in code before a human sees them.',
    approach:
      'A brand-guidelines file is the single source of truth. CLI agents write from it and a code check validates every draft against the same rules.',
    demo: true,
    worksWith: ['HubSpot', 'Pardot', 'Marketing Cloud', 'Claude Code', 'Codex', 'Gemini CLI'],
    area: 'Marketing',
  },
  {
    slug: 'website-ai',
    title: 'Website Content Updates',
    headline: 'Content Updates from the Claude App',
    summary:
      'Claude finds every mention across the site through the CMS, drafts the changes and publishes them after I approve. A rename no longer means hunting through every page.',
    capability: 'Automation & Integration',
    tags: ['Marketing'],
    role: 'Product, AI workflow, CMS integration',
    builtWith: ['Sanity', 'Claude', 'Vercel'],
    problem:
      'A site-wide rename meant hunting through every page by hand, with the ones missed found by customers weeks later.',
    outcome:
      'Every mention found and drafted in one pass, published only after approval, with a live link to check.',
    approach:
      'Claude queries the CMS through an MCP connection, drafts the changes across every affected page, and publishes after I approve. Sample content only on this example.',
    demo: true,
    worksWith: ['Sanity', 'Claude', 'Vercel'],
    area: 'Marketing',
  },
  {
    slug: 'website-cro',
    title: 'Website Conversion Rate Optimization',
    headline: 'Conversion Rate Optimization from the Claude App',
    summary:
      'Claude reads the form funnels in the analytics tool, finds where people give up and opens the code fix as a pull request. Nothing ships until I approve.',
    capability: 'AI Products',
    tags: ['Marketing'],
    role: 'Product, AI workflow, analytics',
    builtWith: ['PostHog', 'Claude', 'Claude Code', 'GitHub', 'Vercel'],
    problem:
      'The quote form was leaking people, and diagnosing it meant a ticket queue: one analyst to find the drop-off, one engineer to fix it.',
    outcome:
      'The drop-off is diagnosed from the funnel data and the code fix opens as a pull request, ready for review the same day.',
    approach:
      'Claude reads the form funnels in PostHog, finds where people give up, and opens the fix as a pull request through GitHub. Nothing ships until I approve. Sample data only.',
    demo: true,
    worksWith: ['PostHog', 'Claude', 'Claude Code', 'GitHub', 'Vercel'],
    area: 'Marketing',
  },
  {
    slug: 'erp-assistant',
    title: 'Chat with Your CRM in Claude, ChatGPT or Gemini',
    headline: 'Same Question, Same Answer, in Any Assistant',
    summary:
      'One read-only connection to the CRM that Claude, ChatGPT and Gemini share. Each answer shows its query so finance can check it, and the weekly export goes away.',
    capability: 'AI Products',
    tags: ['Commercial Operations'],
    role: 'Product, AI workflow, integration',
    builtWith: ['Salesforce', 'HubSpot', 'NetSuite', 'Claude', 'ChatGPT', 'Gemini'],
    problem:
      'Every team pulled its own weekly export from the CRM and pasted it into whichever assistant it liked, so answers varied by who asked.',
    outcome:
      'One read-only tool on the systems of record, shared by every assistant, with each answer showing the query it ran.',
    approach:
      'A single read-only tool (SuiteQL on NetSuite, SOQL on Salesforce, CRM search on HubSpot) is used by Claude, ChatGPT or Gemini — scripted simulation, sample data only.',
    featured: true,
    demo: true,
    worksWith: ['Salesforce', 'HubSpot', 'NetSuite', 'Claude', 'ChatGPT', 'Gemini'],
    area: 'Commercial Operations',
  },
  {
    slug: 'attribution',
    title: 'CRM Lifecycle and Attribution',
    headline: 'Every Dollar of Revenue Traces Back to the Channel That Earned It',
    summary:
      'Every contact enters the CRM with a source, a stage set by intent and a next step. W-shaped attribution then shows which channels earn back their spend.',
    capability: 'Revenue Systems',
    tags: ['Commercial Operations', 'Marketing'],
    role: 'Product, data modeling, lifecycle design',
    builtWith: ['Salesforce', 'HubSpot', 'Pardot', 'LinkedIn Ads', 'Google Ads'],
    problem:
      'Revenue arrived with no origin story. Deals had no source, so budget was spent on the channels that spent the most, not the ones that earned it.',
    outcome:
      'Every dollar of revenue traces to the channel that earned it, through a lifecycle with intent-set stages and a next step on every contact.',
    approach:
      'Every contact enters the CRM with a source, a stage set by intent and a next step. W-shaped attribution then shows which channels earn back their spend.',
    featured: true,
    demo: true,
    worksWith: ['Salesforce', 'HubSpot', 'Pardot', 'Marketing Cloud', 'LinkedIn Ads', 'Google Ads'],
    area: 'Commercial Operations',
  },
];
