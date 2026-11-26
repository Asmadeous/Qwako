import { Link } from 'react-router-dom';

import { useAuth } from '../../../hooks';
import NewsletterSignup from '@/components/ui/NewsletterSignup';

const linkClass =
  'rounded-sm text-sand/80 transition-colors hover:text-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand';

const Column = ({ title, children }) => (
  <div>
    <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-sand/50">{title}</h2>
    <ul className="mt-4 space-y-3 text-sm">{children}</ul>
  </div>
);

// Dark band at the foot of every public page: the logo, the newsletter and the links.
const SiteFooter = () => {
  const { user } = useAuth();
  return (
    <footer className="bg-ink text-sand">
      <div className="mx-auto max-w-screen-xl px-5 pb-8 pt-16 md:px-8 md:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sand">
              <img src="/brand/tg-homes-horizontal-white.svg" alt="TG-Homes" width="215" height="48" className="h-12 w-auto" />
            </Link>
            <NewsletterSignup dark />
          </div>

          <Column title="Explore">
            <li><Link to="/homes" className={linkClass}>All homes</Link></li>
            <li><Link to="/blog" className={linkClass}>Blog</Link></li>
          </Column>

          <Column title="Account">
            {user ? (
              <>
                <li><Link to="/account" className={linkClass}>Your account</Link></li>
                <li><Link to="/account/bookings" className={linkClass}>Your bookings</Link></li>
                <li><Link to="/account/saved" className={linkClass}>Saved homes</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className={linkClass}>Sign in</Link></li>
                <li><Link to="/register" className={linkClass}>Create account</Link></li>
              </>
            )}
          </Column>

          <Column title="Help">
            <li><Link to="/contact" className={linkClass}>Contact us</Link></li>
            <li><Link to="/terms" className={linkClass}>Terms and cancellations</Link></li>
            <li><Link to="/privacy" className={linkClass}>Privacy notice</Link></li>
          </Column>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-sand/15 pt-6 text-sm text-sand/60">
          <span>© TG-Homes {new Date().getFullYear()}</span>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className={linkClass}
          >
            Back to top
          </button>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
