import { Link } from 'react-router-dom';

import { formatPrice } from '@/utils/currency';
import { countyOf } from '@/utils/listingFilters';
import { listingPhotoProps } from '@/utils/images';
import SaveButton from './SaveButton';

const PlaceCard = ({ place, onSavedChange, query = '' }) => {
  const {
    id,
    photos,
    title,
    max_guests: guests,
    nightly_price_cents: price,
  } = place;
  const town = place.address.split(',')[0].trim();
  const county = countyOf(place);

  return (
    <article className="relative">
    <Link to={`/place/${id}${query}`} className="group block rounded-2xl">
      <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-ink/10">
        {photos?.[0] && (
          <img
            {...listingPhotoProps(photos[0], {
              sizes:
                '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
              maxW: 1080,
            })}
            alt={`${title}, ${town}`}
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
      </div>
      <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight">
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-ink/65">
        {town}
        {county && county !== town ? `, ${county}` : ''}
      </p>
      <p className="tabular mt-2 text-sm">
        <span className="font-semibold">
          {formatPrice(price, place.currency)}
        </span>{' '}
        a night
        <span className="text-ink/40"> / </span>
        up to {guests} guests
        {place.review_count > 0 && (
          <>
            <span className="text-ink/40"> / </span>
            <span aria-label={`Rated ${place.rating_average} out of 5`}>★ {Number(place.rating_average).toFixed(1)}</span>
          </>
        )}
      </p>
    </Link>
    <SaveButton place={place} onChange={onSavedChange} className="absolute right-2 top-2 bg-sand/90 text-ink shadow-sm backdrop-blur hover:bg-sand" />
    </article>
  );
};

export const PlaceCardSkeleton = () => (
  <div aria-hidden className="animate-pulse motion-reduce:animate-none">
    <div className="aspect-[4/3] rounded-2xl bg-ink/10" />
    <div className="mt-3 h-6 w-3/4 rounded bg-ink/10" />
    <div className="mt-2 h-4 w-1/2 rounded bg-ink/10" />
    <div className="mt-3 h-4 w-1/3 rounded bg-ink/10" />
  </div>
);

export default PlaceCard;
