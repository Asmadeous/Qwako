import React from 'react';
import { Link } from 'react-router-dom';

import { formatPrice } from '@/utils/currency';
import PlaceImg from './PlaceImg';

const InfoCard = ({ place }) => {
  return (
    <Link
      to={`/account/places/${place.id}`}
      className="flex flex-col gap-5 rounded-2xl border border-ink/20 p-3 transition-colors hover:bg-paper sm:flex-row"
    >
      <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-gray-200 sm:h-32 sm:w-44">
        <PlaceImg place={place} className="h-full w-full object-cover" />
      </div>
      <div className="flex grow flex-col justify-between gap-2 py-1 pr-2">
        <div>
          <span className="font-grotesk text-[10px] tracking-[0.24em] text-ink/60">
            {place.address.toUpperCase()}
          </span>
          <h2 className="mt-1 font-serif text-2xl leading-tight md:text-3xl">{place.title}</h2>
        </div>
        <div className="flex items-center gap-3 font-grotesk text-sm">
          <span>{formatPrice(place.nightly_price_pence)} / night</span>
          <span className="text-ink/40">·</span>
          <span>Up to {place.max_guests} guests</span>
          {place.status !== 'published' && (
            <span className="rounded-full border border-ink/40 px-2 py-0.5 text-[10px] tracking-[0.18em]">
              {place.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default InfoCard;
