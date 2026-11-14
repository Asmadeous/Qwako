import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { CalendarClock, ChevronLeft, Clock, MessageSquare, Receipt, Users } from 'lucide-react';

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
import { formatDateTime } from '@/utils/format';
import RescheduleDialog from '@/components/ui/RescheduleDialog';
import StartConversationDialog from '@/components/ui/StartConversationDialog';
import { StarInput, Stars } from '@/components/ui/StarRating';

const SingleBookedPlace = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const navigate = useNavigate();
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
      const { data } = await api.post(`/bookings/${id}/cancel`, { reason: cancelReason });
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

  const details = booking?.private_details;
  const listing = booking?.listing;

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
                <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight">
                  <Link to={`/place/${listing.id}`} className="hover:underline hover:decoration-ink/30 hover:underline-offset-4">
                    {listing.title}
                  </Link>
                </h2>
                <AddressLink className="mt-2 text-sm" placeAddress={listing.address} />
                <div className="mt-5 grid gap-2 text-ink/85">
                  <BookingDates booking={booking} />
                  <p className="flex items-center gap-2">
                    <Users aria-hidden strokeWidth={1.5} className="size-4" />
                    {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock aria-hidden strokeWidth={1.5} className="size-4" />
                    Check-in from {listing.check_in_time}, check-out by {listing.check_out_time}
                  </p>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {booking.paid_cents > 0 && (
                    <Link to={`/account/bookings/${booking.id}/receipt`} className={buttonVariants({ variant: 'outline' })}>
                      <Receipt aria-hidden className="size-4" />
                      Receipt
                    </Link>
                  )}
                  {booking.conversation_id ? (
                    <Link to={`/account/messages/${booking.conversation_id}`} className={buttonVariants({ variant: 'outline' })}>
                      <MessageSquare aria-hidden className="size-4" />
                      Messages with the owner
                    </Link>
                  ) : (
                    <Button variant="outline" onClick={() => setMessaging(true)}>
                      <MessageSquare aria-hidden className="size-4" />
                      Message the owner
                    </Button>
                  )}
                  {booking.guest_can_reschedule && (
                    <Button variant="outline" onClick={() => setRescheduling(true)}>
                      <CalendarClock aria-hidden className="size-4" />
                      Change dates
                    </Button>
                  )}
                </div>
              </div>

              <PriceBreakdown booking={booking} />
            </div>

            <StatusSteps booking={booking} />

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

            {booking.status === 'requested' && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">Waiting for the owner</h3>
                <p className="mt-1 text-sm text-ink/70">
                  You've paid and the dates are held for you. The owner replies by{' '}
                  {formatDateTime(booking.requested_until)}. If they decline or don't reply, you get all your money back.
                </p>
              </section>
            )}

            {booking.status === 'expired' && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">The hold on these dates ended</h3>
                <p className="mt-1 text-sm text-ink/70">
                  Payment didn't arrive within 15 minutes, so the dates were released. If you were charged, the owner
                  will confirm or refund it.
                </p>
                <Link to={bookAgainLink(booking)} className={cn(buttonVariants(), 'mt-4')}>
                  Book again
                </Link>
              </section>
            )}

            {['cancelled_by_guest', 'cancelled_by_owner', 'declined'].includes(booking.status) && (
              <section className="mt-6 rounded-2xl border border-ink/15 bg-paper p-5 md:max-w-xl">
                <h3 className="font-bold tracking-tight text-2xl">
                  {booking.status === 'declined' ? 'The owner declined this request' : 'This booking was cancelled'}
                </h3>
                {booking.cancel_reason && <p className="mt-1 text-sm text-ink/70">Reason: {booking.cancel_reason}</p>}
                <p className="mt-1 text-sm text-ink/70">
                  {booking.refund_cents > 0
                    ? booking.refunded_cents >= booking.refund_cents
                      ? `${formatPrice(booking.refunded_cents, booking.currency)} has been refunded to the M-Pesa number or card you paid with.`
                      : `${formatPrice(booking.refund_cents, booking.currency)} is being refunded to the M-Pesa number or card you paid with.`
                    : booking.paid_cents > 0
                      ? 'Under the cancellation policy no refund was due.'
                      : 'Nothing was paid.'}
                </p>
                <Link to={bookAgainLink(booking)} className={cn(buttonVariants({ variant: 'outline' }), 'mt-4')}>
                  Book again
                </Link>
              </section>
            )}

            {details && (
              <section className="mt-10 grid gap-6 border-t border-ink/15 pt-6 md:grid-cols-2">
                <div>
                  <h3 className="font-bold tracking-tight text-2xl">Getting in</h3>
                  <p className="mt-2 whitespace-pre-line text-ink/85">
                    {details.check_in_instructions || 'The owner will message you check-in details before you arrive.'}
                  </p>
                </div>
                {details.wifi_details && (
                  <div>
                    <h3 className="font-bold tracking-tight text-2xl">Wifi</h3>
                    <p className="mt-2 whitespace-pre-line text-ink/85">{details.wifi_details}</p>
                  </div>
                )}
              </section>
            )}

            {booking.reviewable && <ReviewForm booking={booking} onDone={setBooking} />}
            {booking.review && (
              <section className="mt-10 border-t border-ink/15 pt-6">
                <h3 className="font-bold tracking-tight text-2xl">Your review</h3>
                <Stars value={booking.review.rating} className="mt-2" />
                {booking.review.comment && <p className="mt-2 max-w-prose text-ink/85">{booking.review.comment}</p>}
                {booking.review.owner_reply && (
                  <p className="mt-3 max-w-prose border-l-2 border-ink/20 pl-3 text-sm text-ink/75">
                    Owner's reply: {booking.review.owner_reply}
                  </p>
                )}
              </section>
            )}

            <div className="mt-10">
              <PlaceGallery place={listing} />
            </div>

            {booking.guest_can_cancel && (
              <section className="mt-10 border-t border-ink/15 pt-6">
                <h3 className="font-bold tracking-tight text-2xl">Cancel this booking</h3>
                <p className="mt-1 max-w-prose text-sm text-ink/70">
                  {listing.cancellation_policy_text} The dates are released straight away.
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
                {listing.title}, <BookingDates booking={booking} className="inline-flex" />
              </p>
              {booking.paid_cents > 0 && (
                <p className="font-semibold text-ink">
                  {booking.cancel_refund_cents > 0
                    ? `You get ${formatPrice(booking.cancel_refund_cents, booking.currency)} back, to the M-Pesa number or card you paid with.`
                    : 'Under the cancellation policy, no refund is due if you cancel now.'}
                </p>
              )}
              <label className="mt-1 grid gap-1.5">
                <span className="font-medium text-ink">Reason (optional)</span>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  maxLength={300}
                  rows={2}
                  className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
                />
              </label>
              <p>You can't undo this.</p>
            </ConfirmDialog>

            <RescheduleDialog
              booking={booking}
              path={`/bookings/${booking.id}/reschedule`}
              open={rescheduling}
              onOpenChange={setRescheduling}
              onDone={(updated) => {
                setBooking(updated);
                toast.success('Your stay has new dates.');
              }}
            />

            <StartConversationDialog
              open={messaging}
              onOpenChange={setMessaging}
              params={{ booking_id: booking.id }}
              title="Message the owner"
              onSent={(conversationId) => navigate(`/account/messages/${conversationId}`)}
            />
          </>
        ) : (
          <div className="mt-4 rounded-2xl border border-ink/15 px-6 py-14">
            <h2 className="text-2xl font-bold tracking-tight">We couldn't find that booking.</h2>
            <p className="mt-2 text-ink/70">It may belong to another account. Your bookings are listed on the bookings tab.</p>
            <Link to="/account/bookings" className={cn(buttonVariants(), 'mt-6')}>
              View your bookings
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const bookAgainLink = (booking) => `/place/${booking.listing.id}?${new URLSearchParams({ guests: String(booking.guests_count) })}`;

// Booked, paid, confirmed, stay: where this booking is now.
const StatusSteps = ({ booking }) => {
  const ended = ['declined', 'expired', 'cancelled_by_guest', 'cancelled_by_owner'].includes(booking.status);
  if (ended) return null;
  const today = format(new Date(), 'yyyy-MM-dd');
  const paid = booking.paid_cents > 0;
  const confirmed = booking.status === 'confirmed';
  const steps = [
    { label: 'Booked', done: true },
    { label: 'Paid', done: paid },
    { label: booking.listing.booking_type === 'request' ? 'Accepted' : 'Confirmed', done: confirmed },
    { label: 'Check-in', done: confirmed && booking.check_in <= today },
    { label: 'Check-out', done: confirmed && booking.check_out <= today },
  ];
  return (
    <ol aria-label="Booking progress" className="mt-8 grid grid-cols-5 gap-1 md:max-w-xl">
      {steps.map((step) => (
        <li key={step.label} className="grid gap-1.5 text-xs font-medium">
          <span className={cn('h-1.5 rounded-full', step.done ? 'bg-ink' : 'bg-ink/15')} />
          <span className={step.done ? 'text-ink' : 'text-ink/50'}>
            {step.label}
            <span className="sr-only">{step.done ? ', done' : ', not yet'}</span>
          </span>
        </li>
      ))}
    </ol>
  );
};

const ReviewForm = ({ booking, onDone }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Choose a rating from 1 to 5 stars.');
    setBusy(true);
    setError('');
    try {
      await api.post(`/bookings/${booking.id}/review`, { rating, comment });
      const { data } = await api.get(`/bookings/${booking.id}`);
      onDone(data.booking);
      toast.success('Thanks for your review.');
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-10 border-t border-ink/15 pt-6 md:max-w-xl">
      <h3 className="font-bold tracking-tight text-2xl">How was your stay?</h3>
      <p className="mt-1 text-sm text-ink/70">Your first name, rating and words appear on the home's page.</p>
      <div className="mt-3">
        <StarInput value={rating} onChange={setRating} />
      </div>
      <label className="mt-3 grid gap-1.5">
        <span className="text-sm font-medium">What should other guests know? (optional)</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          rows={4}
          className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-800">
          {error}
        </p>
      )}
      <Button type="submit" className="mt-4" disabled={busy} aria-busy={busy}>
        {busy ? 'Posting...' : 'Post review'}
      </Button>
    </form>
  );
};

export default SingleBookedPlace;
