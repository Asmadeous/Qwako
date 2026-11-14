import { Link } from 'react-router-dom';

import { useAuth } from '../../../hooks';

const SiteFooter = () => {
  const { user } = useAuth();
  return (
  <footer className="bg-sand px-3 pt-16 pb-3 text-ink md:px-4">
    <div className="rounded-3xl border border-ink/20 px-5 py-6 md:px-8">
      <div className="flex justify-between border-b border-ink/20 pb-6 text-sm font-medium">
        <span className="font-bold">T&amp;G BnB</span>
        <span>Homes, considered.</span>
      </div>

      <div className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <h2 className="font-bold tracking-tight text-5xl leading-[0.95] sm:text-6xl md:text-8xl">
            Homes,
            <br />
            considered.
          </h2>
          <p className="mt-5 text-sm">Homes chosen for light, design and place.</p>
        </div>
        <div>
          <span className="text-sm font-medium text-ink/60">Explore</span>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/homes" className="hover:underline">All homes</Link></li>
            <li><a href="/#featured" className="hover:underline">Featured</a></li>
            <li><a href="/#inside" className="hover:underline">Inside a home</a></li>
          </ul>
        </div>
        <div>
          <span className="text-sm font-medium text-ink/60">Account</span>
          <ul className="mt-4 space-y-2 text-sm">
            {user ? (
              <>
                <li><Link to="/account" className="hover:underline">Your account</Link></li>
                <li><Link to="/account/bookings" className="hover:underline">Your trips</Link></li>
                <li><Link to="/account/saved" className="hover:underline">Saved homes</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:underline">Sign in</Link></li>
                <li><Link to="/register" className="hover:underline">Create account</Link></li>
              </>
            )}
          </ul>
        </div>
        <div>
          <span className="text-sm font-medium text-ink/60">Help</span>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link to="/contact" className="hover:underline">Contact us</Link></li>
            <li><Link to="/terms" className="hover:underline">Terms and cancellations</Link></li>
            <li><Link to="/privacy" className="hover:underline">Privacy notice</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/20 pt-6 text-sm font-medium">
        <span>© T&amp;G BnB {new Date().getFullYear()}</span>
        <span className="flex items-center gap-2 text-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Now taking bookings
        </span>
        <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:underline">Back to top</a>
      </div>
    </div>
  </footer>
  );
};

export default SiteFooter;
