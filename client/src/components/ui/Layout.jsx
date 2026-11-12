import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Header } from './Header';
import SiteFooter from '@/pages/home/SiteFooter';

const APP_PAGES = /^\/(account|login|register|forgot-password|reset-password)(\/|$)/;

const Layout = () => {
  const { pathname } = useLocation();

  // Each new page starts at the top; in-page anchors (/#featured) still scroll to their section.
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-sand text-ink">
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 text-sm text-sand focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="mx-auto flex min-h-dvh max-w-screen-xl flex-col px-1 md:px-4">
        <Outlet />
      </main>
      {/* The marketing footer belongs to browsing pages, not the dashboard or sign-in. */}
      {!APP_PAGES.test(pathname) && <SiteFooter />}
    </div>
  );
};

export default Layout;
