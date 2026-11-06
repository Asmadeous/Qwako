import { MapPin } from 'lucide-react';

import { cn } from '@/lib/utils';

const AddressLink = ({ placeAddress, className }) => (
  <a
    className={cn(
      'inline-flex items-center gap-1.5 text-ink/75 underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink',
      className,
    )}
    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeAddress)}`}
    target="_blank"
    rel="noopener noreferrer"
  >
    <MapPin aria-hidden strokeWidth={1.5} className="size-4 shrink-0" />
    {placeAddress}
    <span className="sr-only"> (opens map in a new tab)</span>
  </a>
);

export default AddressLink;
