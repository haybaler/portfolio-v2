import { ArrowRight } from 'lucide-react';
import type { WorkItem } from '@/lib/content';
import { go } from '@/lib/router';

export function WorkCard({ item }: { item: WorkItem }) {
  return (
    <button
      onClick={() => go(`/work/${item.slug}`)}
      className="card group flex flex-col gap-4 text-left transition-colors hover:bg-card-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-action"
    >
      <div className="flex flex-wrap gap-1.5">
        <span className="tag !bg-action-soft !text-action">{item.capability}</span>
        {item.tags.slice(0, 1).map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-text-3">{item.title}</p>
        <h3 className="mt-1 text-lg font-semibold leading-snug text-text">{item.headline}</h3>
        <p className="mt-2 text-sm leading-relaxed text-text-2">{item.summary}</p>
      </div>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-action">
        See the Case Study
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}
