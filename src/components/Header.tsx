import { useEffect, useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { CONTACT_HREF } from '@/lib/content';
import { go } from '@/lib/router';

const NAV = [
  { label: 'Work', path: '/#work' },
  { label: 'Collaborations', path: '/#collaborations' },
  { label: 'About', path: '/about' },
];

function useTheme() {
  const [dark, setDark] = useState(
    () =>
      window.matchMedia?.('(prefers-color-scheme: dark)').matches ??
      false
  );
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return [dark, () => setDark((d) => !d)] as const;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [dark, toggleTheme] = useTheme();

  const nav = (path: string) => {
    setOpen(false);
    if (path.startsWith('/#')) {
      const current = window.location.hash.slice(1) || '/';
      if (current === '/') {
        document.getElementById(path.slice(2))?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      go('/');
      window.setTimeout(() => {
        document.getElementById(path.slice(2))?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
      return;
    }
    go(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-ground">
      <div className="wrap flex min-h-14 items-center justify-between gap-2 py-2">
        <a
          href="#/"
          className="name inline-flex min-h-11 items-center gap-2 text-base text-ink hover:underline"
          aria-label="Josh Haydon, home"
        >
          <span className="mark" aria-hidden />
          Josh Haydon
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              className="text-sm text-ink-muted transition-colors hover:text-ink"
            >
              {item.label}
            </button>
          ))}
          <a href={CONTACT_HREF} className="btn btn-primary !min-h-9 !px-3.5 !py-1.5 text-sm">
            Get in Touch
          </a>
          <button
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-ink-muted transition-colors hover:text-ink"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </nav>

        <div className="flex items-center gap-1 md:hidden">
          <button
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-ink-muted"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button
            className="p-2"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-ground md:hidden">
          <nav className="wrap stack py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className="min-h-11 text-left text-sm text-ink-muted"
              >
                {item.label}
              </button>
            ))}
            <a href={CONTACT_HREF} className="btn btn-primary mt-1">
              Get in Touch
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
