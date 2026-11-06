import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, Users } from 'lucide-react';

import { api } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import AddressLink from '@/components/ui/AddressLink';
import BookingWidget from '@/components/ui/BookingWidget';
import PlaceGallery from '@/components/ui/PlaceGallery';
import PerksWidget from '@/components/ui/PerksWidget';

const PlaceSkeleton = () => (
  <div aria-busy="true" className="animate-pulse px-4 pt-24 motion-reduce:animate-none md:pt-28">
    <span className="sr-only">Loading stay</span>
    <div className="h-4 w-20 rounded bg-gray-200" />
    <div className="mt-4 h-14 w-2/3 rounded bg-gray-200" />
    <div className="mt-3 h-4 w-1/3 rounded bg-gray-200" />
    <div className="mt-6 aspect-[4/3] rounded-2xl bg-gray-200 md:aspect-auto md:h-[min(62dvh,540px)]" />
  </div>
);

const PlacePage = () => {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let current = true;
    setPlace(null);
    setNotFound(false);
    api
      .get(`/listings/${id}`)
      .then(({ data }) => current && setPlace(data.listing))
      .catch(() => current && setNotFound(true));
    return () => {
      current = false;
    };
  }, [id]);

  useEffect(() => {
    if (!place) return undefined;
    document.title = `${place.title} | T&G BnB`;
    return () => {
      document.title = 'T&G BnB';
    };
  }, [place]);

  // Old or removed listing links go back to the stays list.
  if (notFound) {
    return <Navigate to="/stays" replace state={{ notice: 'That stay is no longer listed.' }} />;
  }

  if (!place) return <PlaceSkeleton />;

  const scrollToBooking = () =>
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <article className="px-4 pt-24 pb-28 md:pt-28 md:pb-24">
      <Link
        to="/stays"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 transition-colors hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        All stays
      </Link>

      <header className="mb-6 mt-1">
        <h1 className="font-serif text-5xl leading-[1.05] md:text-7xl">{place.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <AddressLink placeAddress={place.address} />
          <span className="inline-flex items-center gap-1.5 text-ink/75">
            <Users aria-hidden strokeWidth={1.5} className="size-4" />
            Sleeps {place.max_guests}
          </span>
        </div>
      </header>

      <PlaceGallery place={place} />

      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div>
          <section className="pb-8">
            <h2 className="font-serif text-3xl">About this stay</h2>
            <p className="mt-4 max-w-[65ch] whitespace-pre-line text-lg leading-relaxed text-ink/85">
              {place.description}
            </p>
          </section>

          <PerksWidget perks={place.amenities} />

          {place.house_rules && (
            <section className="border-t border-ink/15 py-8">
              <h2 className="font-serif text-3xl">House rules</h2>
              <p className="mt-4 max-w-[65ch] whitespace-pre-line leading-relaxed text-ink/85">
                {place.house_rules}
              </p>
            </section>
          )}
        </div>

        <aside id="booking" className="scroll-mt-24 self-start md:sticky md:top-24">
          <BookingWidget place={place} />
        </aside>
      </div>

      {/* Phones: keep the price and a way to book in reach. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-ink/15 bg-sand px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
        <p className="flex items-baseline gap-1.5">
          <span className="tabular font-serif text-2xl leading-none">{formatPrice(place.nightly_price_pence)}</span>
          <span className="text-sm text-ink/70">a night</span>
        </p>
        <button
          type="button"
          onClick={scrollToBooking}
          className="h-11 rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90 active:scale-[0.98]"
        >
          Check dates
        </button>
      </div>
    </article>
  );
};

export default PlacePage;
