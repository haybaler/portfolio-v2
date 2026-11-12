import { useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import CaseStudy from '@/pages/CaseStudy';
import { WORK } from '@/lib/content';
import { useRoute } from '@/lib/router';

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
  else if (route.startsWith('/work/')) page = <CaseStudy slug={route.slice('/work/'.length)} />;

  useEffect(() => {
    const work = WORK.find((w) => route === `/work/${w.slug}`);
    const title = work ? `${work.title} · Josh Haydon` : TITLES[route] ?? TITLES['/'];
    document.title = title;
  }, [route]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}
