import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';

import { useAuth } from '../../../hooks';

const navClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium hover:underline ${isActive ? 'underline underline-offset-4' : ''}`;

// The one site navigation. On the home page it sits see-through over the hero
// photo and turns solid once the photo has scrolled away; everywhere else it is solid.
export const Header = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 0);
      setPastHero(window.scrollY > window.innerHeight - 64);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const overPhoto = onHome && !pastHero;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b transition-colors duration-200 ${
        overPhoto
          ? 'border-transparent bg-transparent text-white'
          : `bg-sand/95 text-ink backdrop-blur ${scrolled ? 'border-ink/20' : 'border-transparent'}`
      }`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-5 py-2 md:px-8">
        <Link to="/" className="inline-flex min-h-11 items-center whitespace-nowrap text-base font-extrabold tracking-tight">
          T&amp;G BnB
        </Link>

        <nav className="flex items-center gap-5 md:gap-7" aria-label="Main">
          <NavLink to="/homes" className={navClass}>
            Homes
          </NavLink>
          {user ? (
            <Link to="/account" className="flex min-h-11 items-center gap-2 text-sm font-medium hover:underline">
              <span className="hidden md:inline">{user.role === 'admin' ? 'Dashboard' : 'Account'}</span>
              <Avatar className="flex h-8 w-8 overflow-hidden rounded-full">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
                <AvatarFallback
                  className={`flex h-full w-full items-center justify-center text-xs font-semibold ${
                    overPhoto ? 'bg-sand text-ink' : 'bg-ink text-sand'
                  }`}
                >
                  {user.name.slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <NavLink to="/login" className={navClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
};
