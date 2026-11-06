import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AccountNav from '@/components/ui/AccountNav';
import PlaceImg from '@/components/ui/PlaceImg';
import BookingDates from '@/components/ui/BookingDates';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const getBookings = async () => {
      try {
        const { data } = await api.get('/bookings');
        setBookings(data.bookings);
      } catch {
        setError('We could not load your bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    getBookings();
  }, []);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div>
        <AccountNav />
        <p role="alert" className="mx-4">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <AccountNav />
      <div className="mx-4 grid gap-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <Link
              to={`/account/bookings/${booking.id}`}
              className="group flex gap-5 overflow-hidden rounded-2xl border border-ink/20 p-3 transition-colors hover:bg-paper"
              key={booking.id}
            >
              <div className="h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-gray-200 md:h-36 md:w-52">
                {booking.listing.photos[0] && (
                  <PlaceImg place={booking.listing} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex grow flex-col justify-between py-1 pr-2">
                <div>
                  <span className="font-grotesk text-[10px] tracking-[0.24em] text-ink/60">
                    {booking.status.toUpperCase().replace('_', ' ')}
                  </span>
                  <h2 className="mt-1 font-serif text-2xl leading-tight md:text-4xl">{booking.listing.title}</h2>
                  <BookingDates booking={booking} className="mt-2 hidden items-center gap-1 text-sm text-ink/70 md:flex" />
                </div>
                <span className="font-grotesk text-sm">
                  Total <strong className="font-semibold">{formatPrice(booking.total_pence)}</strong>
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-ink/20 p-8 md:p-12">
            <h2 className="font-serif text-4xl md:text-5xl">No trips booked yet.</h2>
            <p className="mt-3 max-w-md font-grotesk text-sm text-ink/70">
              Browse the cottages, cabins and city flats and pick your dates.
            </p>
            <Link
              to="/stays"
              className="mt-6 inline-block border-b border-ink pb-0.5 font-grotesk text-xs tracking-[0.12em]"
            >
              BROWSE STAYS <span className="ml-2">→</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
