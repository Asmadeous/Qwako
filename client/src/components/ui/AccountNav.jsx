import { useLocation } from 'react-router-dom';

import { useAuth } from '../../../hooks';

const titleFor = (pathname, isOwner) => {
  if (pathname === '/account') return isOwner ? 'Overview' : 'Overview';
  if (pathname === '/account/settings') return 'Settings';
  if (pathname === '/account/notifications') return 'Notifications';
  if (pathname === '/account/saved') return 'Saved homes';
  if (pathname.startsWith('/account/messages')) return 'Messages';
  if (pathname === '/account/calendar') return 'Calendar';
  if (pathname.startsWith('/account/inbox')) return 'Inbox';
  if (pathname.startsWith('/account/guests')) return 'Guests';
  if (pathname === '/account/reviews') return 'Reviews';
  if (pathname === '/account/team') return 'Team';
  if (pathname === '/account/activity') return 'Activity log';
  if (pathname === '/account/profile') return 'Your profile';
  if (pathname === '/account/places/new') return 'Add a home';
  if (pathname.startsWith('/account/places/')) return 'Edit home';
  if (pathname === '/account/places') return 'Homes';
  if (pathname === '/account/finances') return 'Finances';
  if (pathname.startsWith('/account/bookings/')) return 'Your booking';
  if (pathname === '/account/bookings') return 'Trips';
  if (pathname.startsWith('/account/reservations/')) return 'Booking';
  if (pathname === '/account/reservations') return 'Bookings';
  return 'Your account';
};

// Heading for a dashboard page; the menu itself lives in DashboardLayout.
// `actions` sit on the right, for example an "Add a home" button.
const AccountNav = ({ actions, description }) => {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <header className="mx-4 mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-ink/15 pb-5">
      <div>
        <h1 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
          {titleFor(pathname, user?.role === 'admin')}
        </h1>
        {description && <p className="mt-1.5 text-pretty text-ink/70">{description}</p>}
      </div>
      {actions}
    </header>
  );
};

export default AccountNav;
