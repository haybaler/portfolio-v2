import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { CAPABILITIES, COLLABORATIONS } from '@/lib/content';
import { WORK } from '@/lib/work';
import { WorkCard } from '@/components/WorkCard';
import { go } from '@/lib/router';

export default function Home() {
  const featured = WORK.filter((w) => w.featured);
  const rest = WORK.filter((w) => !w.featured);

  return (
    <>
      {/* Hero */}
      <section className="border-b border-line">
        <div className="wrap py-20 md:py-28">
          <p className="eyebrow fade-up">Josh Haydon · AI Engineer</p>
          <h1 className="fade-up mt-4 max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight md:text-6xl">
            From Business Problem to Working AI Product
          </h1>
          <p className="fade-up mt-6 max-w-2xl text-lg leading-relaxed text-text-2">
            I build AI-powered products, dashboards, and internal tools for sales, marketing, and
            operations. My strength is taking ambiguous problems, messy data and manual workflows
            through to useful, working software.
          </p>
          <div className="fade-up mt-8 flex flex-wrap gap-3">
            <button onClick={() => go('/#work')} className="btn-primary">
              See the Work
              <ArrowRight size={16} />
            </button>
            <a href="#/about" className="btn-secondary">
              About Me
            </a>
          </div>
        </div>
      </section>

      {/* What I Build */}
      <section className="border-b border-line bg-card">
        <div className="wrap py-16 md:py-20">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">What I Build</h2>
          <div className="mt-8 grid gap-px bg-line-2 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div key={c.name} className="bg-card p-6">
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-2">{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="border-b border-line scroll-mt-16">
        <div className="wrap py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Case Studies</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                The Work, by What It Does
              </h2>
            </div>
            <p className="max-w-sm text-sm text-text-2">
              Organized around capabilities. Department tags stay on the cards.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Collaborations */}
      <section id="collaborations" className="border-b border-line bg-card scroll-mt-16">
        <div className="wrap py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Selected Collaborations</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Brand and Digital Rebuilds, Directed End to End
              </h2>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-2">
            A large part of my remit at every organization was rebuilding the marketing
            infrastructure: brand identity, segments, copywriting and user flows, then directing
            designers and developers to ship the digital experience. I now do much of this directly
            with AI. Project descriptions adapted with permission.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {COLLABORATIONS.map((c) => (
              <article key={c.slug} className="flex flex-col gap-4 bg-ground p-6 md:p-8">
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-text-3">
                    {c.client}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold leading-snug">{c.headline}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-2">{c.summary}</p>
                </div>
                <div className="mt-auto flex flex-col gap-2 text-xs text-text-2">
                  <p className="leading-relaxed">{c.role}</p>
                  <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    <span className="text-text-3">Built with</span>
                    {c.credits.map((credit, i) => (
                      <span key={credit.name} className="inline-flex items-center gap-1">
                        {i > 0 && <span aria-hidden>·</span>}
                        <a
                          href={credit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-text hover:text-action transition-colors"
                        >
                          {credit.name}
                        </a>
                        <ArrowUpRight size={11} className="text-text-3" aria-hidden />
                      </span>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <section className="bg-ground">
        <div className="wrap flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center md:py-20">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Get in Touch</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-text-2">
              Have a business problem that should be a working product? Tell me about it.
            </p>
          </div>
          <button onClick={() => go('/contact')} className="btn-primary">
            Get in Touch
            <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}
