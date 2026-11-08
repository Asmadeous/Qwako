import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../../hooks';

const titleFor = (pathname) => {
  if (pathname === '/account/places/new') return 'Add a stay';
  if (pathname.startsWith('/account/places/')) return 'Edit stay';
  if (pathname === '/account/places') return 'Your stays';
  if (pathname.startsWith('/account/bookings/')) return 'Your booking';
  if (pathname === '/account/bookings') return 'Your bookings';
  if (pathname.startsWith('/account/reservations/')) return 'Booking';
  if (pathname === '/account/reservations') return 'Bookings';
  return 'Your profile';
};

// Dashboard heading and tabs, in the home page's editorial style.
const AccountNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const section = pathname.split('/')[2] || 'profile';

  // The owner's Bookings tab lists every guest's bookings, not their own trips.
  const tabs =
    user?.role === 'admin'
      ? [
          { id: 'profile', label: 'Profile', to: '/account' },
          { id: 'reservations', label: 'Bookings', to: '/account/reservations' },
          { id: 'places', label: 'Manage stays', to: '/account/places' },
        ]
      : [
          { id: 'profile', label: 'Profile', to: '/account' },
          { id: 'bookings', label: 'Bookings', to: '/account/bookings' },
        ];

  return (
    <div className="mt-24 mb-10 w-full px-4">
      <div className="flex items-end justify-between border-b border-ink/20 pb-6">
        <div>
          <span className="text-sm font-medium text-ink/60">
            {user?.role === 'admin' ? 'Owner dashboard' : 'Your account'}
          </span>
          <h1 className="mt-3 font-bold tracking-tight text-5xl leading-[0.9] md:text-7xl">{titleFor(pathname)}</h1>
        </div>
      </div>
      <nav className="flex gap-6 pt-4 text-sm font-medium" aria-label="Account">
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            to={tab.to}
            aria-current={section === tab.id ? 'page' : undefined}
            className={
              section === tab.id
                ? 'text-ink underline decoration-1 underline-offset-[6px]'
                : 'text-ink/60 hover:text-ink'
            }
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AccountNav;
