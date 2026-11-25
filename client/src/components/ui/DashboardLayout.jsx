import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ArrowRight,
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
  Mail,
  MessageSquare,
  Newspaper,
  Luggage,
  Search,
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
import { isOwner, isTeam } from '@/utils/roles';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const OWNER_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/calendar', label: 'Calendar', icon: CalendarRange },
  { to: '/account/reservations', label: 'Bookings', icon: CalendarDays },
  { to: '/account/inbox', label: 'Inbox', icon: Inbox },
  { to: '/account/places', label: 'Homes', icon: House, ownerOnly: true },
  { to: '/account/guests', label: 'Guests', icon: Users },
  { to: '/account/reviews', label: 'Reviews', icon: Star },
  { to: '/account/transactions', label: 'Transactions', icon: Wallet, ownerOnly: true },
  { to: '/account/newsletter', label: 'Newsletter', icon: Mail, ownerOnly: true },
  { to: '/account/blog', label: 'Blog', icon: Newspaper, ownerOnly: true },
  { to: '/account/team', label: 'Team', icon: UserCog, ownerOnly: true },
  { to: '/account/activity', label: 'Activity log', icon: History, ownerOnly: true },
];

const GUEST_LINKS = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/bookings', label: 'Bookings', icon: Luggage },
  { to: '/account/transactions', label: 'Transactions', icon: Wallet },
  { to: '/account/saved', label: 'Saved homes', icon: Heart },
  { to: '/account/messages', label: 'Messages', icon: MessageSquare },
];

// Everyone's own pages live in the avatar menu rather than the tab bar.
const PERSONAL_LINKS = [
  { to: '/account/profile', label: 'Profile', icon: UserRound },
  { to: '/account/settings', label: 'Settings', icon: Settings },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
];

const linksFor = (user) =>
  isOwner(user) ? OWNER_LINKS : isTeam(user) ? OWNER_LINKS.filter((link) => !link.ownerOnly) : GUEST_LINKS;

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const iconButton =
  'relative grid size-11 shrink-0 place-items-center rounded-full border border-ink/10 bg-paper text-ink/75 transition-colors hover:border-ink/25 hover:text-ink';

// Jump to any dashboard page by name; the team can also search bookings by
// guest or home. Opens from the search field or with Ctrl/Cmd+K.
const SearchDialog = ({ open, onOpenChange, user }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = [...linksFor(user), ...PERSONAL_LINKS]
      .filter((link) => !q || link.label.toLowerCase().includes(q))
      .map((link) => ({ ...link, key: link.to }));
    if (q && isTeam(user)) {
      pages.push({
        key: 'bookings-search',
        to: `/account/reservations?view=all&q=${encodeURIComponent(query.trim())}`,
        label: `Search bookings for “${query.trim()}”`,
        icon: Search,
      });
    }
    return pages;
  }, [query, user]);

  const go = (item) => {
    if (!item) return;
    onOpenChange(false);
    navigate(item.to);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="top-[20%] max-w-lg translate-y-0 gap-0 overflow-hidden rounded-3xl p-0">
        <DialogTitle className="sr-only">Search the dashboard</DialogTitle>
        <div className="flex items-center gap-3 border-b border-ink/10 pl-4 pr-14">
          <Search aria-hidden className="size-4 shrink-0 text-ink/50" />
          <input
            autoFocus
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls="dash-search-results"
            aria-activedescendant={results[active] ? `dash-search-${active}` : undefined}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder={isTeam(user) ? 'Go to a page, or search bookings' : 'Go to a page'}
            className="!my-0 !min-h-14 !rounded-none !border-0 !bg-transparent !px-0 !ring-0"
          />
        </div>
        <ul id="dash-search-results" role="listbox" aria-label="Results" className="max-h-80 overflow-y-auto p-2">
          {results.map((item, i) => (
            <li
              key={item.key}
              id={`dash-search-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(item)}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm',
                i === active ? 'bg-ink/[0.06] text-ink' : 'text-ink/75',
              )}
            >
              <item.icon aria-hidden strokeWidth={1.75} className="size-4 shrink-0" />
              <span className="grow truncate">{item.label}</span>
              {i === active && <ArrowRight aria-hidden className="size-4 text-ink/50" />}
            </li>
          ))}
          {results.length === 0 && <li className="px-3 py-6 text-center text-sm text-ink/60">No page called that.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

const Avatar = ({ user, className }) => (
  <span className={cn('grid place-items-center overflow-hidden rounded-full bg-ink text-sm font-semibold text-sand', className)}>
    {user.avatar_url ? <img src={user.avatar_url} alt="" className="size-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
  </span>
);

// Top bar for the dashboard: the brand, search, messages, notifications and
// the account menu. The public site's menu doesn't belong here.
export const DashboardHeader = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: notifications } = useNotifications();
  const unread = notifications?.unread ?? 0;
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const signOut = async () => {
    setMenuOpen(false);
    navigate('/', { replace: true });
    const response = await logout();
    if (response.success) toast.success(response.message);
    else toast.error(response.message);
  };

  const team = isTeam(user);

  return (
    <header className="sticky top-0 z-30 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center gap-3 px-5 md:px-8">
        <Link to="/account" className="flex min-h-11 shrink-0 flex-col items-center justify-center leading-none" aria-label="TG Homes dashboard">
          <svg aria-hidden viewBox="0 0 28 28" className="size-7 text-ink">
            <path d="M3 4h22v6H17v15h-6V10H3z" fill="currentColor" />
            <path d="M17 18h8v7h-8z" fill="currentColor" opacity=".35" />
          </svg>
          <span className="mt-1 text-[8px] font-semibold uppercase tracking-[0.3em] text-ink/70">TG Homes</span>
        </Link>
        <span className="ml-2 hidden rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink/60 lg:inline">
          {isOwner(user) ? 'Owner dashboard' : team ? 'Team dashboard' : 'Your account'}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="hidden h-11 w-72 items-center gap-2 rounded-full border border-ink/10 bg-paper px-4 text-sm text-ink/50 transition-colors hover:border-ink/25 md:flex"
          >
            <Search aria-hidden className="size-4" />
            <span className="grow text-left">Search here</span>
            <kbd className="font-sans text-xs text-ink/60">{isMac ? '⌘' : 'Ctrl+'}K</kbd>
          </button>
          <button type="button" aria-label="Search" onClick={() => setSearchOpen(true)} className={cn(iconButton, 'md:hidden')}>
            <Search aria-hidden strokeWidth={1.75} className="size-5" />
          </button>
          <Link
            to={team ? '/account/inbox' : '/account/messages'}
            aria-label="Messages"
            className={iconButton}
          >
            <MessageSquare aria-hidden strokeWidth={1.75} className="size-5" />
          </Link>
          <Link
            to="/account/notifications"
            aria-label={unread ? `Notifications, ${unread} new` : 'Notifications'}
            className={iconButton}
          >
            <Bell aria-hidden strokeWidth={1.75} className="size-5" />
            {unread > 0 && (
              <span className="tabular absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-semibold leading-5 text-sand">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
          {user && (
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <button type="button" aria-label="Account menu" className="ml-1 rounded-full ring-ink/10 transition hover:ring-4">
                  <Avatar user={user} className="size-11" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={8} className="w-64 rounded-2xl border-ink/10 p-2 shadow-lg">
                <div className="flex items-center gap-3 px-2 pb-3 pt-1">
                  <Avatar user={user} className="size-9" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="block truncate text-xs text-ink/60">{user.email}</span>
                  </span>
                </div>
                <nav aria-label="Your account" className="grid border-t border-ink/10 pt-2">
                  {PERSONAL_LINKS.map(({ to, label, icon: Icon }) => (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setMenuOpen(false)}
                      className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-sm text-ink/80 hover:bg-ink/[0.05] hover:text-ink"
                    >
                      <Icon aria-hidden strokeWidth={1.75} className="size-4" />
                      {label}
                    </Link>
                  ))}
                  <Link
                    to="/homes"
                    target="_blank"
                    rel="noopener"
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-sm text-ink/80 hover:bg-ink/[0.05] hover:text-ink"
                  >
                    <ExternalLink aria-hidden strokeWidth={1.75} className="size-4" />
                    View the website
                  </Link>
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex min-h-10 items-center gap-3 rounded-xl px-2 text-sm text-ink/80 hover:bg-ink/[0.05] hover:text-ink"
                  >
                    <LogOut aria-hidden strokeWidth={1.75} className="size-4" />
                    Sign out
                  </button>
                </nav>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} user={user} />
    </header>
  );
};

// Reminds people to confirm their email, with a way to get the link again.
const VerifyBanner = ({ email }) => {
  const [sent, setSent] = useState(false);
  return (
    <p className="mx-4 mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-paper px-4 py-3 text-sm">
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

// Frame for every /account page: a row of pill tabs under the top bar
// (scrolls sideways when it doesn't fit). Pages render their own <AccountNav /> heading.
const DashboardLayout = () => {
  const { user } = useAuth();
  const links = linksFor(user);
  const { pathname } = useLocation();
  const navRef = useRef(null);

  // Keep the current page's tab in view when the row scrolls.
  useEffect(() => {
    const nav = navRef.current;
    const active = nav?.querySelector('[aria-current="page"]');
    if (nav && active && nav.scrollWidth > nav.clientWidth) {
      nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
    }
  }, [pathname]);

  return (
    <div className="grow pb-24 pt-1 md:px-4">
      <div className="mx-4 mb-8 flex">
        <nav
          ref={navRef}
          aria-label="Dashboard"
          className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-paper p-1.5 shadow-[0_1px_2px_rgb(0_0_0/0.04)] [scrollbar-width:none]"
        >
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm transition-colors',
                  isActive ? 'bg-brand text-sand shadow-[0_4px_12px_rgb(var(--brand)/0.35)]' : 'text-ink/65 hover:bg-ink/[0.05] hover:text-ink',
                )
              }
            >
              <Icon aria-hidden strokeWidth={1.75} className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="min-w-0">
        {user && !user.email_verified && <VerifyBanner email={user.email} />}
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
