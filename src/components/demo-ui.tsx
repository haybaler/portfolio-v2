import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { WORK } from "@/lib/work";
import { fill, type WorkItem } from "@/lib/content";
import type { Status } from "@/lib/status";
import { titleCase } from "@/lib/titleCase";
import { go } from "@/lib/router";
import { useStack } from "@/components/stack";

/** A number with its status word, so status never depends on colour alone. */
export function StatusPill({ value, status }: { value: string; status: Status }) {
  return (
    <span className={`pill tone-${status.tone}`}>
      {value} · {status.word}
    </span>
  );
}

export function Seg<T extends string>({
  label,
  options,
  value,
  onChange,
  nudge,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  /** The option worth trying first: it pulses until the visitor interacts with the example. */
  nudge?: T;
}) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={o === nudge && o !== value ? "nudge" : undefined}
          aria-pressed={o === value}
          onClick={() => onChange(o)}
        >
          {titleCase(o)}
        </button>
      ))}
    </div>
  );
}

/**
 * The "try me" control (.nudge) rests as a thin static outline. When one first scrolls fully into view it pulses
 * three times, then stays still. Nothing pulses once the visitor has clicked in the example (.touched), and nothing
 * pulses at all under prefers-reduced-motion.
 */
function useTryMePulse(stage: RefObject<HTMLDivElement | null>, key: string) {
  useEffect(() => {
    const root = stage.current;
    if (!root || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const signal = getComputedStyle(root).getPropertyValue("--signal").trim() || "#0f62fe";
    const pulsed = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const el = e.target as HTMLElement;
          if (!e.isIntersecting || pulsed.has(el)) continue;
          io.unobserve(el);
          if (root.classList.contains("touched") && !el.classList.contains("keep")) continue;
          pulsed.add(el);
          el.animate([{ boxShadow: `0 0 0 0 ${signal}` }, { boxShadow: "0 0 0 8px transparent" }], {
            duration: 1100,
            iterations: 3,
            delay: 300,
            easing: "cubic-bezier(.4,0,.2,1)",
          });
        }
      },
      { threshold: 0.9 },
    );
    const watch = () => {
      for (const el of [...pulsed]) if (!el.isConnected || !el.classList.contains("nudge")) pulsed.delete(el);
      root.querySelectorAll(".nudge").forEach((el) => !pulsed.has(el) && io.observe(el));
    };
    watch();
    const mo = new MutationObserver(watch);
    mo.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, [stage, key]);
}

/**
 * The Window around every interactive example (design system: Window): three dots, a mono title and the stage.
 * The stage marks itself touched on the first click or key press, which switches the "try me" outline off.
 * `id` names the example, so a different one starts untouched.
 */
export function ExampleWindow({ id, children }: { id: string; children: ReactNode }) {
  const [touched, setTouched] = useState(false);
  useEffect(() => setTouched(false), [id]);
  const stage = useRef<HTMLDivElement>(null);
  useTryMePulse(stage, id);
  return (
    <section className="window" aria-label="Interactive example">
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true"><i /><i /><i /></span>
        <h2 className="window-title mono-sm">Interactive Example · Made-Up Data</h2>
      </div>
      <div
        ref={stage}
        className={`window-body demo-stage ${touched ? "touched" : ""}`}
        onClick={() => setTouched(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setTouched(true)}
      >
        {children}
      </div>
    </section>
  );
}

/** Shared frame for every case study: the interactive example, then the problem, what I built and what it works
 * with, then the next case study. The narrative sections come from the item's own fields. */
export function DemoFrame({
  slug,
  problem,
  built,
  children,
}: {
  slug: string;
  problem: ReactNode;
  built: ReactNode[];
  children: ReactNode;
}) {
  const { crm, map } = useStack();
  const t = (s: string) => fill(s, crm.name, map.short);
  const item = WORK.find((w) => w.slug === slug)! as WorkItem;
  const i = WORK.findIndex((w) => w.slug === slug);
  const next = WORK[(i + 1) % WORK.length];
  const base = item.builtOn ? WORK.find((w) => w.slug === item.builtOn) : undefined;
  return (
    <>
      <article className="wrap demo-page">
        <a
          className="back"
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            go('/');
            window.scrollTo(0, 0);
          }}
        >
          ← All Case Studies
        </a>
        <header className="stack gap-3 pb-10">
          <p className="label">
            {item.area} · {t(item.title)}
          </p>
          <h1 className="text-[2rem] font-normal leading-[1.2] md:text-[2.6rem]">{t(item.headline)}</h1>
          <p className="lede">{t(item.summary)}</p>
        </header>
        <ExampleWindow id={slug}>{children}</ExampleWindow>
      </article>
      <div className="wrap max-w-[68ch] py-12 md:py-16">
        <section className="stack">
          <p className="label">The Problem</p>
          <p className="text-base leading-[1.5] text-ink-muted">{problem}</p>
        </section>
        <section className="stack mt-10">
          <p className="label">What I Built</p>
          <ul className="stack gap-2 text-base leading-[1.5] text-ink-muted">
            {built.map((b, k) => (
              <li key={k} className="flex gap-2">
                <span aria-hidden className="mt-[.55em] h-px w-3 flex-none bg-ink-faint" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="label">Works With</p>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Works with">
              {item.worksWith.map((tool) => (
                <li key={tool} className="tag !bg-card-2 !text-ink-muted">{tool}</li>
              ))}
            </ul>
          </div>
        </section>
        {(base || item.builtOn) && base && (
          <p className="mt-10 text-sm text-ink-muted">
            Built on{" "}
            <button onClick={() => go(`/work/${base.slug}`)} className="text-signal-text hover:underline">
              {t(base.title)}
            </button>
            .
          </p>
        )}
      </div>

      {next && (
        <div className="border-t border-line-2">
          <div className="wrap flex flex-wrap items-center justify-between gap-4 py-8">
            <div>
              <p className="label">Next Case Study</p>
              <p className="mt-1 text-[1.375rem] font-normal">{t(next.title)}</p>
            </div>
            <button onClick={() => go(`/work/${next.slug}`)} className="btn shrink-0">
              Read It →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
