import { useEffect, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Header } from './Header';
import { DashboardHeader } from './DashboardLayout';
import SiteFooter from '@/pages/home/SiteFooter';

const APP_PAGES = /^\/(account|login|register|forgot-password|reset-password)(\/|$)/;
const DASHBOARD = /^\/account(\/|$)/;

const Layout = () => {
  const { pathname } = useLocation();
  const dashboard = DASHBOARD.test(pathname);

  // The dashboard has its own palette (.dash in index.css). It goes on <html>
  // so dialogs and toasts, which render outside this tree, match it.
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dash', dashboard);
  }, [dashboard]);

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
      {dashboard ? <DashboardHeader /> : <Header />}
      <main id="main" className={`mx-auto flex min-h-dvh flex-col px-1 md:px-4 ${dashboard ? 'max-w-[1440px]' : 'max-w-screen-xl'}`}>
        <Outlet />
      </main>
      {/* The marketing footer belongs to browsing pages, not the dashboard or sign-in. */}
      {!APP_PAGES.test(pathname) && <SiteFooter />}
    </div>
  );
};

export default Layout;
