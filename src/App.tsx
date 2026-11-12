import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import CaseStudy from '@/pages/CaseStudy';
import { StackProvider } from '@/components/stack';
import { WORK } from '@/lib/work';
import { useRoute } from '@/lib/router';
import { FILL_IN_KEY } from '@/lib/demoMap';
import '@/styles/demos.css';

const TITLES: Record<string, string> = {
  '/': 'Josh Haydon · AI Engineer',
  '/about': 'About · Josh Haydon',
  '/contact': 'Get in Touch · Josh Haydon',
};

export default function App() {
  const route = useRoute();

  let page = <Home />;
  if (route === '/about') page = <About />;
  else if (route === '/contact') page = <Contact />;
  else if (route.startsWith('/work/')) {
    const slug = route.slice('/work/'.length);
    page = <WorkPage slug={slug} />;
  }

  useEffect(() => {
    const work = WORK.find((w) => route === `/work/${w.slug}`);
    const title = work ? `${work.title} · Josh Haydon` : TITLES[route] ?? TITLES['/'];
    document.title = title;
  }, [route]);

  return (
    <StackProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{page}</main>
        <Footer />
      </div>
    </StackProvider>
  );
}

/** A case study with a live example renders the interactive page; the rest render the written one. */
function WorkPage({ slug }: { slug: string }) {
  const item = WORK.find((w) => w.slug === slug);
  if (!item) return <CaseStudy slug={slug} />;
  const Demo = FILL_IN_KEY[slug];
  return Demo ? <Demo /> : <CaseStudy slug={slug} />;
}
