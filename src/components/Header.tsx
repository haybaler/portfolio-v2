import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { CONTACT_HREF } from '@/lib/content';
import { go } from '@/lib/router';

const NAV = [
  { label: 'Work', path: '/#work' },
  { label: 'Collaborations', path: '/#collaborations' },
  { label: 'About', path: '/about' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const nav = (path: string) => {
    setOpen(false);
    if (path.startsWith('/#')) {
      const current = window.location.hash.slice(1) || '/';
      if (current === '/') {
        const el = document.getElementById(path.slice(2));
        el?.scrollIntoView({ behavior: 'smooth' });
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
    <header
      className={`sticky top-0 z-40 bg-ground/90 backdrop-blur transition-shadow ${
        scrolled ? 'shadow-[0_1px_0_0_#e0e0e0]' : ''
      }`}
    >
      <div className="wrap flex h-16 items-center justify-between">
        <a
          href="#/"
          className="text-sm font-semibold tracking-tight hover:text-action transition-colors"
          aria-label="Josh Haydon, home"
        >
          Josh Haydon
        </a>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {NAV.map((item) => (
            <button
              key={item.path}
              onClick={() => nav(item.path)}
              className="text-sm font-medium text-text-2 transition-colors hover:text-text"
            >
              {item.label}
            </button>
          ))}
          <a href={CONTACT_HREF} className="btn-primary !px-4 !py-2 text-xs">
            Get in Touch
          </a>
        </nav>

        <button
          className="p-2 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-ground md:hidden">
          <nav className="wrap flex flex-col gap-1 py-4" aria-label="Mobile">
            {NAV.map((item) => (
              <button
                key={item.path}
                onClick={() => nav(item.path)}
                className="py-2 text-left text-sm font-medium text-text-2"
              >
                {item.label}
              </button>
            ))}
            <a href={CONTACT_HREF} className="btn-primary mt-2">
              Get in Touch
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
