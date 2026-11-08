import { formatPrice } from '@/utils/currency';

// Nights, cleaning charge and total for a booking.
const PriceBreakdown = ({ booking }) => (
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
);

export default PriceBreakdown;
