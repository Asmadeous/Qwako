import { Link } from 'react-router-dom';

import { formatPrice } from '@/utils/currency';
import { countyOf } from '@/utils/listingFilters';

const PlaceCard = ({ place }) => {
  const { id, photos, title, max_guests: guests, nightly_price_cents: price } = place;
  const town = place.address.split(',')[0].trim();
  const county = countyOf(place);

  return (
    <Link to={`/place/${id}`} className="group block rounded-2xl">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gray-200">
        {photos?.[0] && (
          <img
            src={photos[0]}
            alt={`${title}, ${town}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </div>
      <h2 className="mt-3 font-serif text-2xl leading-tight">{title}</h2>
      <p className="mt-0.5 text-sm text-ink/65">
        {town}
        {county && county !== town ? `, ${county}` : ''}
      </p>
      <p className="tabular mt-2 text-sm">
        <span className="font-semibold">{formatPrice(price, place.currency)}</span> a night
        <span className="text-ink/40"> / </span>
        up to {guests} guests
      </p>
    </Link>
  );
};

export const PlaceCardSkeleton = () => (
  <div aria-hidden className="animate-pulse motion-reduce:animate-none">
    <div className="aspect-[4/3] rounded-2xl bg-gray-200" />
    <div className="mt-3 h-6 w-3/4 rounded bg-gray-200" />
    <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
    <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
  </div>
);

export default PlaceCard;
