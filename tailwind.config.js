/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: '#ffffff',
        card: '#f4f4f4',
        'card-2': '#e8e8e8',
        'card-3': '#e0e0e0',
        'card-4': '#d1d1d1',
        line: '#e0e0e0',
        'line-2': '#c6c6c6',
        'line-control': '#8d8d8d',
        text: '#161616',
        'text-2': '#525252',
        'text-3': '#8d8d8d',
        action: '#0f62fe',
        'action-hover': '#0043ce',
        'action-soft': '#e0ecff',
        ok: '#007d79',
        warn: '#f1c21b',
        error: '#da1e28',
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        eyebrow: ['0.75rem', { lineHeight: '1.6', letterSpacing: '0.32em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
      },
      maxWidth: {
        wrap: '68rem',
      },
    },
  },
  plugins: [],
};
