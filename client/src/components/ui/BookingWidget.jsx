import { useRef, useState } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfToday } from 'date-fns';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import DatePickerWithRange from './DatePickerWithRange';
import { formatPrice } from '@/utils/currency';
import { Button } from '@/components/ui/button';

const toISODate = (date) => format(date, 'yyyy-MM-dd');

// Dates and guests carried in the address (?check_in=&check_out=&guests=), so a
// guest who signs in to book comes back to the same choice. Defaults to one
// night from today.
const initialChoice = (params, maxGuests) => {
  const today = startOfToday();
  const from = parseISO(params.get('check_in') || '');
  const to = parseISO(params.get('check_out') || '');
  const datesOk = isValid(from) && isValid(to) && from >= today && to > from;
  const guests = Number(params.get('guests'));
  return {
    dateRange: datesOk ? { from, to } : { from: today, to: addDays(today, 1) },
    guests: Number.isInteger(guests) && guests >= 1 && guests <= maxGuests ? guests : 1,
  };
};

const BookingWidget = ({ place }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [initial] = useState(() => initialChoice(searchParams, place.max_guests));
  const [dateRange, setDateRange] = useState(initial.dateRange);
  const [guests, setGuests] = useState(initial.guests);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState(null);
  const inFlight = useRef(false);

  const nights =
    dateRange?.from && dateRange?.to ? differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
  const total = nights > 0 ? nights * place.nightly_price_cents + place.cleaning_charge_cents : 0;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      const choice = new URLSearchParams({ guests: String(guests) });
      if (dateRange?.from && dateRange?.to) {
        choice.set('check_in', toISODate(dateRange.from));
        choice.set('check_out', toISODate(dateRange.to));
      }
      return setRedirect({ to: '/login', state: { from: `${location.pathname}?${choice}` } });
    }
    if (inFlight.current) return;
    if (nights < 1) {
      setErrors({});
      setFormError('Choose a check-in and a check-out date.');
      return;
    }

    let leaving = false;
    inFlight.current = true;
    setSubmitting(true);
    setErrors({});
    setFormError('');
    try {
      const { data } = await api.post('/bookings', {
        booking: {
          listing_id: place.id,
          check_in: toISODate(dateRange.from),
          check_out: toISODate(dateRange.to),
          guests_count: Number(guests),
        },
      });
      if (data.checkout_url) {
        // Paystack's page takes M-Pesa or card, then returns to the booking.
        leaving = true;
        window.location.assign(data.checkout_url);
        return;
      }
      toast.success('Booked. Your stay is confirmed.');
      setRedirect({ to: `/account/bookings/${data.booking.id}` });
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setFormError(errorMessageFrom(error));
    } finally {
      // Keep the button busy while the browser leaves for Paystack.
      if (!leaving) {
        inFlight.current = false;
        setSubmitting(false);
      }
    }
  };

  const paysOnline = place.currency === 'KES';
  let buttonLabel = 'Sign in to book';
  if (user) buttonLabel = paysOnline ? 'Book and pay' : 'Book this home';
  if (submitting) buttonLabel = paysOnline ? 'Opening payment...' : 'Booking...';

  if (redirect) return <Navigate to={redirect.to} state={redirect.state} />;

  const dateErrors = [errors.base, errors.check_in, errors.check_out, errors.listing].filter(Boolean);

  return (
    <form onSubmit={handleBooking} className="rounded-2xl border border-ink/15 bg-paper p-5 md:p-6">
      <p className="flex items-baseline gap-2">
        <span className="tabular font-bold tracking-tight text-4xl leading-none">{formatPrice(place.nightly_price_cents, place.currency)}</span>
        <span className="text-ink/70">a night</span>
      </p>
      {place.cleaning_charge_cents > 0 && (
        <p className="mt-1 text-sm text-ink/60">
          Plus a {formatPrice(place.cleaning_charge_cents, place.currency)} cleaning charge per stay
        </p>
      )}

      <div className="mt-5 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="booking-dates" className="text-sm font-medium">
            Dates
          </label>
          <DatePickerWithRange
            id="booking-dates"
            value={dateRange}
            onChange={setDateRange}
            invalid={dateErrors.length > 0}
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="booking-guests" className="text-sm font-medium">
            Guests
          </label>
          <select
            id="booking-guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            aria-invalid={errors.guests_count ? 'true' : undefined}
            aria-describedby={errors.guests_count ? 'booking-guests-error' : undefined}
            className="h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-sm text-ink hover:border-ink/50 focus:border-ink focus:outline-none"
          >
            {Array.from({ length: place.max_guests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'guest' : 'guests'}
              </option>
            ))}
          </select>
          {errors.guests_count && (
            <p id="booking-guests-error" className="text-sm text-red-700">
              Guests {errors.guests_count}
            </p>
          )}
        </div>
      </div>

      {formError && (
        <div role="alert" className="mt-4 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
          <p>{formError}</p>
          {dateErrors
            .filter((message) => message !== formError)
            .map((message) => (
              <p key={message}>{message}</p>
            ))}
        </div>
      )}

      {nights > 0 && (
        <dl className="tabular mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink/70">
              {formatPrice(place.nightly_price_cents, place.currency)} x {nights} {nights === 1 ? 'night' : 'nights'}
            </dt>
            <dd>{formatPrice(nights * place.nightly_price_cents, place.currency)}</dd>
          </div>
          {place.cleaning_charge_cents > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink/70">Cleaning charge</dt>
              <dd>{formatPrice(place.cleaning_charge_cents, place.currency)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-ink/15 pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total, place.currency)}</dd>
          </div>
        </dl>
      )}

      <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting} aria-busy={submitting}>
        {buttonLabel}
      </Button>
      {paysOnline && (
        <p className="mt-3 text-center text-sm text-ink/60">
          Pay by M-Pesa or card on Paystack. Your dates are held for 15 minutes while you pay.
        </p>
      )}
    </form>
  );
};

export default BookingWidget;
