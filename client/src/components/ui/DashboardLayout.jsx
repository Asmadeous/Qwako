import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Home as House, LayoutDashboard, Luggage, User as UserRound, Wallet } from 'lucide-react';

import { useAuth } from '../../../hooks';
import { cn } from '@/lib/utils';

const OWNER_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/reservations', label: 'Bookings', icon: CalendarDays },
  { to: '/account/places', label: 'Homes', icon: House },
  { to: '/account/finances', label: 'Finances', icon: Wallet },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
];

const GUEST_LINKS = [
  { to: '/account/bookings', label: 'Your bookings', icon: Luggage },
  { to: '/account', label: 'Profile', icon: UserRound, end: true },
];

// Frame for every /account page: a menu down the side on larger screens and a
// scrollable row of tabs on phones. Pages render their own <AccountNav /> heading.
const DashboardLayout = () => {
  const { user } = useAuth();
  const links = user?.role === 'admin' ? OWNER_LINKS : GUEST_LINKS;
  const { pathname } = useLocation();
  const navRef = useRef(null);

  // On phones the menu is a sideways-scrolling row: keep the current page's tab in view.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    }
  }, [pathname]);

  return (
    <div className="grow pb-24 pt-20 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10 md:px-4 md:pt-24 lg:gap-14">
      <aside className="md:sticky md:top-24 md:self-start">
        <p className="hidden px-3 pb-3 text-sm font-medium text-ink/60 md:block">
          {user?.role === 'admin' ? 'Owner dashboard' : 'Your account'}
        </p>
        <nav
          ref={navRef}
          aria-label="Account"
          className="-mx-1 flex gap-1 overflow-x-auto px-4 pb-2 [scrollbar-width:none] md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0"
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-11 shrink-0 items-center gap-3 rounded-full px-4 text-sm font-medium transition-colors md:rounded-xl',
                  isActive ? 'bg-ink text-sand' : 'text-ink/75 hover:bg-ink/[0.06] hover:text-ink',
                )
              }
            >
              <Icon aria-hidden strokeWidth={1.75} className="size-[18px]" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 pt-4 md:pt-0">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
