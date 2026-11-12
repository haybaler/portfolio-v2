import { ArrowRight } from 'lucide-react';
import type { WorkItem } from '@/lib/content';
import { go } from '@/lib/router';
import Thumb from '@/components/Thumb';

export function WorkCard({ item, featured = false }: { item: WorkItem; featured?: boolean }) {
  return (
    <button
      onClick={() => go(`/work/${item.slug}`)}
      className={`work-card text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
        featured ? 'grid-rows-[auto_auto_1fr_auto]' : 'grid-rows-[auto_auto_1fr_auto]'
      }`}
    >
      {item.demo && <Thumb slug={item.slug} large={featured} />}
      <div className="flex flex-wrap gap-1.5">
        <span className="tag">{item.capability}</span>
        {item.tags.slice(0, 1).map((t) => (
          <span key={t} className="tag !bg-card-3 !text-ink-muted">
            {t}
          </span>
        ))}
      </div>
      <div className="stack gap-1.5">
        <p className="label">{item.title}</p>
        <h3
          className={`font-normal leading-[1.25] ${
            featured ? 'text-[1.625rem]' : 'text-xl'
          }`}
        >
          {item.headline}
        </h3>
        <p className="text-sm leading-relaxed text-ink-muted">{item.summary}</p>
      </div>
      <span className="text-signal-text">
        See the Case Study <ArrowRight size={13} className="inline translate-y-[1px]" />
      </span>
    </button>
  );
}
