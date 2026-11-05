import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LINKS = [
  { label: 'Stays', to: '/stays' },
  { label: 'Featured', href: '#featured' },
  { label: 'Inside', href: '#inside' },
  { label: 'Host with us', to: '/account/places/new' },
];

const Nav = () => {
  const [open, setOpen] = useState(false);

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
        <a href="#top" className="pointer-events-auto font-grotesk text-sm font-medium tracking-tight">
          T&amp;G / BNB
        </a>
        <button
          onClick={() => setOpen(true)}
          className="pointer-events-auto flex items-center gap-2 bg-transparent font-grotesk text-xs font-medium tracking-[0.12em]"
          aria-expanded={open}
        >
          MENU
          <span className="grid grid-cols-2 gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[3px] w-[3px] rounded-full bg-current" />
            ))}
          </span>
        </button>
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
          <span className="font-grotesk text-sm font-medium">T&amp;G / BNB</span>
          <button
            onClick={() => setOpen(false)}
            className="bg-transparent font-grotesk text-xs font-medium tracking-[0.12em]"
          >
            CLOSE ✕
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
                <Link to={l.to} className="font-serif text-6xl leading-none hover:italic md:text-8xl">
                  {l.label}
                </Link>
              ) : (
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-serif text-6xl leading-none hover:italic md:text-8xl"
                >
                  {l.label}
                </a>
              )}
            </li>
          ))}
        </ul>
        <div className="flex justify-between font-grotesk text-[11px] tracking-[0.14em] text-ink/60">
          <span>STAYS, CONSIDERED.</span>
          <Link to="/login">SIGN IN</Link>
        </div>
      </div>
    </>
  );
};

export default Nav;
