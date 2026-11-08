import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../../hooks';

const LINKS = [
  { label: 'Stays', to: '/stays' },
  { label: 'Featured', href: '#featured' },
  { label: 'Inside', href: '#inside' },
];

const Nav = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  // Signed-in visitors go to their account; everyone else to sign in.
  const account = user ? { to: '/account', label: 'Account' } : { to: '/login', label: 'Sign in' };

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <nav className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-5 py-4 text-white mix-blend-difference md:px-8">
        <a href="#top" className="pointer-events-auto text-base font-extrabold tracking-tight">
          T&amp;G BnB
        </a>
        <div className="pointer-events-auto flex items-center gap-6">
          <Link to={account.to} className="inline-flex min-h-11 items-center text-sm font-medium hover:underline">
            {account.label}
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="flex min-h-11 items-center gap-2 bg-transparent text-sm font-medium"
            aria-expanded={open}
          >
          Menu
          <span className="grid grid-cols-2 gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
                <span key={i} className="h-[3px] w-[3px] rounded-full bg-current" />
              ))}
            </span>
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-50 flex flex-col bg-sand px-5 py-4 text-ink transition-all duration-700 md:px-8 ${
          open ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between">
          <span className="text-base font-extrabold tracking-tight">T&amp;G BnB</span>
          <button
            onClick={() => setOpen(false)}
            className="bg-transparent text-sm font-medium"
          >
            Close ✕
          </button>
        </div>
        <ul className="mt-auto mb-auto space-y-2">
          {LINKS.map((l, i) => (
            <li
              key={l.label}
              className={`transition-all duration-700 ${open ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            >
              {l.to ? (
                <Link to={l.to} className="font-bold tracking-tight text-6xl leading-none hover:underline md:text-8xl">
                  {l.label}
                </Link>
              ) : (
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-bold tracking-tight text-6xl leading-none hover:underline md:text-8xl"
                >
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between text-sm font-medium text-ink/60">
          <span>Stays, considered.</span>
          <Link to={account.to} className="hover:underline">{account.label}</Link>
        </div>
      </div>
    </>
  );
};

export default Nav;
