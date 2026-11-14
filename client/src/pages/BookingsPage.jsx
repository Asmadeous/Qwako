import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ViewTabs } from '@/components/ui/PageStates';

import AccountNav from '@/components/ui/AccountNav';
import PlaceImg from '@/components/ui/PlaceImg';
import BookingDates from '@/components/ui/BookingDates';
import Spinner from '@/components/ui/Spinner';
import { api } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { bookingStatusLabel } from '@/utils/bookingStatus';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const view = ['upcoming', 'past', 'cancelled'].includes(searchParams.get('view')) ? searchParams.get('view') : 'upcoming';

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

  const today = format(new Date(), 'yyyy-MM-dd');
  const ended = ['declined', 'expired', 'cancelled_by_guest', 'cancelled_by_owner'];
  const groups = {
    upcoming: bookings.filter((b) => !ended.includes(b.status) && b.check_out >= today).reverse(),
    past: bookings.filter((b) => !ended.includes(b.status) && b.check_out < today),
    cancelled: bookings.filter((b) => ended.includes(b.status)),
  };
  const shown = groups[view];
  const emptyText = {
    upcoming: 'No trips coming up.',
    past: 'No past stays yet.',
    cancelled: 'No cancelled bookings.',
  };

  return (
    <div>
      <AccountNav />
      <ViewTabs
        label="Trips"
        current={view}
        onChange={(id) => setSearchParams(id === 'upcoming' ? {} : { view: id })}
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { id: 'past', label: 'Past', count: groups.past.length },
          { id: 'cancelled', label: 'Cancelled' },
        ]}
      />
      <div className="mx-4 grid gap-4">
        {shown.length > 0 ? (
          shown.map((booking) => (
            <Link
              to={`/account/bookings/${booking.id}`}
              className="group flex flex-col gap-4 overflow-hidden rounded-2xl border border-ink/20 p-3 transition-colors hover:bg-paper sm:flex-row sm:gap-5"
              key={booking.id}
            >
              <div className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-ink/10 sm:h-36 sm:w-52">
                {booking.listing.photos[0] && (
                  <PlaceImg place={booking.listing} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex grow flex-col justify-between gap-3 px-1 pb-1 sm:py-1 sm:pr-2">
                <div>
                  <span className="text-sm font-medium text-ink/60">
                    {bookingStatusLabel(booking.status)}
                  </span>
                  <h2 className="mt-1 text-2xl font-bold leading-tight tracking-tight">{booking.listing.title}</h2>
                  <BookingDates booking={booking} className="mt-2 text-sm text-ink/70" />
                </div>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                  <span>
                    Total <strong className="font-semibold">{formatPrice(booking.total_cents, booking.currency)}</strong>
                  </span>
                  {booking.reviewable && <span className="font-semibold underline underline-offset-4">Write a review</span>}
                </span>
              </div>
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-ink/20 p-8 md:p-12">
            <h2 className="text-2xl font-bold tracking-tight">{emptyText[view]}</h2>
            <p className="mt-3 max-w-md text-sm text-ink/70">
              Pick a home and your dates. Your bookings will show up here.
            </p>
            <Link to="/homes" className={cn(buttonVariants(), 'mt-6')}>
              Browse homes
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;
