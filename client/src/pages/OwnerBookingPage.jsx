import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { CalendarClock, ChevronLeft, Mail, MessageSquare, Phone, Users } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { useAuth } from '../../hooks';
import AddressLink from '@/components/ui/AddressLink';
import BookingDates from '@/components/ui/BookingDates';
import PriceBreakdown from '@/components/ui/PriceBreakdown';
import Spinner from '@/components/ui/Spinner';
import { Button, buttonVariants } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { bookingStatusLabel, channelName } from '@/utils/bookingStatus';
import RescheduleDialog from '@/components/ui/RescheduleDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';

const when = (iso) => format(parseISO(iso), 'd MMM yyyy, HH:mm');

const PAYMENT_STATUS = {
  succeeded: 'Paid',
  pending: 'Started, not paid',
  failed: 'Failed',
};

const OwnerBookingPageContent = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  // 'cancel', 'accept', 'decline', { type: 'refund' | 'mark', payment }
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const [reason, setReason] = useState('');
  const [rescheduling, setRescheduling] = useState(false);
  const [messaging, setMessaging] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

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
    setReason('');
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

  const cancelBooking = () => run(() => api.post(`/admin/bookings/${id}/cancel`, { reason }), 'Booking cancelled. The guest has been told.');
  const accept = () => run(() => api.post(`/admin/bookings/${id}/accept`), 'Request accepted. The guest has been told.');
  const decline = () => run(() => api.post(`/admin/bookings/${id}/decline`, { reason }), 'Request declined. The refund is due.');
  const markRefunded = (payment) =>
    run(() => api.post(`/admin/bookings/${id}/mark_refunded`, { payment_id: payment.id }), 'Refund recorded.');
  const refundThroughPaystack = (payment) =>
    run(() => api.post(`/admin/bookings/${id}/refund`, { payment_id: payment.id }), 'Refund sent through Paystack.');

  const startConversation = async (e) => {
    e.preventDefault();
    setBusy(true);
    setActionError('');
    try {
      const { data } = await api.post('/admin/conversations', { booking_id: id, body: message });
      navigate(`/account/inbox/${data.conversation.id}`);
    } catch (error) {
      setActionError(errorMessageFrom(error));
    } finally {
      setBusy(false);
    }
  };

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
            <p className="font-bold tracking-tight text-2xl">We couldn't load that booking.</p>
            <p className="mt-1 text-sm text-ink/70">{loadError}</p>
          </div>
        ) : (
          <>
            {booking.status === 'requested' && (
              <section className="mt-2 mb-6 rounded-2xl border border-ink/25 bg-paper p-5 md:max-w-3xl">
                <h3 className="font-bold tracking-tight text-2xl">{booking.guest.name} asks to stay</h3>
                <p className="mt-1 text-sm text-ink/75">
                  They've paid and the dates are held. Answer by {when(booking.requested_until)}, or the request is
                  declined and they're refunded.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => openConfirm('accept')}>Accept</Button>
                  <Button variant="danger-outline" onClick={() => openConfirm('decline')}>
                    Decline
                  </Button>
                </div>
              </section>
            )}

            {refundsDue.map((payment) => (
              <section key={payment.id} className="mt-2 mb-6 rounded-2xl border border-red-700/30 bg-red-50 p-5 text-red-950 md:max-w-3xl">
                <h3 className="font-bold tracking-tight text-2xl">
                  Refund due: {formatPrice(payment.refund_cents ?? payment.amount_cents, payment.currency)}
                </h3>
                <p className="mt-1 text-sm">
                  {['cancelled_by_owner', 'cancelled_by_guest', 'declined'].includes(booking.status)
                    ? 'The guest paid, and this booking was cancelled or declined.'
                    : booking.status === 'confirmed'
                      ? 'The stay was shortened, so part of the payment goes back.'
                      : 'Paystack took this payment, but it could not confirm the stay (the hold had ended and the dates were taken, or the amount was wrong).'}{' '}
                  Send it through Paystack from here, back to the M-Pesa number or card the guest paid with.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button onClick={() => openConfirm({ type: 'refund', payment })}>
                    Refund {formatPrice(payment.refund_cents ?? payment.amount_cents, payment.currency)} through Paystack
                  </Button>
                  <Button variant="outline" onClick={() => openConfirm({ type: 'mark', payment })}>
                    I refunded it in Paystack
                  </Button>
                </div>
              </section>
            ))}

            <div className="mt-2 grid gap-6 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
              <div>
                <p className="inline-flex rounded-full border border-ink/20 px-3 py-1 text-sm">
                  {bookingStatusLabel(booking.status, { owner: true })}
                </p>
                <h2 className="mt-2 text-3xl font-bold leading-tight tracking-tight">
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
                {booking.cancel_reason && <p className="mt-3 text-sm text-ink/70">Reason: {booking.cancel_reason}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  {booking.conversation_id ? (
                    <Link to={`/account/inbox/${booking.conversation_id}`} className={buttonVariants({ variant: 'outline' })}>
                      <MessageSquare aria-hidden className="size-4" />
                      Messages with the guest
                    </Link>
                  ) : (
                    <Button variant="outline" onClick={() => { setActionError(''); setMessaging(true); }}>
                      <MessageSquare aria-hidden className="size-4" />
                      Message the guest
                    </Button>
                  )}
                  {booking.can_reschedule && (
                    <Button variant="outline" onClick={() => setRescheduling(true)}>
                      <CalendarClock aria-hidden className="size-4" />
                      Change dates
                    </Button>
                  )}
                </div>
              </div>

              <div className="md:col-start-2 md:row-span-2 md:row-start-1">
                <PriceBreakdown booking={booking} />
              </div>

              <div className="md:col-start-1">
                <section className="border-t border-ink/15 pt-6 md:mt-2">
                  <h3 className="font-bold tracking-tight text-2xl">Guest</h3>
                  <Link to={`/account/guests/${booking.guest.id}`} className="mt-2 inline-block font-medium underline decoration-ink/30 underline-offset-4">
                    {booking.guest.name}
                  </Link>
                  {booking.guest.phone && (
                    <a
                      href={`tel:${booking.guest.phone.replace(/[^+\d]/g, '')}`}
                      className="mt-1 flex min-h-11 items-center gap-2 text-sm underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
                    >
                      <Phone aria-hidden strokeWidth={1.5} className="size-4" />
                      {booking.guest.phone}
                    </a>
                  )}
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
                  <h3 className="font-bold tracking-tight text-2xl">Payments</h3>
                  {booking.payments.length === 0 ? (
                    <p className="mt-2 text-sm text-ink/70">
                      The guest has not paid yet.
                    </p>
                  ) : (
                    <ul className="mt-3 grid gap-3">
                      {booking.payments.map((payment) => (
                        <li key={payment.id} className="tabular grid gap-1 rounded-2xl border border-ink/15 p-4 text-sm sm:grid-cols-[1fr_auto]">
                          <span>
                            <span className="font-semibold">{PAYMENT_STATUS[payment.status] ?? payment.status}</span>
                            {payment.status === 'succeeded' && ` by ${channelName(payment.channel)}`}
                            {payment.paid_at && <span className="text-ink/60">, {when(payment.paid_at)}</span>}
                            <span className="block text-xs text-ink/55">{payment.reference}</span>
                            {payment.refunded_at && <span className="block text-ink/70">Refunded {when(payment.refunded_at)}</span>}
                            {payment.refund_due && (
                              <span className="block font-semibold text-red-800">
                                Refund due: {formatPrice(payment.refund_cents ?? payment.amount_cents, payment.currency)}
                              </span>
                            )}
                          </span>
                          <span className="sm:text-right">{formatPrice(payment.amount_cents, payment.currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {['confirmed', 'requested', 'pending_payment'].includes(booking.status) && (
                <section className="mt-8 border-t border-ink/15 pt-6">
                  <h3 className="font-bold tracking-tight text-2xl">
                    {booking.status === 'confirmed' ? 'Check-in details the guest can see' : 'Check-in details the guest gets once confirmed'}
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm text-ink/80">
                    {booking.private_details?.check_in_instructions || 'No check-in instructions yet.'}
                  </p>
                  {booking.private_details?.wifi_details && (
                    <p className="mt-2 whitespace-pre-line text-sm text-ink/80">Wifi: {booking.private_details.wifi_details}</p>
                  )}
                  <Link to={`/account/places/${booking.listing.id}`} className="mt-2 inline-block text-sm font-medium underline underline-offset-4">
                    Edit in the home's settings
                  </Link>
                </section>
                )}

                {booking.can_cancel && (
                  <section className="mt-8 border-t border-ink/15 pt-6">
                    <h3 className="font-bold tracking-tight text-2xl">Cancel this booking</h3>
                    <p className="mt-1 max-w-prose text-sm text-ink/70">
                      The dates open up for other guests straight away and the guest is told by email.
                      {paidTotal > 0 && ' The guest gets all their money back.'}
                    </p>
                    <Button variant="danger-outline" className="mt-4" onClick={() => openConfirm('cancel')}>
                      Cancel booking
                    </Button>
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
              error={actionError}
              tone="danger"
              onConfirm={cancelBooking}
            >
              <p>
                {booking.listing.title} for {booking.guest.name}, <BookingDates booking={booking} className="inline-flex" />
              </p>
              {paidTotal > 0 && (
                <p>
                  {formatPrice(paidTotal, booking.currency)} was paid. It will be due back to the guest in full; you can
                  send it through Paystack from this page.
                </p>
              )}
              <ReasonField value={reason} onChange={setReason} label="Reason, shown to the guest (optional)" />
              <p>You can't undo this.</p>
            </ConfirmDialog>

            <ConfirmDialog
              open={confirm === 'accept'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Accept this request?"
              confirmLabel="Accept"
              busyLabel="Accepting..."
              busy={busy}
              error={actionError}
              onConfirm={accept}
            >
              <p>The stay is confirmed and {booking.guest.name} gets their confirmation and receipt by email.</p>
            </ConfirmDialog>

            <ConfirmDialog
              open={confirm === 'decline'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Decline this request?"
              confirmLabel="Decline"
              busyLabel="Declining..."
              busy={busy}
              error={actionError}
              tone="danger"
              onConfirm={decline}
            >
              <p>The dates open up again and the guest's payment is due back to them in full.</p>
              <ReasonField value={reason} onChange={setReason} label="Reason, shown to the guest (optional)" />
            </ConfirmDialog>

            <ConfirmDialog
              open={confirm?.type === 'refund'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Send this refund?"
              confirmLabel="Send refund"
              busyLabel="Sending..."
              busy={busy}
              error={actionError}
              onConfirm={() => refundThroughPaystack(confirm.payment)}
            >
              <p>
                Paystack sends {confirm?.payment && formatPrice(confirm.payment.refund_cents ?? confirm.payment.amount_cents, confirm.payment.currency)}{' '}
                back to the M-Pesa number or card the guest paid with. It comes out of your Paystack balance and usually
                arrives within a few days. You can't undo it.
              </p>
            </ConfirmDialog>

            <RescheduleDialog
              booking={booking}
              path={`/admin/bookings/${booking.id}/reschedule`}
              byOwner
              open={rescheduling}
              onOpenChange={setRescheduling}
              onDone={(updated) => {
                setBooking(updated);
                toast.success('New dates saved. The guest has been told.');
              }}
            />

            <Dialog open={messaging} onOpenChange={(next) => !busy && setMessaging(next)}>
              <DialogContent className="max-w-md">
                <form onSubmit={startConversation} className="grid gap-4">
                  <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">Message {booking.guest.name}</DialogTitle>
                  <DialogDescription className="text-sm text-ink/70">They get it by email and in their account.</DialogDescription>
                  <textarea
                    aria-label="Message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
                  />
                  {actionError && (
                    <p role="alert" className="text-sm font-semibold text-red-800">
                      {actionError}
                    </p>
                  )}
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setMessaging(false)} disabled={busy}>
                      Close
                    </Button>
                    <Button type="submit" disabled={busy || !message.trim()}>
                      {busy ? 'Sending...' : 'Send message'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <ConfirmDialog
              open={confirm?.type === 'mark'}
              onOpenChange={(open) => !open && setConfirm(null)}
              title="Record this refund?"
              confirmLabel="Mark as refunded"
              busyLabel="Saving..."
              busy={busy}
              error={actionError}
              onConfirm={() => markRefunded(confirm.payment)}
            >
              <p>
                Only do this if you already refunded{' '}
                {confirm?.payment && formatPrice(confirm.payment.refund_cents ?? confirm.payment.amount_cents, confirm.payment.currency)}{' '}
                in your Paystack dashboard (search Transactions for {confirm?.payment?.reference}). The guest is told it's on its way.
              </p>
            </ConfirmDialog>
          </>
        )}
      </div>
    </div>
  );
};

const ReasonField = ({ value, onChange, label }) => (
  <label className="mt-1 grid gap-1.5">
    <span className="font-medium text-ink">{label}</span>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={300}
      rows={2}
      className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
    />
  </label>
);

// Owner only: guests are sent to their own account.
const OwnerBookingPage = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/account" replace />;
  return <OwnerBookingPageContent />;
};

export default OwnerBookingPage;
