import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WORK } from '@/lib/work';
import { go } from '@/lib/router';

export default function CaseStudy({ slug }: { slug: string }) {
  const item = WORK.find((w) => w.slug === slug);
  if (!item) {
    return (
      <div className="wrap stack py-24">
        <p className="text-ink-muted">That case study does not exist.</p>
        <button onClick={() => go('/')} className="btn btn-primary w-fit">
          Back to the Work
        </button>
      </div>
    );
  }

  const related = WORK.filter((w) => w.slug !== item.slug);
  const next =
    (item.builtOn && WORK.find((w) => w.slug === item.builtOn)) ||
    related.find((w) => w.capability === item.capability) ||
    related[0];

  return (
    <article>
      <div className="wrap pt-8 md:pt-12">
        <button
          onClick={() => go('/#work')}
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to the Work
        </button>
      </div>

      <header className="wrap stack pt-8 pb-12 md:pt-12">
        <div className="flex flex-wrap gap-1.5">
          <span className="tag">{item.capability}</span>
          {item.tags.map((t) => (
            <span key={t} className="tag !bg-card-3 !text-ink-muted">
              {t}
            </span>
          ))}
        </div>
        <p className="label">{item.title}</p>
        <h1 className="max-w-[22ch] text-[clamp(2rem,5vw,3.25rem)] font-light leading-[1.15]">
          {item.headline}
        </h1>
        <p className="lede max-w-[48ch]">{item.summary}</p>
      </header>

      <div className="border-t border-line bg-card">
        <div className="wrap grid gap-px bg-line py-px md:grid-cols-3">
          <div className="bg-card py-6 md:pr-8">
            <p className="label">My Role</p>
            <p className="mt-2 text-sm leading-relaxed">{item.role}</p>
          </div>
          <div className="bg-card py-6 md:px-8">
            <p className="label">Built With</p>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {item.builtWith.map((tool) => (
                <span key={tool} className="tag !bg-card-2 !text-ink-muted">
                  {tool}
                </span>
              ))}
            </p>
          </div>
          <div className="bg-card py-6 md:pl-8">
            <p className="label">The Data</p>
            <p className="mt-2 text-sm leading-relaxed">Made-up data, invented company names.</p>
          </div>
        </div>
      </div>

      <div className="wrap max-w-[68ch] py-12 md:py-16">
        <section className="stack">
          <h2 className="text-xl font-normal">The Problem</h2>
          <p className="text-base leading-[1.5] text-ink-muted">{item.problem}</p>
        </section>
        <section className="stack mt-10">
          <h2 className="text-xl font-normal">What I Built</h2>
          <p className="text-base leading-[1.5] text-ink-muted">{item.approach}</p>
        </section>
        <section className="stack mt-10">
          <h2 className="text-xl font-normal">What It Does</h2>
          <p className="text-base leading-[1.5] text-ink-muted">{item.outcome}</p>
        </section>

        {item.builtOn && (
          <section className="mt-10 border-t border-line-2 pt-4">
            <p className="text-sm text-ink-muted">
              Built on{' '}
              <button
                onClick={() => go(`/work/${item.builtOn}`)}
                className="text-signal-text hover:underline"
              >
                {WORK.find((w) => w.slug === item.builtOn)?.headline}
              </button>
              .
            </p>
          </section>
        )}
      </div>

      {next && (
        <div className="border-t border-line-2">
          <div className="wrap flex flex-wrap items-center justify-between gap-4 py-8">
            <div>
              <p className="label">Next Case Study</p>
              <p className="mt-1 text-[1.375rem] font-normal">{next.headline}</p>
            </div>
            <button onClick={() => go(`/work/${next.slug}`)} className="btn shrink-0">
              Read It
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
