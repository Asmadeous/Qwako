import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NotFoundPage = () => (
  <div className="px-4 pt-24 pb-24 md:pt-28">
    <p className="tabular text-sm text-ink/60">Error 404</p>
    <h1 className="mt-3 max-w-3xl font-bold tracking-tight text-5xl leading-[1.05] md:text-6xl">
      There's no page at this address.
    </h1>
    <p className="mt-4 max-w-[55ch] text-lg text-ink/75">
      The link may be old or mistyped. Every home we offer is on the homes page.
    </p>
    <Link
      to="/homes"
      className={cn(buttonVariants(), 'mt-8')}
    >
      Browse homes
    </Link>
  </div>
);

export default NotFoundPage;
