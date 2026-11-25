import { useLocation } from 'react-router-dom';

const titleFor = (pathname) => {
  if (pathname === '/account') return 'Overview';
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
  if (pathname === '/account/newsletter') return 'Newsletter';
  if (pathname === '/account/blog/new') return 'New post';
  if (pathname.startsWith('/account/blog/')) return 'Edit post';
  if (pathname === '/account/blog') return 'Blog';
  if (pathname === '/account/profile') return 'Your profile';
  if (pathname === '/account/places/new') return 'Add a home';
  if (pathname.startsWith('/account/places/')) return 'Edit home';
  if (pathname === '/account/places') return 'Homes';
  if (pathname === '/account/transactions') return 'Transactions';
  if (pathname.startsWith('/account/bookings/')) return 'Your booking';
  if (pathname === '/account/bookings') return 'Bookings';
  if (pathname === '/account/reservations/new') return 'New booking';
  if (pathname.startsWith('/account/reservations/')) return 'Booking';
  if (pathname === '/account/reservations') return 'Bookings';
  return 'Your account';
};

// Heading for a dashboard page; the menu itself lives in DashboardLayout.
// `actions` sit on the right, for example an "Add a home" button.
const AccountNav = ({ actions, description }) => {
  const { pathname } = useLocation();

  return (
    <header className="mx-4 mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-balance text-3xl font-normal tracking-[-0.035em] md:text-[2.75rem] md:leading-[1.1]">
          {titleFor(pathname)}
        </h1>
        {description && <p className="mt-2 text-pretty text-ink/55">{description}</p>}
      </div>
      {actions}
    </header>
  );
};

export default AccountNav;
