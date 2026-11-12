import { useEffect, useRef, useState, type ReactNode } from "react";
import { DemoFrame } from "@/components/demo-ui";
import {
  CHANGED_DOCUMENTS, CHANGES, DOCUMENTS, FORMS, KEPT, MENTIONS, NEW_QUOTE_FIELDS, QUOTE_DEVICES, QUOTE_DIFF,
  QUOTE_FIELDS, RENAME, REDIRECT, WORST_FIELD, conversion, diffStats, leaveRate, pct, type Mention,
} from "@/lib/website";

type PanelId = "site-before" | "drafts" | "site-after" | "form-before" | "posthog" | "code";
type NodeId = "rename" | "rename-wait" | "publish" | "forms" | "forms-wait" | "pr";

interface Msg {
  from: "me" | "claude" | "tool";
  text: string;
}
interface Choice {
  label: string;
  to: NodeId | "start";
}
interface Node {
  /** What I say. Requests (rename, forms) type themselves into the message box first; replies send at once. */
  user: string;
  /** What Claude is doing while it works, shown as a tool line in the chat. */
  tool?: string;
  reply: string;
  panel: PanelId;
  next: Choice[];
}

const quote = FORMS.find((f) => f.name === "Request a quote")!;
const [phones, desktop] = QUOTE_DEVICES;
const worst = QUOTE_FIELDS[WORST_FIELD];
const diff = diffStats(QUOTE_DIFF);

// ---- the conversation ----

const ASK_RENAME = `Go through all pages and update the brand name from ${RENAME.from} to ${RENAME.to}.`;
const FOUND = `Found ${MENTIONS.length} mentions in ${DOCUMENTS.length} documents. ${CHANGES.length} are the brand name, so I've drafted those changes in ${CHANGED_DOCUMENTS.length} documents. I left ${KEPT.length} as written: a customer quote, "CAR-T persistence" (that's the cells, not the brand) and an event name. The solutions page URL changes too, so I'll add a redirect. Publish?`;
const PUBLISHED = `Published all ${CHANGED_DOCUMENTS.length} documents together. ${REDIRECT.from} now redirects to ${REDIRECT.to}, and the site has rebuilt.`;

const ASK_FORMS = "What are the conversion rates on our lead gen forms, and what can we do to update the code?";
const MEASURED = `From PostHog, last 30 days: ${FORMS.map((f) => `${f.name} converts ${conversion(f)}`).join(", ")}. The quote form is the one to fix: ${pct(worst.reached - QUOTE_FIELDS[WORST_FIELD + 1].reached, worst.reached, 0)} of people who reach the required phone field leave there, and phones convert at ${pct(phones.submitted, phones.views)} vs ${pct(desktop.submitted, desktop.views)} on desktop. I'd make phone optional, cut the form from ${quote.fields} fields to ${NEW_QUOTE_FIELDS.length}, fill the rest from the CRM after submit, and turn on autofill. Want a pull request?`;
const OPENED = "Pull request #42 is open, with a preview link to check it. I also set up a PostHog experiment, so the new form runs against the old one for two weeks before we keep it.";

/** The two case studies share the phone and the panels; each runs one conversation. */
type Flow = "content" | "cro";

const FLOWS: Record<Flow, { greeting: Msg; start: Choice[]; firstPanel: PanelId; tools: string[] }> = {
  content: {
    greeting: { from: "claude", text: "I'm connected to the Quillmere Bio site in Sanity. What do you need?" },
    start: [{ label: "Rename CAR-T to Gene Therapy", to: "rename" }],
    firstPanel: "site-before",
    tools: ["Sanity MCP"],
  },
  cro: {
    greeting: { from: "claude", text: "I'm connected to PostHog and to the Quillmere Bio site's code. What do you need?" },
    start: [{ label: "Check Form Conversion", to: "forms" }],
    firstPanel: "form-before",
    tools: ["PostHog plugin", "Claude Code"],
  },
};
const REQUESTS = new Set<NodeId>(["rename", "forms"]);

const NODES: Record<NodeId, Node> = {
  rename: {
    user: ASK_RENAME,
    tool: `Sanity MCP · Searched every document for "${RENAME.from}"`,
    reply: FOUND,
    panel: "drafts",
    next: [{ label: "Yes, Publish", to: "publish" }, { label: "Not Yet", to: "rename-wait" }],
  },
  "rename-wait": {
    user: "Not yet.",
    reply: "No problem. The drafts stay in Sanity, unpublished, until you say so.",
    panel: "drafts",
    next: [{ label: "Publish Now", to: "publish" }],
  },
  publish: {
    user: "Yes, publish.",
    tool: `Sanity MCP · Published ${CHANGED_DOCUMENTS.length} documents, added a redirect`,
    reply: PUBLISHED,
    panel: "site-after",
    next: [{ label: "Start Over", to: "start" }],
  },
  forms: {
    user: ASK_FORMS,
    tool: "PostHog plugin · Queried form funnels, last 30 days",
    reply: MEASURED,
    panel: "posthog",
    next: [{ label: "Yes, Open a Pull Request", to: "pr" }, { label: "Not Yet", to: "forms-wait" }],
  },
  "forms-wait": {
    user: "Not yet.",
    reply: "OK. Nothing changes until you ask. I saved the funnel in PostHog so we can come back to it.",
    panel: "posthog",
    next: [{ label: "Open the Pull Request", to: "pr" }],
  },
  pr: {
    user: "Yes, open a pull request.",
    tool: "Claude Code · Edited QuoteForm.tsx, opened a pull request",
    reply: OPENED,
    panel: "code",
    next: [{ label: "Start Over", to: "start" }],
  },
};

const PANELS: Record<PanelId, () => ReactNode> = {
  "site-before": () => <SiteMock after={false} />,
  drafts: () => <SanityDrafts />,
  "site-after": () => <SiteMock after />,
  "form-before": () => <QuoteForm fields={QUOTE_FIELDS.map((f) => f.field)} title={`The quote form today: ${quote.fields} fields`} requiredAll />,
  posthog: () => <PostHogPanel />,
  code: () => <CodeChange />,
};

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function WebsiteAi() {
  return <WebsiteFlow flow="content" />;
}

export function WebsiteCro() {
  return <WebsiteFlow flow="cro" />;
}

function WebsiteFlow({ flow }: { flow: Flow }) {
  const { greeting: GREETING, start: START, firstPanel, tools } = FLOWS[flow];
  const [log, setLog] = useState<Msg[]>([GREETING]);
  const [panel, setPanel] = useState<PanelId>(firstPanel);
  const [choices, setChoices] = useState<Choice[]>(START);
  const [draft, setDraft] = useState<{ text: string; to: NodeId } | null>(null);
  const [typed, setTyped] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Set<NodeId>>(new Set());
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reducedMotion() ? 0 : ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // the request types itself into the message box
  useEffect(() => {
    if (!draft) return;
    if (reducedMotion()) return setTyped(draft.text.length);
    setTyped(0);
    let count = 0;
    const t = window.setInterval(() => {
      count = Math.min(count + 2, draft.text.length);
      setTyped(count);
      if (count === draft.text.length) window.clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [draft]);
  const ready = draft !== null && typed >= draft.text.length;

  const reset = () => {
    timers.current.forEach(clearTimeout);
    setLog([GREETING]);
    setPanel(firstPanel);
    setChoices(START);
    setDraft(null);
    setBusy(null);
    setDone(new Set());
  };

  const send = (text: string, to: NodeId) => {
    const node = NODES[to];
    setLog((l) => [...l, { from: "me", text }]);
    setChoices([]);
    setBusy(node.tool ? node.tool.split(" · ")[0] : "Claude");
    later(() => {
      setLog((l) => [...l, ...(node.tool ? [{ from: "tool" as const, text: node.tool }] : []), { from: "claude", text: node.reply }]);
      setPanel(node.panel);
      setBusy(null);
      const nextDone = new Set(done).add(to);
      setDone(nextDone);
      // don't offer a conversation that's already finished
      setChoices(node.next.filter((c) => c.to === "start" || !(REQUESTS.has(c.to) && nextDone.has(c.to === "rename" ? "publish" : "pr"))));
    }, 1300);
  };

  const choose = (c: Choice) => {
    if (c.to === "start") return reset();
    if (REQUESTS.has(c.to)) {
      setChoices([]);
      setDraft({ text: NODES[c.to].user, to: c.to });
      setPanel(c.to === "forms" ? "form-before" : panel === "site-after" ? "site-after" : "site-before");
      return;
    }
    send(c.label.endsWith(".") ? c.label : `${c.label}.`, c.to);
  };

  const submit = () => {
    if (!draft || !ready) return;
    send(draft.text, draft.to);
    setDraft(null);
  };

  const hint = busy
    ? "Claude is working on it…"
    : draft
      ? "Tap send on the phone."
      : log.length === 1
        ? "Pick a request on the phone."
        : "Reply to Claude on the phone, and look over its work on the right.";

  return (
    <DemoFrame
      slug={flow === "content" ? "website-ai" : "website-cro"}
      problem={
        flow === "content"
          ? "Site changes waited in a developer queue, and a simple rename meant hunting through every page."
          : "Analytics questions waited on an analyst, and the code changes they pointed to waited in a developer queue."
      }
      built={
        flow === "content"
          ? [
              <>Claude connected to Sanity: it finds, drafts and publishes content with an editor's permissions, after my approval.</>,
              <>A rename skips quotes, scientific terms and event names, and adds a redirect when a page address changes.</>,
              <>Every changed document publishes together, so the site never shows half a rename.</>,
            ]
          : [
              <>PostHog in the same chat, so “which form is losing people?” gets an answer, not a ticket.</>,
              <>Code changes as a pull request with a preview link I check before it ships.</>,
              <>A PostHog experiment runs the new form against the old one before we keep it.</>,
            ]
      }
    >
      <div className="site">
        <div className="deck-bar">
          <p className="site-hint">
            <span className="label">Try It</span> <span aria-live="polite">{hint}</span>
          </p>
          {log.length > 1 && (
            <button type="button" className="btn" onClick={reset}>
              Start Over ↺
            </button>
          )}
        </div>

        <div className="site-split">
          <Phone tools={tools} log={log} busy={busy} choices={choices} onChoose={choose} draft={draft ? draft.text.slice(0, typed) : ""} ready={ready} onSend={submit} />
          <div className="site-panel" key={panel}>
            {PANELS[panel]()}
          </div>
        </div>

        <section className="how-built" aria-labelledby="site-how-title">
          <h3 id="site-how-title" className="how-title">How It's Built</h3>
          {flow === "content" ? (
            <>
              <ol className="pipeline" aria-label="How a request becomes a change">
                <li className="pipe-step"><span className="label">Step 1</span><b>Claude on my phone</b><span className="small muted">A message, not a ticket</span></li>
                <li className="pipe-step"><span className="label">Step 2</span><b>Sanity MCP</b><span className="small muted">Search every document, draft the changes</span></li>
                <li className="pipe-step"><span className="label">Step 3</span><b>My approval</b><span className="small muted">Drafts stay unpublished until I say so</span></li>
                <li className="pipe-step"><span className="label">Step 4</span><b>Publish + Vercel</b><span className="small muted">All documents together, redirect added, site rebuilt</span></li>
              </ol>
              <p className="rule">
                <b>Rules:</b> Claude drafts; I approve every publish. A rename changes the brand name only: it skips quotes,
                scientific terms and names of events, and any page whose address changes gets a redirect.
              </p>
              <p className="rule">
                <b>Simulation:</b> no call to Sanity or Claude is made on this page. Quillmere Bio is an invented company;
                its pages are made up.
              </p>
            </>
          ) : (
            <>
              <ol className="pipeline" aria-label="How a question becomes a code change">
                <li className="pipe-step"><span className="label">Step 1</span><b>Claude on my phone</b><span className="small muted">A question, not a ticket</span></li>
                <li className="pipe-step"><span className="label">Step 2</span><b>PostHog plugin</b><span className="small muted">Funnels and drop-off by field and device</span></li>
                <li className="pipe-step"><span className="label">Step 3</span><b>Claude Code + GitHub</b><span className="small muted">The fix as a pull request</span></li>
                <li className="pipe-step"><span className="label">Step 4</span><b>Vercel + PostHog</b><span className="small muted">Preview to check, then an experiment</span></li>
              </ol>
              <p className="rule">
                <b>Rules:</b> Claude proposes; I approve every merge. Conversion = form submissions ÷ form views, last 30
                days; started = typed in at least one field; a field's leave rate = people who reach it and leave the form
                there.
              </p>
              <p className="rule">
                <b>Simulation:</b> no call to Claude, PostHog or GitHub is made on this page. Quillmere Bio is an invented
                company; its form counts and code are made up.
              </p>
            </>
          )}
        </section>
      </div>
    </DemoFrame>
  );
}

// ---- the phone ----

function Phone({
  tools,
  log,
  busy,
  choices,
  onChoose,
  draft,
  ready,
  onSend,
}: {
  tools: string[];
  log: Msg[];
  busy: string | null;
  choices: Choice[];
  onChoose: (c: Choice) => void;
  draft: string;
  ready: boolean;
  onSend: () => void;
}) {
  const chat = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = chat.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reducedMotion() ? "auto" : "smooth" });
  }, [log, busy, choices]);
  return (
    <figure className="phone" aria-label="Claude on my phone">
      <div className="phone-screen">
        <div className="phone-top" aria-hidden="true">
          <span>9:41</span>
          <b>Claude</b>
          <span className="phone-dots"><i /><i /><i /></span>
        </div>
        <ul className="phone-tools" aria-label="Connected">
          {tools.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <ol className="chat" ref={chat} aria-live="polite">
          {log.map((m, k) => (
            <li key={k} className={`bubble ${m.from} new`}>
              <span className="sr-only">{m.from === "me" ? "Me: " : m.from === "tool" ? "Tool: " : "Claude: "}</span>
              {m.from === "tool" && <span className="tool-check" aria-hidden="true">✓</span>}
              {m.text}
            </li>
          ))}
          {busy && (
            <li className="bubble claude typing" aria-label={`Claude is working in ${busy}`}>
              <span className="mono-sm muted">{busy}</span>
              <span className="typing-dots" aria-hidden="true"><i /><i /><i /></span>
            </li>
          )}
          {choices.length > 0 && (
            <li className="choices" aria-label="Replies">
              {choices.map((c, k) => (
                <button key={c.label} type="button" className={`quick ${k === 0 ? "nudge keep" : ""}`} onClick={() => onChoose(c)}>
                  {c.label}
                </button>
              ))}
            </li>
          )}
        </ol>
        <div className="composer">
          <div className={`composer-box ${draft ? "" : "empty"}`} aria-label="Message">
            {draft || "Message Claude"}
            {draft && !ready && <span className="caret" aria-hidden="true" />}
          </div>
          <button type="button" className={`send ${ready ? "nudge keep" : ""}`} onClick={onSend} disabled={!ready} aria-label="Send">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
          </button>
        </div>
      </div>
    </figure>
  );
}

// ---- panels ----

const Term = ({ after }: { after: boolean }) => <mark className={`term ${after ? "now" : ""}`}>{after ? RENAME.to : RENAME.from}</mark>;

function SiteMock({ after }: { after: boolean }) {
  return (
    <div className="panel-stack">
      <div className="mini-site" aria-label={after ? "The site after the change" : "The site today"}>
        <div className="mini-bar">
          <span className="mini-url">quillmere.bio{after ? REDIRECT.to : REDIRECT.from}</span>
        </div>
        <div className="mini-body">
          <div className="mini-nav">
            <b>Quillmere Bio</b>
            <span>Products</span>
            <span className="mini-menu">Solutions
              <span className="mini-drop"><Term after={after} /><span>Oncology</span><span>Immunology</span></span>
            </span>
            <span>Resources</span>
          </div>
          <div className="mini-hero">
            <span className="mono-sm muted">Solutions</span>
            <p className="mini-title"><Term after={after} /></p>
            <p>Biomarker panels for <Term after={after} /> programs, from discovery to release.</p>
            <span className="mini-cta">Explore <Term after={after} /> solutions →</span>
          </div>
          <div className="mini-foot">Products · <Term after={after} /> · Oncology · Contact</div>
        </div>
      </div>
      {after ? (
        <ul className="done-list" aria-label="What Claude did">
          <li>{CHANGED_DOCUMENTS.length} documents published together in Sanity</li>
          <li>Redirect {REDIRECT.from} → {REDIRECT.to}</li>
          <li>Site rebuilt; quotes, the scientific term and the event name unchanged</li>
        </ul>
      ) : (
        <p className="small muted">The Quillmere Bio site today. Quillmere Bio is an invented company.</p>
      )}
    </div>
  );
}

function SanityDrafts() {
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <span className="label">Sanity Studio · Drafts by Claude</span>
        <span className="mono-sm muted">search documents: "{RENAME.from}"</span>
      </div>
      <ul className="tally" aria-label="Summary">
        <li><b>{MENTIONS.length}</b> mentions</li>
        <li><b>{DOCUMENTS.length}</b> documents</li>
        <li><b>{CHANGES.length}</b> changes drafted</li>
        <li><b>{KEPT.length}</b> left as written</li>
      </ul>
      <div className="drafts">
        {DOCUMENTS.map((doc) => {
          const rows = MENTIONS.filter((m) => m.doc === doc);
          return (
            <section key={doc} className="draft-doc" aria-label={doc}>
              <div className="draft-doc-head">
                <b>{doc}</b>
                <span className="chip">{rows[0].type}</span>
              </div>
              <ul>
                {rows.map((m) => <DraftRow key={m.field} m={m} />)}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DraftRow({ m }: { m: Mention }) {
  return (
    <li className={`draft-row ${m.keep ? "kept" : ""}`}>
      <span className="label">{m.field}</span>
      {m.after ? (
        <span className="draft-change">
          <del>{m.before}</del>
          <ins>{m.after}</ins>
        </span>
      ) : (
        <span className="draft-change">
          <span>{m.before}</span>
          <span className="pill tone-warn">Kept · {m.keep}</span>
        </span>
      )}
    </li>
  );
}

function PostHogPanel() {
  const top = QUOTE_FIELDS[0].reached;
  return (
    <div className="panel-stack">
      <div className="panel-head">
        <span className="label">PostHog Plugin · Lead-Gen Forms</span>
        <span className="mono-sm muted">last 30 days</span>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="Lead-gen form funnels">
        <table className="forms-table">
          <caption>Form views, starts and submissions over the last 30 days. Conversion = submitted ÷ views. Made-up data.</caption>
          <thead>
            <tr><th scope="col">Form</th><th scope="col">Views</th><th scope="col">Started</th><th scope="col">Submitted</th><th scope="col">Conversion</th></tr>
          </thead>
          <tbody>
            {FORMS.map((f) => (
              <tr key={f.name}>
                <th scope="row">{f.name}</th>
                <td>{f.views.toLocaleString("en-US")}</td>
                <td>{f.started.toLocaleString("en-US")}</td>
                <td>{f.submitted.toLocaleString("en-US")}</td>
                <td>{f === quote ? <span className="pill tone-bad">{conversion(f)} · To fix</span> : conversion(f)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="dropoff">
        <span className="label">Request a Quote: How Far People Get</span>
        <ul className="pbars" aria-label="People who reached each field">
          {QUOTE_FIELDS.map((f, k) => (
            <li key={f.field} className={k === WORST_FIELD ? "worst" : ""}>
              <span className="pbar-label">{f.field}{f.required ? " *" : ""}</span>
              <span className="pbar-track" role="img" aria-label={`${f.field}: ${f.reached} of ${top} reached it`}>
                <span className="pbar-fill" style={{ width: `${(f.reached / top) * 100}%` }} />
              </span>
              <span className="pbar-num">{f.reached}</span>
            </li>
          ))}
        </ul>
        <p className="small">
          <span className="pill tone-bad">{pct(worst.reached - QUOTE_FIELDS[WORST_FIELD + 1].reached, worst.reached, 0)} leave · At Phone</span>{" "}
          <span className="muted">
            * required. Leave rate = people who reach a field and leave the form there ({Math.round(leaveRate(WORST_FIELD) * 100)}% of the{" "}
            {worst.reached} who reached Phone). Phones convert at {pct(phones.submitted, phones.views)} vs {pct(desktop.submitted, desktop.views)} on desktop.
          </span>
        </p>
      </div>
    </div>
  );
}

function CodeChange() {
  return (
    <div className="panel-stack">
      <div className="pr-card">
        <span className="label">GitHub · Pull Request #42</span>
        <b>Shorter quote form: phone optional, {quote.fields} fields to {NEW_QUOTE_FIELDS.length}, autofill on</b>
        <span className="small muted">
          1 file changed · <span className="tone-good">+{diff.added}</span> <span className="tone-bad">−{diff.removed}</span> · Vercel preview ready
        </span>
      </div>
      <figure className="code-block">
        <figcaption className="label">QuoteForm.tsx</figcaption>
        <pre className="diff">
          {QUOTE_DIFF.split("\n").map((line, k) => (
            <span key={k} className={line.startsWith("+ ") ? "add" : line.startsWith("- ") ? "del" : ""}>
              {line}
            </span>
          ))}
        </pre>
      </figure>
      <div className="code-cards">
        <QuoteForm fields={NEW_QUOTE_FIELDS} title={`The new quote form: ${NEW_QUOTE_FIELDS.length} fields`} />
        <div className="xp-card">
          <span className="label">PostHog Experiment</span>
          <b>Quote form v2</b>
          <ul className="plain small">
            <li>Old form vs new form, 50/50</li>
            <li>Goal: quote form conversion</li>
            <li>Runs 14 days before we keep it</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function QuoteForm({ fields, title, requiredAll }: { fields: string[]; title: string; requiredAll?: boolean }) {
  return (
    <div className="mini-form" aria-label={title}>
      <span className="label">{title}</span>
      {fields.map((f) => (
        <span key={f} className="mini-field">
          <span className="small">{f}{requiredAll && f !== "Message" ? " *" : ""}</span>
          <span className="mini-input" aria-hidden="true" />
        </span>
      ))}
      <span className="mini-submit" aria-hidden="true">Request a quote</span>
    </div>
  );
}
