import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Printer } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { channelName } from '@/utils/bookingStatus';
import { formatPrice } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';

// A printable receipt for a paid booking. "Print" also saves as PDF.
const ReceiptPage = () => {
  const { id } = useParams();
  const { data, error, loading, reload } = useFetch(`/bookings/${id}`);
  const booking = data?.booking;

  if (loading) return <ListSkeleton rows={6} />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const money = (cents) => formatPrice(cents, booking.currency);
  const paid = booking.payments.filter((p) => p.status === 'succeeded');

  return (
    <div className="mx-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          to={`/account/bookings/${booking.id}`}
          className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink"
        >
          <ChevronLeft aria-hidden className="size-4" />
          Back to booking
        </Link>
        <Button onClick={() => window.print()}>
          <Printer aria-hidden className="size-4" />
          Print or save as PDF
        </Button>
      </div>

      <article className="mt-4 max-w-2xl rounded-3xl border border-ink/15 bg-paper p-6 md:p-10 print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/15 pb-6">
          <div>
            <p className="text-lg font-extrabold tracking-tight">T&amp;G BnB</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Receipt</h1>
          </div>
          <dl className="tabular text-right text-sm">
            <dt className="text-ink/60">Booking</dt>
            <dd className="font-mono text-xs">{booking.id.slice(0, 8).toUpperCase()}</dd>
            <dt className="mt-2 text-ink/60">Booked on</dt>
            <dd>{formatDate(booking.created_at)}</dd>
          </dl>
        </header>

        <section className="grid gap-1 border-b border-ink/15 py-6 text-sm">
          <p className="text-xl font-bold tracking-tight">{booking.listing.title}</p>
          <p className="text-ink/70">{booking.listing.address}</p>
          <p className="tabular mt-2">
            {formatDate(booking.check_in)} to {formatDate(booking.check_out)}, {booking.nights}{' '}
            {booking.nights === 1 ? 'night' : 'nights'}, {booking.guests_count} {booking.guests_count === 1 ? 'guest' : 'guests'}
          </p>
        </section>

        <dl className="tabular grid gap-2 border-b border-ink/15 py-6 text-sm">
          <div className="flex justify-between">
            <dt>
              {money(booking.nightly_price_cents)} x {booking.nights} {booking.nights === 1 ? 'night' : 'nights'}
            </dt>
            <dd>{money(booking.nightly_price_cents * booking.nights)}</dd>
          </div>
          {booking.cleaning_charge_cents > 0 && (
            <div className="flex justify-between">
              <dt>Cleaning charge</dt>
              <dd>{money(booking.cleaning_charge_cents)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-ink/15 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{money(booking.total_cents)}</dd>
          </div>
          <p className="text-xs text-ink/60">No service or booking fees. Prices in Kenyan shillings.</p>
        </dl>

        <section className="py-6 text-sm">
          <h2 className="font-semibold">Payments</h2>
          {paid.length === 0 && <p className="mt-2 text-ink/70">Nothing has been paid on this booking.</p>}
          <ul className="mt-2 grid gap-2">
            {paid.map((p) => (
              <li key={p.id} className="tabular flex flex-wrap justify-between gap-2">
                <span>
                  {formatDate(p.paid_at)}, by {channelName(p.channel)}{' '}
                  <span className="font-mono text-xs text-ink/60">{p.reference}</span>
                </span>
                <span>{money(p.amount_cents)}</span>
                {p.refund_cents > 0 && (
                  <span className="w-full text-ink/70">
                    {p.refunded_at ? `Refunded ${money(p.refund_cents)} on ${formatDate(p.refunded_at)}` : `Refund of ${money(p.refund_cents)} due`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
        <p className="border-t border-ink/15 pt-4 text-xs text-ink/60">
          Paid through Paystack. Cancellation policy: {booking.listing.cancellation_policy_text}
        </p>
      </article>
    </div>
  );
};

export default ReceiptPage;
