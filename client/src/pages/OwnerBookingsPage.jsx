import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Search } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { bookingStatusLabel, paymentSummary } from '@/utils/bookingStatus';
import { Button } from '@/components/ui/button';

const VIEWS = [
  { id: 'upcoming', label: 'Upcoming', empty: 'No upcoming bookings. New bookings appear here as soon as guests book.' },
  { id: 'refunds', label: 'Refunds due', empty: 'No refunds are due.' },
  { id: 'past', label: 'Past', empty: 'No past stays yet.' },
  { id: 'cancelled', label: 'Cancelled', empty: 'No cancelled or expired bookings.' },
  { id: 'all', label: 'All', empty: 'No bookings yet.' },
];

const TONES = {
  alert: 'font-semibold text-red-800',
  ok: 'text-ink/80',
  muted: 'text-ink/55',
};

const shortDate = (iso) => format(parseISO(iso), 'd MMM');
const dateRange = (booking) => {
  const year = format(parseISO(booking.check_out), 'yyyy');
  return `${shortDate(booking.check_in)} to ${shortDate(booking.check_out)} ${year}`;
};

const BookingRow = ({ booking }) => {
  const payment = paymentSummary(booking);
  const town = booking.listing.address.split(',')[0].trim();

  return (
    <li>
      <Link
        to={`/account/reservations/${booking.id}`}
        className="grid gap-x-6 gap-y-1 rounded-2xl border border-ink/15 p-4 transition-colors hover:border-ink/40 hover:bg-paper md:grid-cols-[10rem_minmax(0,1.3fr)_minmax(0,1fr)_7rem_9rem] md:items-center"
      >
        <span className="tabular text-sm">
          {dateRange(booking)}
          <span className="block text-ink/55">
            {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}, {booking.guests_count}{' '}
            {booking.guests_count === 1 ? 'guest' : 'guests'}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{booking.listing.title}</span>
          <span className="block truncate text-sm text-ink/55">{town}</span>
        </span>
        <span className="min-w-0 text-sm">
          <span className="block truncate">{booking.guest.name}</span>
          <span className="block truncate text-ink/55">{booking.guest.email}</span>
        </span>
        <span className="tabular text-sm md:text-right">{formatPrice(booking.total_cents, booking.currency)}</span>
        <span className="text-sm md:text-right">
          <span className="block">{bookingStatusLabel(booking.status, { owner: true })}</span>
          <span className={`block ${TONES[payment.tone]}`}>{payment.label}</span>
        </span>
      </Link>
    </li>
  );
};

const OwnerBookingsPageContent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = VIEWS.some((v) => v.id === searchParams.get('view')) ? searchParams.get('view') : 'upcoming';
  const q = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(q);
  const [bookings, setBookings] = useState([]);
  const [nextPage, setNextPage] = useState(null);
  const [refundsDue, setRefundsDue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const updateParams = (changes) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)));
    setSearchParams(next, { replace: true });
  };

  // Search after a short pause in typing.
  useEffect(() => {
    if (query.trim() === q) return undefined;
    const timer = setTimeout(() => updateParams({ q: query.trim() }), 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    api
      .get('/admin/bookings', { params: { view, q: q || undefined } })
      .then(({ data }) => {
        if (!current) return;
        setBookings(data.bookings);
        setNextPage(data.next_page);
        setRefundsDue(data.refunds_due);
      })
      .catch((err) => current && setError(errorMessageFrom(err)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [view, q, attempt]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await api.get('/admin/bookings', { params: { view, q: q || undefined, page: nextPage } });
      setBookings((current) => [...current, ...data.bookings]);
      setNextPage(data.next_page);
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setLoadingMore(false);
    }
  };

  const viewInfo = VIEWS.find((v) => v.id === view);

  return (
    <div>
      <AccountNav />
      <div className="mx-4 pb-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Show bookings">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view === v.id}
                onClick={() => updateParams({ view: v.id === 'upcoming' ? '' : v.id })}
                className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors ${
                  view === v.id ? 'border-ink bg-ink text-sand' : 'border-ink/25 text-ink hover:border-ink/60'
                }`}
              >
                {v.label}
                {v.id === 'refunds' && refundsDue > 0 && (
                  <span className="tabular grid min-w-5 place-items-center rounded-full bg-red-700 px-1.5 text-[11px] text-white">
                    {refundsDue}
                  </span>
                )}
              </button>
            ))}
          </div>
          <label className="relative block md:w-80">
            <span className="sr-only">Search by guest or home</span>
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by guest or home"
              className="!my-0 h-11 !rounded-full !pl-10"
            />
          </label>
        </div>

        {refundsDue > 0 && view !== 'refunds' && (
          <p role="status" className="mt-5 rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
            {refundsDue === 1 ? 'One booking has' : `${refundsDue} bookings have`} a refund due.{' '}
            <button type="button" className="font-semibold underline underline-offset-4" onClick={() => updateParams({ view: 'refunds' })}>
              See refunds due
            </button>
          </p>
        )}

        <div className="mt-6 hidden gap-x-6 px-4 pb-2 text-xs text-ink/55 md:grid md:grid-cols-[10rem_minmax(0,1.3fr)_minmax(0,1fr)_7rem_9rem]" aria-hidden>
          <span>Dates</span>
          <span>Home</span>
          <span>Guest</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
        </div>

        {loading ? (
          <ul aria-label="Loading bookings" className="mt-3 grid gap-3 md:mt-0">
            {[0, 1, 2].map((i) => (
              <li key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5 motion-reduce:animate-none" />
            ))}
          </ul>
        ) : error ? (
          <div role="alert" className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5">
            <p>{error}</p>
            <Button className="mt-3" onClick={() => setAttempt((n) => n + 1)}>
              Try again
            </Button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-ink/25 p-8 text-center">
            <p className="text-ink/70">{q ? `No bookings match "${q}".` : viewInfo.empty}</p>
            {q && (
              <button type="button" onClick={() => setQuery('')} className="mt-3 underline underline-offset-4">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="mt-3 grid gap-3 md:mt-0">
              {bookings.map((booking) => (
                <BookingRow key={booking.id} booking={booking} />
              ))}
            </ul>
            {nextPage && (
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                aria-busy={loadingMore}
                className="mx-auto mt-6 flex"
              >
                {loadingMore ? 'Loading...' : 'Show more bookings'}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Owner only: guests are sent to their own account.
const OwnerBookingsPage = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/account" replace />;
  return <OwnerBookingsPageContent />;
};

export default OwnerBookingsPage;
