import React from 'react';
import { Outlet } from 'react-router-dom';

import { Header } from './Header';
import SiteFooter from '@/pages/home/SiteFooter';

const Layout = () => {
  return (
    <div className="bg-sand text-ink">
      <Header />
      <main className="mx-auto flex min-h-screen max-w-screen-xl flex-col px-1 md:px-4">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Layout;
