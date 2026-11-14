import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Bell,
  CalendarDays,
  CalendarRange,
  ExternalLink,
  Heart,
  History,
  Home as House,
  Inbox,
  LayoutDashboard,
  LogOut,
  Luggage,
  MessageSquare,
  Settings,
  Star,
  User as UserRound,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react';
import { api } from '@/utils/axios';
import { useNotifications } from '@/providers/NotificationsProvider';

import { useAuth } from '../../../hooks';
import { cn } from '@/lib/utils';

const OWNER_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/calendar', label: 'Calendar', icon: CalendarRange },
  { to: '/account/reservations', label: 'Bookings', icon: CalendarDays },
  { to: '/account/inbox', label: 'Inbox', icon: Inbox },
  { to: '/account/places', label: 'Homes', icon: House },
  { to: '/account/guests', label: 'Guests', icon: Users },
  { to: '/account/reviews', label: 'Reviews', icon: Star },
  { to: '/account/finances', label: 'Finances', icon: Wallet },
  { to: '/account/team', label: 'Team', icon: UserCog },
  { to: '/account/activity', label: 'Activity log', icon: History },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

const GUEST_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/bookings', label: 'Trips', icon: Luggage },
  { to: '/account/saved', label: 'Saved homes', icon: Heart },
  { to: '/account/messages', label: 'Messages', icon: MessageSquare },
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/account/settings', label: 'Settings', icon: Settings },
];

// Top bar for the dashboard: the brand, who is signed in, and sign out.
// The public site's menu doesn't belong here.
export const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const unread = notifications?.unread ?? 0;

  const signOut = async () => {
    navigate('/', { replace: true });
    const response = await logout();
    if (response.success) toast.success(response.message);
    else toast.error(response.message);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-ink/15 bg-sand/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between gap-4 px-5 md:px-8">
        <Link to="/account" className="flex min-h-11 items-center gap-3 whitespace-nowrap">
          <span className="text-base font-extrabold tracking-tight">T&amp;G BnB</span>
          <span className="hidden border-l border-ink/20 pl-3 text-sm font-medium text-ink/65 sm:inline">
            {user?.role === 'admin' ? 'Owner dashboard' : 'Your account'}
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            to="/account/notifications"
            aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
            className="relative grid size-11 place-items-center rounded-full text-ink/75 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Bell aria-hidden strokeWidth={1.75} className="size-5" />
            {unread > 0 && (
              <span className="tabular absolute right-1 top-1 grid min-w-5 place-items-center rounded-full bg-red-700 px-1 text-[11px] font-semibold leading-5 text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          {user && (
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="grid size-8 place-items-center overflow-hidden rounded-full bg-ink text-xs font-semibold text-sand">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  user.name.slice(0, 1).toUpperCase()
                )}
              </span>
              <span className="hidden max-w-[12rem] truncate md:inline">{user.name}</span>
            </span>
          )}
          <button
            type="button"
            onClick={signOut}
            className="ml-2 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink/75 transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <LogOut aria-hidden className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
            <span className="sr-only sm:hidden">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// Frame for every /account page: a menu down the side on larger screens and a
// scrollable row of tabs on phones. Pages render their own <AccountNav /> heading.
// Reminds people to confirm their email, with a way to get the link again.
const VerifyBanner = ({ email }) => {
  const [sent, setSent] = useState(false);
  return (
    <p className="mx-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-ink/20 bg-paper px-4 py-3 text-sm">
      <span>Confirm your email: open the link we sent to {email}.</span>
      {sent ? (
        <span className="font-semibold">Sent. Check your inbox.</span>
      ) : (
        <button
          type="button"
          onClick={() => api.post('/email_verification').then(() => setSent(true)).catch(() => setSent(true))}
          className="min-h-9 font-semibold underline underline-offset-4"
        >
          Send it again
        </button>
      )}
    </p>
  );
};

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
    <div className="grow pb-24 pt-4 md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-10 md:px-4 md:pt-8 lg:gap-14">
      <aside className="md:sticky md:top-24 md:flex md:h-[calc(100dvh-8rem)] md:flex-col md:justify-between md:self-start">
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
        <Link
          to="/homes"
          target="_blank"
          rel="noopener"
          className="hidden h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium text-ink/65 transition-colors hover:bg-ink/[0.06] hover:text-ink md:flex"
        >
          <ExternalLink aria-hidden strokeWidth={1.75} className="size-[18px]" />
          View the website
        </Link>
      </aside>
      <div className="min-w-0 pt-4 md:pt-0">
        {user && !user.email_verified && <VerifyBanner email={user.email} />}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
