import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { api } from '@/utils/axios';

import Spinner from '@/components/ui/Spinner';
import AddressLink from '@/components/ui/AddressLink';
import BookingWidget from '@/components/ui/BookingWidget';
import PlaceGallery from '@/components/ui/PlaceGallery';
import PerksWidget from '@/components/ui/PerksWidget';

const PlacePage = () => {
  const { id } = useParams();
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      return '';
    }

    setLoading(true);

    const getPlace = async () => {
      try {
        const { data } = await api.get(`/listings/${id}`);
        setPlace(data.listing);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    getPlace();
  }, [id]);

  if (loading) {
    return <Spinner />;
  }

  if (notFound) {
    return (
      <section role="alert" className="mx-auto max-w-xl px-4 pt-40 pb-24 text-center">
        <span className="font-grotesk text-[10px] tracking-[0.24em] text-ink/60">STAY NOT FOUND</span>
        <h1 className="mt-4 font-serif text-5xl leading-none md:text-6xl">This stay is no longer listed.</h1>
        <p className="mt-4 font-grotesk text-sm text-ink/70">
          The link may be old, or the stay has been taken off the site.
        </p>
        <Link
          to="/stays"
          className="mt-8 inline-block border-b border-ink pb-0.5 font-grotesk text-xs tracking-[0.12em]"
        >
          BROWSE ALL STAYS <span className="ml-2">→</span>
        </Link>
      </section>
    );
  }

  if (!place) {
    return null;
  }

  return (
    <div className="mt-4 overflow-x-hidden px-8 pt-20 ">
      <h1 className="font-serif text-5xl leading-none md:text-6xl">{place.title}</h1>

      <AddressLink placeAddress={place.address} />
      <PlaceGallery place={place} />

      <div className="mt-8 mb-8 grid grid-cols-1 gap-8 md:grid-cols-[2fr_1fr]">
        <div className="">
          <div className="my-4 ">
            <h2 className="font-serif text-3xl">Description</h2>
            {place.description}
          </div>
          Max number of guests: {place.max_guests}
          <PerksWidget perks={place.amenities} />
        </div>
        <div>
          <BookingWidget place={place} />
        </div>
      </div>
      <div className="-mx-8 border-t bg-paper px-8 py-8">
        <div>
          <h2 className="mt-4 font-serif text-3xl">House rules</h2>
        </div>
        <div className="mb-4 mt-2 text-sm leading-5 text-gray-700">
          {place.house_rules}
        </div>
      </div>
    </div>
  );
};

export default PlacePage;
