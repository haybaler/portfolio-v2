export const CONTACT_EMAIL = 'jashaydon@gmail.com';
export const CONTACT_HREF = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Portfolio inquiry')}`;
export const LINKEDIN_URL = 'https://www.linkedin.com/in/joshuahaydon/';

export type Capability = 'AI Products' | 'Data Products & Dashboards' | 'Revenue Systems' | 'Automation & Integration';

export const CAPABILITIES: { name: Capability; blurb: string }[] = [
  {
    name: 'AI Products',
    blurb: 'Working applications with AI behavior grounded in business rules and trusted data.',
  },
  {
    name: 'Data Products & Dashboards',
    blurb: 'Interfaces that turn fragmented records into answers, plans and decisions.',
  },
  {
    name: 'Revenue Systems',
    blurb: 'Tools for sales and marketing teams, from attribution to territory planning.',
  },
  {
    name: 'Automation & Integration',
    blurb: 'Scheduled and human-approved systems that remove repetitive operational work.',
  },
];

export type WorkItem = {
  slug: string;
  title: string;
  headline: string;
  summary: string;
  capability: Capability;
  /** Department tags, kept as filters rather than identity. */
  tags: string[];
  role: string;
  builtWith: string[];
  /** What problem it solved. */
  problem: string;
  /** What the finished product did. */
  outcome: string;
  /** How it was built, in plain words. */
  approach: string;
  featured?: boolean;
  builtOn?: string;
};

export const COLLABORATIONS = [
  {
    slug: 'helix',
    client: 'Helix',
    clientUrl: 'https://helix.com',
    headline: 'A Population Genomics Brand, Rebuilt for Scale',
    summary:
      'A full rebrand and digital experience for a population genomics company: modular design system, a content platform that absorbed years of legacy material, and an interactive staircase that carried a vital public-health story.',
    role: 'I owned the brand rebuild — identity, segments, copywriting and user flows — then directed the studio team that translated the vision into the shipped digital experience.',
    credits: [
      { name: 'Sony Maharjan', url: 'https://www.sonymaharjan.com', label: 'Design' },
      { name: 'Aleph', url: 'https://aleph.dev/clients/helix', label: 'Studio' },
    ],
    tags: ['Brand', 'Web'],
  },
  {
    slug: 'karius',
    client: 'Karius',
    clientUrl: 'https://kariusdx.com',
    headline: 'Clinical Diagnostics, Made Clear to Buyers and Clinicians',
    summary:
      'An AI-powered clinical diagnostics company needed a rebrand and site rebuild that made a novel test understandable: prominent search, interactive case studies and a story a clinician could trust.',
    role: 'I owned the marketing infrastructure rebuild — brand identity, positioning, copywriting and user flows — then directed the design and build through the studio team.',
    credits: [
      { name: 'Sony Maharjan', url: 'https://www.sonymaharjan.com', label: 'Design' },
      { name: 'Aleph', url: 'https://aleph.dev', label: 'Studio' },
    ],
    tags: ['Brand', 'Web'],
  },
  {
    slug: 'slingshot-bio',
    client: 'Slingshot Bio',
    clientUrl: 'https://slingshotbio.com',
    headline: 'Two Sites Converged into One Commerce Platform',
    summary:
      'A WordPress marketing site and a separate Shopify store, with no shared design, content or data, converged into one modern headless commerce platform, instrumented end to end.',
    role: 'I owned the marketing infrastructure rebuild — brand identity, messaging, segments and user flows — then directed the studio through the design and build.',
    credits: [
      { name: 'Roboto Studio', url: 'https://robotostudio.com', label: 'Studio' },
    ],
    tags: ['Brand', 'Commerce', 'Web'],
  },
];
