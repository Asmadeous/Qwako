import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ChevronLeft, Mail, Users } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { useAuth } from '../../hooks';
import AddressLink from '@/components/ui/AddressLink';
import BookingDates from '@/components/ui/BookingDates';
import PriceBreakdown from '@/components/ui/PriceBreakdown';
import Spinner from '@/components/ui/Spinner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { bookingStatusLabel, channelName } from '@/utils/bookingStatus';

const when = (iso) => format(parseISO(iso), 'd MMM yyyy, HH:mm');

const PAYMENT_STATUS = {
  succeeded: 'Paid',
  pending: 'Started, not paid',
  failed: 'Failed',
};

const primary =
  'inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90 disabled:opacity-60';
const secondary =
  'inline-flex h-11 items-center justify-center rounded-full border border-ink/25 px-6 text-sm transition-colors hover:border-ink/60';
const danger =
  'inline-flex h-11 items-center justify-center rounded-full bg-red-800 px-6 text-sm font-medium text-white transition-colors hover:bg-red-900 disabled:opacity-60';

// Asks before an action the owner can't undo.
const ConfirmDialog = ({ open, onOpenChange, title, children, confirmLabel, busyLabel, busy, onConfirm, tone = 'primary' }) => (
  <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
    <DialogContent className="max-w-md rounded-2xl border-ink/15 bg-paper text-ink">
      <DialogTitle className="font-serif text-3xl font-normal leading-tight">{title}</DialogTitle>
      <DialogDescription asChild>
        <div className="grid gap-2 text-sm text-ink/75">{children}</div>
      </DialogDescription>
      <DialogFooter className="mt-2 gap-2">
        <button type="button" className={secondary} onClick={() => onOpenChange(false)} disabled={busy}>
          Go back
        </button>
        <button type="button" className={tone === 'danger' ? danger : primary} onClick={onConfirm} disabled={busy} aria-busy={busy}>
          {busy ? busyLabel : confirmLabel}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const OwnerBookingPageContent = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [confirm, setConfirm] = useState(null); // 'cancel' or a payment awaiting "refunded"
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    api
      .get(`/admin/bookings/${id}`)
      .then(({ data }) => current && setBooking(data.booking))
      .catch((error) => current && setLoadError(errorMessageFrom(error)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [id]);

  const openConfirm = (value) => {
    setActionError('');
    setConfirm(value);
  };

  const run = async (request, message) => {
    setBusy(true);
    setActionError('');
    try {
      const { data } = await request();
      setBooking(data.booking);
      setConfirm(null);
      toast.success(message);
    } catch (error) {
      setActionError(errorMessageFrom(error));
    } finally {
      setBusy(false);
    }
  };

  const cancelBooking = () => run(() => api.post(`/admin/bookings/${id}/cancel`), 'Booking cancelled.');
  const markRefunded = (payment) =>
    run(() => api.post(`/admin/bookings/${id}/mark_refunded`, { payment_id: payment.id }), 'Refund recorded.');

  if (loading) return <Spinner label="Loading booking" />;

  const paid = booking?.payments.filter((p) => p.status === 'succeeded' && !p.refunded_at) ?? [];
  const paidTotal = paid.reduce((sum, p) => sum + p.amount_cents, 0);
  const refundsDue = booking?.payments.filter((p) => p.refund_due) ?? [];

  return (
    <div>
      <AccountNav />
      <div className="mx-4 pb-24">
        <Link
          to="/account/reservations"
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 transition-colors hover:text-ink"
        >
          <ChevronLeft aria-hidden className="size-4" />
          All bookings
        </Link>

        {!booking ? (
          <div role="alert" className="mt-4 rounded-2xl border border-ink/15 bg-paper p-6">
            <p className="font-serif text-2xl">We couldn't load that booking.</p>
            <p className="mt-1 text-sm text-ink/70">{loadError}</p>
          </div>
        ) : (
          <>
            {refundsDue.map((payment) => (
              <section key={payment.id} className="mt-2 mb-6 rounded-2xl border border-red-700/30 bg-red-50 p-5 text-red-950 md:max-w-3xl">
                <h3 className="font-serif text-2xl">Refund due: {formatPrice(payment.amount_cents, payment.currency)}</h3>
                <p className="mt-1 text-sm">
                  {booking.status === 'cancelled_by_owner' || booking.status === 'cancelled_by_guest'
                    ? 'The guest paid, but this booking is cancelled.'
                    : 'Paystack took this payment, but it could not confirm the stay (the hold had ended and the dates were taken, or the amount was wrong).'}{' '}
                  Refund it in your Paystack dashboard: open Transactions and search for{' '}
                  <span className="tabular rounded bg-white/70 px-1.5 py-0.5 font-mono text-xs">{payment.reference}</span>. Then
                  record it here.
                </p>
                <button type="button" className={`${primary} mt-4`} onClick={() => openConfirm(payment)}>
                  Mark as refunded
                </button>
              </section>
            ))}

            <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
              <div>
                <p className="inline-flex rounded-full border border-ink/20 px-3 py-1 text-sm">
                  {bookingStatusLabel(booking.status, { owner: true })}
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

              <div className="md:col-start-2 md:row-span-2 md:row-start-1">
                <PriceBreakdown booking={booking} />
              </div>

              <div className="md:col-start-1">
                <section className="border-t border-ink/15 pt-6 md:mt-2">
                  <h3 className="font-serif text-2xl">Guest</h3>
                  <p className="mt-2">{booking.guest.name}</p>
                  <a
                    href={`mailto:${booking.guest.email}`}
                    className="mt-1 inline-flex min-h-11 items-center gap-2 text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                  >
                    <Mail aria-hidden strokeWidth={1.5} className="size-4" />
                    {booking.guest.email}
                  </a>
                  <p className="text-sm text-ink/55">Booked {when(booking.created_at)}</p>
                </section>

                <section className="mt-8 border-t border-ink/15 pt-6">
                  <h3 className="font-serif text-2xl">Payments</h3>
                  {booking.payments.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/70">
                      {booking.pay_online ? 'The guest has not started paying.' : 'This stay is not paid online.'}
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-3">
                      {booking.payments.map((payment) => (
                        <li key={payment.id} className="tabular grid gap-1 rounded-2xl border border-ink/15 p-4 text-sm sm:grid-cols-[1fr_auto]">
                          <span>
                            <span className="font-semibold">{PAYMENT_STATUS[payment.status] ?? payment.status}</span>
                            {payment.status === 'succeeded' && ` by ${channelName(payment.channel)}`}
                            {payment.paid_at && <span className="text-ink/60">, {when(payment.paid_at)}</span>}
                            <span className="block font-mono text-xs text-ink/55">{payment.reference}</span>
                            {payment.refunded_at && <span className="block text-ink/70">Refunded {when(payment.refunded_at)}</span>}
                            {payment.refund_due && <span className="block font-semibold text-red-800">Refund due</span>}
                          </span>
                          <span className="sm:text-right">{formatPrice(payment.amount_cents, payment.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {booking.can_cancel && (
                  <section className="mt-8 border-t border-ink/15 pt-6">
                    <h3 className="font-serif text-2xl">Cancel this booking</h3>
                    <p className="mt-1 max-w-prose text-sm text-ink/70">
                      The dates open up for other guests straight away.
                      {paidTotal > 0 && ' The guest has paid, so the booking will be marked as needing a refund.'}
                    </p>
                    <button type="button" className={`${secondary} mt-4 border-red-800/40 text-red-800 hover:border-red-800`} onClick={() => openConfirm('cancel')}>
                      Cancel booking
                    </button>
                  </section>
                )}
              </div>
            </div>

            <ConfirmDialog
              open={confirm === 'cancel'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Cancel this booking?"
              confirmLabel="Cancel booking"
              busyLabel="Cancelling..."
              busy={busy}
              tone="danger"
              onConfirm={cancelBooking}
            >
              <p>
                {booking.listing.title} for {booking.guest.name}, <BookingDates booking={booking} className="inline-flex" />
              </p>
              {paidTotal > 0 && (
                <p>
                  {formatPrice(paidTotal, booking.currency)} was paid. You'll need to refund it in your Paystack dashboard.
                </p>
              )}
              <p>The guest isn't emailed. Let them know at {booking.guest.email}.</p>
              <p>You can't undo this.</p>
              {actionError && <p role="alert" className="font-semibold text-red-800">{actionError}</p>}
            </ConfirmDialog>

            <ConfirmDialog
              open={Boolean(confirm && confirm !== 'cancel')}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Record this refund?"
              confirmLabel="Mark as refunded"
              busyLabel="Saving..."
              busy={busy}
              onConfirm={() => markRefunded(confirm)}
            >
              <p>
                Only do this once you've refunded{' '}
                {confirm && confirm !== 'cancel' && formatPrice(confirm.amount_cents, confirm.currency)} in your Paystack
                dashboard. This site doesn't send the money back itself.
              </p>
              {actionError && <p role="alert" className="font-semibold text-red-800">{actionError}</p>}
            </ConfirmDialog>
          </>
        )}
      </div>
    </div>
  );
};

// Owner only: guests are sent to their own account.
const OwnerBookingPage = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/account" replace />;
  return <OwnerBookingPageContent />;
};

export default OwnerBookingPage;
