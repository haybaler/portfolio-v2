import { ArrowLeft, ArrowRight } from 'lucide-react';
import { WORK } from '@/lib/work';
import { go } from '@/lib/router';

export default function CaseStudy({ slug }: { slug: string }) {
  const item = WORK.find((w) => w.slug === slug);
  if (!item) {
    return (
      <div className="wrap py-24">
        <p className="text-text-2">That case study does not exist.</p>
        <button onClick={() => go('/')} className="btn-primary mt-6">
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
      <div className="wrap pt-10 md:pt-14">
        <button
          onClick={() => go('/#work')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-2 transition-colors hover:text-text"
        >
          <ArrowLeft size={15} />
          Back to the Work
        </button>
      </div>

      <header className="wrap pt-10 pb-12 md:pt-14">
        <div className="flex flex-wrap gap-1.5">
          <span className="tag !bg-action-soft !text-action">{item.capability}</span>
          {item.tags.map((t) => (
            <span key={t} className="tag">
              {t}
            </span>
          ))}
        </div>
        <p className="eyebrow mt-6">{item.title}</p>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.1]">
          {item.headline}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-text-2">{item.summary}</p>
      </header>

      <div className="border-t border-line bg-card">
        <div className="wrap grid gap-px bg-line py-px md:grid-cols-3">
          <div className="bg-card px-0 py-6 md:pr-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-3">My Role</h2>
            <p className="mt-2 text-sm leading-relaxed">{item.role}</p>
          </div>
          <div className="bg-card py-6 md:px-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-3">
              Built With
            </h2>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {item.builtWith.map((tool) => (
                <span key={tool} className="tag !bg-card-2">
                  {tool}
                </span>
              ))}
            </p>
          </div>
          <div className="bg-card py-6 md:pl-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-text-3">
              The Data
            </h2>
            <p className="mt-2 text-sm leading-relaxed">Made-up data, invented company names.</p>
          </div>
        </div>
      </div>

      <div className="wrap max-w-3xl py-14 md:py-18">
        <section>
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">The Problem</h2>
          <p className="mt-4 text-base leading-[1.6] text-text-2">{item.problem}</p>
        </section>
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">What I Built</h2>
          <p className="mt-4 text-base leading-[1.6] text-text-2">{item.approach}</p>
        </section>
        <section className="mt-12">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">What It Does</h2>
          <p className="mt-4 text-base leading-[1.6] text-text-2">{item.outcome}</p>
        </section>

        {item.builtOn && (
          <section className="mt-12 border-l-2 border-action pl-6">
            <p className="text-sm text-text-2">
              Built on{' '}
              <button
                onClick={() => go(`/work/${item.builtOn}`)}
                className="font-semibold text-action hover:underline"
              >
                {WORK.find((w) => w.slug === item.builtOn)?.headline}
              </button>
              .
            </p>
          </section>
        )}
      </div>

      {next && (
        <div className="border-t border-line bg-card">
          <div className="wrap flex items-center justify-between gap-4 py-10">
            <div>
              <p className="eyebrow">Next Case Study</p>
              <p className="mt-1 text-base font-semibold">{next.headline}</p>
            </div>
            <button onClick={() => go(`/work/${next.slug}`)} className="btn-secondary shrink-0">
              Read It
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
