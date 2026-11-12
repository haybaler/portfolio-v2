import { LINKEDIN_URL } from '@/lib/content';

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ground">
      <div className="wrap flex flex-col gap-3 py-10 text-sm text-ink-muted md:flex-row md:items-center md:justify-between">
        <p className="text-sm">Every interactive example runs on made-up data, with invented company names.</p>
        <p className="flex items-center gap-2 text-sm">
          <span>Designed and built by Josh Haydon.</span>
          <span aria-hidden>·</span>
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-muted hover:text-signal-text transition-colors"
          >
            LinkedIn ↗
          </a>
        </p>
      </div>
    </footer>
  );
}
