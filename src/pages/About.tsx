import { ArrowRight, ArrowUpRight, Linkedin } from 'lucide-react';
import { LINKEDIN_URL } from '@/lib/content';
import { go } from '@/lib/router';

export default function About() {
  return (
    <>
      <section className="py-12 md:py-20">
        <div className="wrap stack mx-auto max-w-[64ch] justify-items-center text-center">
          <p className="label">About</p>
          <h1 className="display mx-auto">AI Engineer with Deep Commercial Context</h1>
        </div>
      </section>

      <div className="wrap stack mx-auto max-w-[64ch] pb-16 text-center">
        <div className="stack gap-6 text-base leading-[1.6] text-ink-muted">
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

        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => go('/#work')} className="btn btn-primary">
            See the Work
            <ArrowRight size={15} />
          </button>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            <Linkedin size={14} />
            LinkedIn
            <ArrowUpRight size={12} />
          </a>
        </div>
      </div>
    </>
  );
}
