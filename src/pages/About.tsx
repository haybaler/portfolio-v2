import { ArrowRight, ArrowUpRight, Linkedin } from 'lucide-react';
import { LINKEDIN_URL } from '@/lib/content';
import { go } from '@/lib/router';

export default function About() {
  return (
    <>
      <section className="border-b border-line">
        <div className="wrap py-16 md:py-24">
          <p className="eyebrow">About</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight md:text-5xl md:leading-[1.1]">
            AI Engineer with Deep Commercial Context
          </h1>
        </div>
      </section>

      <div className="wrap max-w-3xl py-14">
        <div className="flex flex-col gap-6 text-base leading-[1.7] text-text-2">
          <p>
            I lead commercial and product work in life sciences, and I build with AI. For years my
            remit was the same at every organization: rebuild the entire marketing infrastructure —
            brand identity, segments, copywriting, user flows — then direct designers and developers
            to translate that vision into the digital experiences our sales, marketing and
            communications teams ran on.
          </p>
          <p>
            Now I do much of that directly. The same arc — problem, data, system, working software —
            just executed end to end with AI tools instead of through layers of handoffs. My
            commercial background is the differentiator: I build the product around how revenue
            teams actually work, because I have run those teams.
          </p>
          <p>
            Every number on this site shows its rule, so nobody argues about whose spreadsheet is
            right. Interactive examples run on made-up data with invented company names — the
            method is real, the data is not.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <button onClick={() => go('/#work')} className="btn-primary">
            See the Work
            <ArrowRight size={16} />
          </button>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            <Linkedin size={15} />
            LinkedIn
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </>
  );
}
