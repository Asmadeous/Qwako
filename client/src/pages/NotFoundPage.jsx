import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="px-4 pt-32 pb-24 md:pt-40">
    <p className="tabular text-sm text-ink/60">Error 404</p>
    <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">
      There's no page at this address.
    </h1>
    <p className="mt-4 max-w-[55ch] text-lg text-ink/75">
      The link may be old or mistyped. Every stay we offer is on the stays page.
    </p>
    <Link
      to="/stays"
      className="mt-8 inline-flex h-12 items-center rounded-full bg-ink px-8 text-sm font-medium text-sand transition-colors hover:bg-ink/90 active:scale-[0.98]"
    >
      Browse stays
    </Link>
  </div>
);

export default NotFoundPage;
