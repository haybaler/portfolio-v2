/*
Tailwind config for the Josh Haydon portfolio, in IBM Design Language:
Plex type, Blue 60 signal, gray layers, 8px grid, square corners.
*/
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)',
        card: 'var(--card)',
        'card-2': 'var(--card-2)',
        'card-3': 'var(--card-3)',
        'card-4': 'var(--card-4)',
        line: 'var(--line)',
        'line-2': 'var(--line-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        'ink-muted': 'var(--ink-muted)',
        'ink-faint': 'var(--ink-faint)',
        signal: 'var(--signal)',
        'signal-text': 'var(--signal-text)',
        'signal-soft': 'var(--signal-soft)',
        positive: 'var(--positive)',
        negative: 'var(--negative)',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        wrap: '1120px',
        narrow: '68ch',
      },
    },
  },
  plugins: [],
};
