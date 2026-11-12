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
      {/* Hero — centered, 300-weight display, the IBM build */}
      <section className="hero py-12 md:py-20">
        <div className="wrap stack justify-items-center text-center">
          <p className="label">Josh Haydon · AI Engineer</p>
          <h1 className="display mx-auto">From Business Problem to Working AI Product</h1>
          <p className="lede mx-auto max-w-[48ch]">
            I build AI-powered products, dashboards, and internal tools for sales, marketing, and
            operations. My strength is taking ambiguous problems, messy data and manual workflows
            through to useful, working software.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => go('/#work')} className="btn btn-primary">
              See the Work
            </button>
            <a href="#/about" className="btn">
              About Me
            </a>
          </div>
        </div>
      </section>

      {/* What I Build */}
      <section id="what-i-build" className="section py-14 md:py-20">
        <div className="wrap">
          <div className="stack mx-auto mb-10 max-w-[80ch] justify-items-center text-center">
            <p className="label">What I Build</p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-normal leading-tight">
              AI Products, Data Products, Revenue Systems and Automation
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c) => (
              <div key={c.name} className="card stack gap-2">
                <h3 className="text-sm font-semibold">{c.name}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{c.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Work */}
      <section id="work" className="section py-14 md:py-20 scroll-mt-16">
        <div className="wrap">
          <div className="mb-10 flex flex-wrap items-baseline justify-between gap-2 md:gap-4">
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-normal leading-tight">Case Studies</h2>
            <p className="text-sm text-ink-muted">Organized by capability. Departments stay as tags.</p>
          </div>

          <p className="label mb-4">Featured</p>
          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {featured.map((item) => (
              <WorkCard key={item.slug} item={item} featured />
            ))}
          </div>

          <p className="label mb-4">More Case Studies</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((item) => (
              <WorkCard key={item.slug} item={item} />
            ))}
          </div>
        </div>
      </section>

      {/* Collaborations */}
      <section id="collaborations" className="section bg-card py-14 md:py-20 scroll-mt-16">
        <div className="wrap">
          <div className="stack mx-auto mb-10 max-w-[80ch] justify-items-center text-center">
            <p className="label">Selected Collaborations</p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)] font-normal leading-tight">
              Brand and Digital Rebuilds, Directed End to End
            </h2>
            <p className="lede mx-auto max-w-[56ch]">
              A large part of my remit at every organization was rebuilding the marketing
              infrastructure: brand identity, segments, copywriting and user flows, then directing
              designers and developers to ship the digital experience. I now do much of this
              directly with AI. Project descriptions adapted with permission.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {COLLABORATIONS.map((c) => (
              <article key={c.slug} className="stack gap-4 bg-ground p-5 md:p-6">
                <div className="flex flex-wrap gap-1.5">
                  {c.tags.map((t) => (
                    <span key={t} className="tag">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="stack gap-2">
                  <p className="label">{c.client}</p>
                  <h3 className="text-lg font-normal leading-snug">{c.headline}</h3>
                  <p className="text-sm leading-relaxed text-ink-muted">{c.summary}</p>
                </div>
                <div className="stack mt-auto gap-2 text-sm text-ink-muted">
                  <p className="leading-relaxed">{c.role}</p>
                  <p className="flex flex-wrap items-center gap-x-1 gap-y-1">
                    <span className="text-ink-faint">Built with</span>
                    {c.credits.map((credit, i) => (
                      <span key={credit.name} className="inline-flex items-center gap-1">
                        {i > 0 && <span aria-hidden>·</span>}
                        <a
                          href={credit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-normal text-ink hover:text-signal-text"
                        >
                          {credit.name}
                        </a>
                        <ArrowUpRight size={11} className="text-ink-faint" aria-hidden />
                      </span>
                    ))}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact strip — centered, like the original's ContactBlock */}
      <section className="contact mt-14 md:mt-24">
        <div className="wrap stack items-center justify-items-center py-14 text-center md:py-20">
          <h2 className="text-[clamp(2.5rem,6vw,4.5rem)] font-light leading-[1.1]">
            Get in Touch
          </h2>
          <p className="lede mx-auto max-w-[48ch]">
            Have a business problem that should be a working product? Tell me about it.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => go('/contact')} className="btn btn-primary">
              Get in Touch
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
