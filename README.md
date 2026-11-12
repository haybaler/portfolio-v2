# portfolio-v2

Portfolio of Josh Haydon — AI engineer with deep commercial context. From business problem to working AI product.

## What's here

- **Home (`#/`)** — positioning hero ("From Business Problem to Working AI Product"), a What I Build section (AI Products / Data Products & Dashboards / Revenue Systems / Automation & Integration), the twelve AI case studies organized by capability with department tags, and Selected Collaborations (Helix, Karius, Slingshot Bio) with studio credits.
- **Case studies (`#/work/<slug>`)** — every project answers: the problem, what I built, what it does, how, and who contributed. My Role and Built With on every page; cross-links where one project builds on another.
- **About (`#/about`)** — the arc: marketing-infrastructure rebuilds directed through studios, now built directly with AI.
- **Contact (`#/contact`)** — a form backed by Supabase (insert-only: visitors can send, nobody can read anyone's messages), plus direct email and LinkedIn.

All interactive example data is made up, with invented company names. No employer or customer data.

## Stack

Vite, React, TypeScript, Tailwind CSS, lucide-react, Supabase.

## Run it

```sh
npm install        # generates package-lock.json (not committed)
npm run dev        # local dev server
npm run build      # production build into dist/
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

The contact form expects `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in a local `.env` (not committed). The table is `contact_messages` with an insert-only policy for the anon role.

## Deploy

Any static host works (Vercel, Netlify, Cloudflare Pages): build with `npm run build` and serve `dist/`. Add the two `VITE_SUPABASE_*` variables in the host's environment settings.
