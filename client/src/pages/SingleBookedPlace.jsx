import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ChevronLeft, Users } from 'lucide-react';

import AccountNav from '../components/ui/AccountNav';
import AddressLink from '../components/ui/AddressLink';
import BookingDates from '../components/ui/BookingDates';
import PlaceGallery from '../components/ui/PlaceGallery';
import PriceBreakdown from '../components/ui/PriceBreakdown';
import Spinner from '../components/ui/Spinner';
import { Button, buttonVariants } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { formatPrice } from '@/utils/currency';
import { cn } from '@/lib/utils';
import { api, errorMessageFrom } from '../utils/axios';
import { bookingStatusLabel } from '@/utils/bookingStatus';

const SingleBookedPlace = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [searchParams] = useSearchParams();
  const returnedFromPaystack = searchParams.has('reference');
  const timer = useRef(null);
  const active = useRef(true);

  // Ask the server (which asks Paystack) whether a held booking has been paid.
  // After returning from Paystack, M-Pesa can take a few seconds, so retry briefly.
  const checkPayment = async (attempt = 0) => {
    if (!active.current) return;
    setChecking(true);
    try {
      const { data } = await api.post(`/bookings/${id}/payment/verify`);
      if (!active.current) return;
      setBooking(data.booking);
      if (data.booking.status === 'confirmed') {
        toast.success('Payment received. Your stay is confirmed.', { toastId: 'paid' });
      } else if (data.booking.status === 'pending_payment' && returnedFromPaystack && attempt < 6) {
        timer.current = setTimeout(() => checkPayment(attempt + 1), 4000);
        return;
      }
    } catch (error) {
      if (!active.current) return;
      toast.error(errorMessageFrom(error), { toastId: 'verify' });
    }
    setChecking(false);
  };

  useEffect(() => {
    active.current = true;
    setLoading(true);
    api
      .get(`/bookings/${id}`)
      .then(({ data }) => {
        setBooking(data.booking);
        if (data.booking.status === 'pending_payment') checkPayment();
      })
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
    return () => {
      // Stop payment checks once the guest leaves this booking.
      active.current = false;
      clearTimeout(timer.current);
    };
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

  const cancelBooking = async () => {
    setCancelling(true);
    setCancelError('');
    try {
      const { data } = await api.post(`/bookings/${id}/cancel`);
      active.current = false;
      clearTimeout(timer.current);
      setBooking(data.booking);
      setConfirmCancel(false);
      toast.success('Booking cancelled.');
    } catch (error) {
      setCancelError(errorMessageFrom(error));
    } finally {
      setCancelling(false);
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
                  {bookingStatusLabel(booking.status)}
                </p>
                <h2 className="mt-3 font-bold tracking-tight text-4xl leading-tight md:text-5xl">
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

              <PriceBreakdown booking={booking} />
            </div>


            {booking.status === 'pending_payment' && (
              <section aria-live="polite" className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">
                  {checking ? 'Checking your payment...' : 'Waiting for your payment'}
                </h3>
                <p className="mt-1 text-sm text-ink/70">
                  Your dates are held until{' '}
                  <span className="tabular">{format(parseISO(booking.hold_expires_at), 'HH:mm')}</span>. Pay by M-Pesa or card
                  on Paystack to confirm the stay.
                </p>
                <Button className="mt-4" onClick={payNow} disabled={paying || checking}>
                  {paying ? 'Opening payment...' : 'Pay now'}
                </Button>
              </section>
            )}

            {booking.status === 'expired' && booking.pay_online && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">The hold on these dates ended</h3>
                <p className="mt-1 text-sm text-ink/70">
                  Payment didn't arrive within 15 minutes, so the dates were released. If you were charged, the owner
                  will confirm or refund it.
                </p>
                <Link
                  to={`/place/${booking.listing.id}?${new URLSearchParams({
                    check_in: booking.check_in,
                    check_out: booking.check_out,
                    guests: String(booking.guests_count),
                  })}`}
                  className={cn(buttonVariants(), 'mt-4')}
                >
                  Book again
                </Link>
              </section>
            )}

            {booking.status === 'cancelled_by_guest' && booking.paid_cents > 0 && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">Your refund</h3>
                <p className="mt-1 text-sm text-ink/70">
                  You paid {formatPrice(booking.paid_cents, booking.currency)}. This shows on the owner's bookings as a refund due, and they
                  will refund you through Paystack, to the M-Pesa number or card you paid with.
                </p>
              </section>
            )}

            <div className="mt-10">
              <PlaceGallery place={booking.listing} />
            </div>

            {booking.guest_can_cancel && (
              <section className="mt-10 border-t border-ink/15 pt-6">
                <h3 className="font-bold tracking-tight text-2xl">Cancel this booking</h3>
                <p className="mt-1 max-w-prose text-sm text-ink/70">
                  You can cancel until the day before check-in. The dates are released straight away.
                  {booking.paid_cents > 0 && ' The owner will refund what you paid.'}
                </p>
                <Button
                  variant="danger-outline"
                  className="mt-4"
                  onClick={() => {
                    setCancelError('');
                    setConfirmCancel(true);
                  }}
                >
                  Cancel booking
                </Button>
              </section>
            )}

            <ConfirmDialog
              open={confirmCancel}
              onOpenChange={setConfirmCancel}
              title="Cancel this booking?"
              confirmLabel="Cancel booking"
              busyLabel="Cancelling..."
              cancelLabel="Keep booking"
              busy={cancelling}
              error={cancelError}
              tone="danger"
              onConfirm={cancelBooking}
            >
              <p>
                {booking.listing.title}, <BookingDates booking={booking} className="inline-flex" />
              </p>
              {booking.paid_cents > 0 && (
                <p>
                  You paid {formatPrice(booking.paid_cents, booking.currency)}. The owner will refund it to the M-Pesa
                  number or card you paid with.
                </p>
              )}
              <p>You can't undo this. To stay on these dates again you'd need to book again.</p>
            </ConfirmDialog>
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-ink/15 px-6 py-14">
            <h2 className="font-bold tracking-tight text-4xl">We couldn't find that booking.</h2>
            <p className="mt-2 text-ink/70">It may belong to another account. Your bookings are listed on the bookings tab.</p>
            <Link
              to="/account/bookings"
              className={cn(buttonVariants(), 'mt-6')}
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
