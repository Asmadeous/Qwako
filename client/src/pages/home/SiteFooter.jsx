import { Link } from 'react-router-dom';

const SiteFooter = () => (
  <footer className="bg-sand px-3 pt-16 pb-3 text-ink md:px-4">
    <div className="rounded-3xl border border-ink/20 px-5 py-6 md:px-8">
      <div className="flex justify-between border-b border-ink/20 pb-6 font-grotesk text-[10px] tracking-[0.2em]">
        <span>T&amp;G / BNB</span>
        <span>STAYS, CONSIDERED.</span>
      </div>

      <div className="grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <h2 className="font-serif text-6xl leading-[0.9] md:text-8xl">
            Stays,
            <br />
            considered.
          </h2>
          <p className="mt-5 font-grotesk text-sm">Homes chosen for light, design and place.</p>
        </div>
        <div>
          <span className="font-grotesk text-[9px] tracking-[0.24em] text-ink/60">EXPLORE</span>
          <ul className="mt-4 space-y-2 font-grotesk text-sm">
            <li><Link to="/stays" className="hover:underline">All stays</Link></li>
            <li><a href="#featured" className="hover:underline">Featured</a></li>
            <li><a href="#inside" className="hover:underline">Inside a stay</a></li>
          </ul>
        </div>
        <div>
          <span className="font-grotesk text-[9px] tracking-[0.24em] text-ink/60">ACCOUNT</span>
          <ul className="mt-4 space-y-2 font-grotesk text-sm">
            <li><Link to="/login" className="hover:underline">Sign in</Link></li>
            <li><Link to="/register" className="hover:underline">Create account</Link></li>
            <li><Link to="/account/places/new" className="hover:underline">Host with us</Link></li>
          </ul>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink/20 pt-6 font-grotesk text-[9px] tracking-[0.2em]">
        <span>© T&amp;G BNB {new Date().getFullYear()}</span>
        <span className="flex items-center gap-2 tracking-normal text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" /> Now taking bookings
        </span>
        <a href="#top" className="hover:underline">BACK TO TOP</a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
