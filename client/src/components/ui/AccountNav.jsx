import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../../hooks';

const titleFor = (pathname) => {
  if (pathname === '/account/places/new') return 'Add a stay';
  if (pathname.startsWith('/account/places/')) return 'Edit stay';
  if (pathname === '/account/places') return 'Your stays';
  if (pathname.startsWith('/account/bookings/')) return 'Your booking';
  if (pathname === '/account/bookings') return 'Your bookings';
  return 'Your profile';
};

// Dashboard heading and tabs, in the home page's editorial style.
const AccountNav = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const section = pathname.split('/')[2] || 'profile';

  const tabs = [
    { id: 'profile', label: 'PROFILE', to: '/account' },
    { id: 'bookings', label: 'BOOKINGS', to: '/account/bookings' },
    ...(user?.role === 'admin' ? [{ id: 'places', label: 'MANAGE STAYS', to: '/account/places' }] : []),
  ];

  return (
    <div className="mt-24 mb-10 w-full px-4">
      <div className="flex items-end justify-between border-b border-ink/20 pb-6">
        <div>
          <span className="font-grotesk text-[10px] tracking-[0.24em] text-ink/60">
            {user?.role === 'admin' ? 'OWNER DASHBOARD' : 'YOUR ACCOUNT'}
          </span>
          <h1 className="mt-3 font-serif text-5xl leading-[0.9] md:text-7xl">{titleFor(pathname)}</h1>
        </div>
      </div>
      <nav className="flex gap-6 pt-4 font-grotesk text-[11px] tracking-[0.18em]" aria-label="Account">
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
