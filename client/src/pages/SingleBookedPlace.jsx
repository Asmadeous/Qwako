import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ChevronLeft, Users } from 'lucide-react';

import AccountNav from '../components/ui/AccountNav';
import AddressLink from '../components/ui/AddressLink';
import BookingDates from '../components/ui/BookingDates';
import PlaceGallery from '../components/ui/PlaceGallery';
import Spinner from '../components/ui/Spinner';
import { api, errorMessageFrom } from '../utils/axios';
import { formatPrice } from '@/utils/currency';

const STATUS_LABELS = {
  confirmed: 'Confirmed',
  pending_payment: 'Awaiting payment',
  requested: 'Requested',
  declined: 'Declined',
  expired: 'Expired',
  cancelled_by_guest: 'Cancelled by you',
  cancelled_by_owner: 'Cancelled by the owner',
  completed: 'Completed',
};

const SingleBookedPlace = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [searchParams] = useSearchParams();
  const returnedFromPaystack = searchParams.has('reference');
  const timer = useRef(null);

  // Ask the server (which asks Paystack) whether a held booking has been paid.
  // After returning from Paystack, M-Pesa can take a few seconds, so retry briefly.
  const checkPayment = async (attempt = 0) => {
    setChecking(true);
    try {
      const { data } = await api.post(`/bookings/${id}/payment/verify`);
      setBooking(data.booking);
      if (data.booking.status === 'confirmed') {
        toast.success('Payment received. Your stay is confirmed.', { toastId: 'paid' });
      } else if (data.booking.status === 'pending_payment' && returnedFromPaystack && attempt < 6) {
        timer.current = setTimeout(() => checkPayment(attempt + 1), 4000);
        return;
      }
    } catch (error) {
      toast.error(errorMessageFrom(error), { toastId: 'verify' });
    }
    setChecking(false);
  };

  useEffect(() => {
    setLoading(true);
    api
      .get(`/bookings/${id}`)
      .then(({ data }) => {
        setBooking(data.booking);
        if (data.booking.status === 'pending_payment') checkPayment();
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const payNow = async () => {
    setPaying(true);
    try {
      const { data } = await api.post(`/bookings/${id}/payment`);
      window.location.assign(data.checkout_url);
    } catch (error) {
      toast.error(errorMessageFrom(error));
      setPaying(false);
      const { data } = await api.get(`/bookings/${id}`).catch(() => ({ data: null }));
      if (data) setBooking(data.booking);
    }
  };

  if (loading) return <Spinner label="Loading booking" />;

  return (
    <div>
      <AccountNav />
      <div className="mx-4 pb-24">
        <Link
          to="/account/bookings"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 transition-colors hover:text-ink"
        >
          <ChevronLeft aria-hidden className="size-4" />
          All bookings
        </Link>

        {booking ? (
          <>
            <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
              <div>
                <p className="inline-flex rounded-full border border-ink/20 px-3 py-1 text-sm">
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </p>
                <h2 className="mt-3 font-serif text-4xl leading-tight md:text-5xl">
                  <Link to={`/place/${booking.listing.id}`} className="hover:underline hover:decoration-ink/30 hover:underline-offset-4">
                    {booking.listing.title}
                  </Link>
                </h2>
                <AddressLink className="mt-2 text-sm" placeAddress={booking.listing.address} />
                <div className="mt-5 grid gap-2 text-ink/85">
                  <BookingDates booking={booking} />
                  <p className="flex items-center gap-2">
                    <Users aria-hidden strokeWidth={1.5} className="size-4" />
                    {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
              </div>

              <dl className="tabular rounded-2xl border border-ink/15 bg-paper p-5 text-sm">
                <div className="flex justify-between py-1">
                  <dt className="text-ink/70">
                    {formatPrice(booking.nightly_price_cents, booking.currency)} x {booking.nights}{' '}
                    {booking.nights === 1 ? 'night' : 'nights'}
                  </dt>
                  <dd>{formatPrice(booking.nightly_price_cents * booking.nights, booking.currency)}</dd>
                </div>
                {booking.cleaning_charge_cents > 0 && (
                  <div className="flex justify-between py-1">
                    <dt className="text-ink/70">Cleaning charge</dt>
                    <dd>{formatPrice(booking.cleaning_charge_cents, booking.currency)}</dd>
                  </div>
                )}
                <div className="mt-2 flex items-baseline justify-between border-t border-ink/15 pt-3">
                  <dt className="font-semibold">Total</dt>
                  <dd className="font-serif text-3xl leading-none">{formatPrice(booking.total_cents, booking.currency)}</dd>
                </div>
              </dl>
            </div>


            {booking.status === 'pending_payment' && (
              <section aria-live="polite" className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-serif text-2xl">
                  {checking ? 'Checking your payment...' : 'Waiting for your payment'}
                </h3>
                <p className="mt-1 text-sm text-ink/70">
                  Your dates are held until{' '}
                  <span className="tabular">{format(parseISO(booking.hold_expires_at), 'HH:mm')}</span>. Pay by M-Pesa or card
                  on Paystack to confirm the stay.
                </p>
                <button
                  type="button"
                  onClick={payNow}
                  disabled={paying || checking}
                  className="mt-4 h-11 rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60"
                >
                  {paying ? 'Opening payment...' : 'Pay now'}
                </button>
              </section>
            )}

            {booking.status === 'expired' && booking.pay_online && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-serif text-2xl">The hold on these dates ended</h3>
                <p className="mt-1 text-sm text-ink/70">
                  Payment didn't arrive within 15 minutes, so the dates were released. If you were charged, the owner
                  will confirm or refund it.
                </p>
                <Link
                  to={`/place/${booking.listing.id}`}
                  className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90"
                >
                  Book again
                </Link>
              </section>
            )}

            <div className="mt-10">
              <PlaceGallery place={booking.listing} />
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-ink/15 px-6 py-14">
            <h2 className="font-serif text-4xl">We couldn't find that booking.</h2>
            <p className="mt-2 text-ink/70">It may belong to another account. Your bookings are listed on the bookings tab.</p>
            <Link
              to="/account/bookings"
              className="mt-6 inline-flex h-11 items-center rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90"
            >
              View your bookings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SingleBookedPlace;
