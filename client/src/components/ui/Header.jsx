import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';

import { useAuth } from '../../../hooks';

const navClass = ({ isActive }) =>
  `inline-flex min-h-11 items-center whitespace-nowrap text-sm font-medium hover:underline ${isActive ? 'underline underline-offset-4' : ''}`;

// Same wordmark, type and palette as the home page navigation.
export const Header = () => {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 0);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-30 bg-sand/95 text-ink backdrop-blur transition-[border-color] ${
        scrolled ? 'border-b border-ink/20' : 'border-b border-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-5 py-2 md:px-8">
        <Link to="/" className="inline-flex min-h-11 items-center whitespace-nowrap text-base font-extrabold tracking-tight">
          T&amp;G BnB
        </Link>

        <nav className="flex items-center gap-5 md:gap-7" aria-label="Main">
          <NavLink to="/stays" className={navClass}>
            Stays
          </NavLink>
          {user ? (
            <Link to="/account" className="flex min-h-11 items-center gap-2 text-sm font-medium">
              <span className="hidden md:inline">Account</span>
              <Avatar className="flex h-8 w-8 overflow-hidden rounded-full">
                {user.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                )}
                <AvatarFallback className="flex h-full w-full items-center justify-center bg-ink text-xs font-semibold text-sand">
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
