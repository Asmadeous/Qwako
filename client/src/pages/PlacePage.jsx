import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ChevronLeft, Play, Users } from 'lucide-react';

import { api } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import AddressLink from '@/components/ui/AddressLink';
import BookingWidget from '@/components/ui/BookingWidget';
import PlaceGallery from '@/components/ui/PlaceGallery';
import PerksWidget from '@/components/ui/PerksWidget';
import { Button } from '@/components/ui/button';

const PlaceSkeleton = () => (
  <div aria-busy="true" className="animate-pulse px-4 pt-24 motion-reduce:animate-none md:pt-28">
    <span className="sr-only">Loading home</span>
    <div className="h-4 w-20 rounded bg-ink/10" />
    <div className="mt-4 h-14 w-2/3 rounded bg-ink/10" />
    <div className="mt-3 h-4 w-1/3 rounded bg-ink/10" />
    <div className="mt-6 aspect-[4/3] rounded-2xl bg-ink/10 md:aspect-auto md:h-[min(62dvh,540px)]" />
  </div>
);

const PlacePage = () => {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [bookingInView, setBookingInView] = useState(false);

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

  // The phone booking bar steps aside while the booking box itself is on screen.
  useEffect(() => {
    const box = place && document.getElementById('booking');
    if (!box) return undefined;
    const observer = new IntersectionObserver(([entry]) => setBookingInView(entry.isIntersecting));
    observer.observe(box);
    return () => observer.disconnect();
  }, [place]);

  // Old or removed listing links go back to the homes list.
  if (notFound) {
    return <Navigate to="/homes" replace state={{ notice: 'That home is no longer listed.' }} />;
  }

  if (!place) return <PlaceSkeleton />;

  const scrollToBooking = () =>
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <article className="px-4 pt-24 pb-28 md:pt-28 md:pb-24">
      <Link
        to="/homes"
        className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 transition-colors hover:text-ink"
      >
        <ChevronLeft aria-hidden className="size-4" />
        All homes
      </Link>

      <header className="mb-6 mt-1">
        <h1 className="font-bold tracking-tight text-5xl leading-[1.05] md:text-6xl">{place.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <AddressLink placeAddress={place.address} />
          <span className="inline-flex items-center gap-1.5 text-ink/75">
            <Users aria-hidden strokeWidth={1.5} className="size-4" />
            Sleeps {place.max_guests}
          </span>
          {place.videos?.length > 0 && (
            <a
              href="#videos"
              className="inline-flex items-center gap-1.5 text-ink/75 underline decoration-ink/25 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
            >
              <Play aria-hidden strokeWidth={1.5} className="size-4" />
              {place.videos.length === 1 ? 'Video tour' : `${place.videos.length} videos`}
            </a>
          )}
        </div>
      </header>

      <PlaceGallery place={place} />

      <div className="mt-10 grid gap-10 md:grid-cols-[minmax(0,1fr)_360px] lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16">
        <div>
          <section className="pb-8">
            <h2 className="font-bold tracking-tight text-3xl">About this home</h2>
            <p className="mt-4 max-w-[65ch] whitespace-pre-line text-lg leading-relaxed text-ink/85">
              {place.description}
            </p>
          </section>

          {place.videos?.length > 0 && (
            <section id="videos" className="scroll-mt-24 border-t border-ink/15 py-8">
              <h2 className="font-bold tracking-tight text-3xl">{place.videos.length === 1 ? 'Video tour' : 'Videos'}</h2>
              <div className="mt-5 grid gap-4">
                {place.videos.map((src, i) => (
                  <video
                    key={src}
                    src={src}
                    controls
                    preload="metadata"
                    playsInline
                    aria-label={`${place.title}, video ${i + 1} of ${place.videos.length}`}
                    className="aspect-video w-full rounded-2xl bg-ink"
                  />
                ))}
              </div>
            </section>
          )}

          <PerksWidget perks={place.amenities} />

          {place.house_rules && (
            <section className="border-t border-ink/15 py-8">
              <h2 className="font-bold tracking-tight text-3xl">House rules</h2>
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
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-ink/15 bg-sand px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[transform,opacity] duration-200 md:hidden ${
          bookingInView ? 'pointer-events-none translate-y-full opacity-0' : ''
        }`}
        aria-hidden={bookingInView || undefined}
      >
        <p className="flex items-baseline gap-1.5">
          <span className="tabular font-bold tracking-tight text-2xl leading-none">{formatPrice(place.nightly_price_cents, place.currency)}</span>
          <span className="text-sm text-ink/70">a night</span>
        </p>
        <Button onClick={scrollToBooking}>Check dates</Button>
      </div>
    </article>
  );
};

export default PlacePage;
