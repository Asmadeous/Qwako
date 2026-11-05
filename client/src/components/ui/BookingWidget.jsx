import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import DatePickerWithRange from './DatePickerWithRange';
import { formatPrice } from '@/utils/currency';

const toISODate = (date) => format(date, 'yyyy-MM-dd');

const BookingWidget = ({ place }) => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [form, setForm] = useState({ guests_count: 1, contact_name: '', contact_phone: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState('');
  const inFlight = useRef(false);

  useEffect(() => {
    if (user) setForm((current) => ({ ...current, contact_name: current.contact_name || user.name }));
  }, [user]);

  const nights =
    dateRange.from && dateRange.to ? differenceInCalendarDays(dateRange.to, dateRange.from) : 0;
  const total = nights > 0 ? nights * place.nightly_price_pence + place.cleaning_charge_pence : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) return setRedirect('/login');
    if (inFlight.current) return;
    if (nights < 1) {
      setFormError('Choose a check-in and check-out date.');
      return;
    }

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
          guests_count: Number(form.guests_count),
          contact_name: form.contact_name,
          contact_phone: form.contact_phone,
        },
      });
      toast.success('Booked. Enjoy your stay!');
      setRedirect(`/account/bookings/${data.booking.id}`);
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setFormError(errorMessageFrom(error));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  if (redirect) return <Navigate to={redirect} />;

  const fieldError = (field) =>
    errors[field] && (
      <p id={`booking-${field}-error`} className="text-sm text-red-700">
        {errors[field]}
      </p>
    );
  const dateErrors = [errors.base, errors.check_in, errors.check_out, errors.listing].filter(Boolean);

  return (
    <form onSubmit={handleBooking} className="rounded-2xl bg-white p-4 shadow-xl">
      <div className="text-center text-xl">
        <span className="font-semibold">{formatPrice(place.nightly_price_pence)}</span> per night
      </div>
      {place.cleaning_charge_pence > 0 && (
        <p className="text-center text-sm text-gray-600">
          plus a {formatPrice(place.cleaning_charge_pence)} cleaning charge per stay
        </p>
      )}

      {formError && (
        <div role="alert" className="mt-3 rounded-[10px] border border-red-700 p-3 text-sm text-red-700">
          {formError}
          {dateErrors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl border">
        <div className="flex w-full">
          <DatePickerWithRange setDateRange={setDateRange} />
        </div>
        <div className="border-t py-3 px-4">
          <label htmlFor="booking-guests_count">Guests (up to {place.max_guests})</label>
          <input
            id="booking-guests_count"
            type="number"
            name="guests_count"
            min={1}
            max={place.max_guests}
            required
            value={form.guests_count}
            onChange={handleChange}
            aria-invalid={errors.guests_count ? 'true' : undefined}
            aria-describedby={errors.guests_count ? 'booking-guests_count-error' : undefined}
          />
          {fieldError('guests_count')}
        </div>
        <div className="border-t py-3 px-4">
          <label htmlFor="booking-contact_name">Your full name</label>
          <input
            id="booking-contact_name"
            type="text"
            name="contact_name"
            autoComplete="name"
            required
            value={form.contact_name}
            onChange={handleChange}
            aria-invalid={errors.contact_name ? 'true' : undefined}
            aria-describedby={errors.contact_name ? 'booking-contact_name-error' : undefined}
          />
          {fieldError('contact_name')}
          <label htmlFor="booking-contact_phone">Phone number</label>
          <input
            id="booking-contact_phone"
            type="tel"
            name="contact_phone"
            autoComplete="tel"
            placeholder="+44 7700 900123"
            required
            value={form.contact_phone}
            onChange={handleChange}
            aria-invalid={errors.contact_phone ? 'true' : undefined}
            aria-describedby={errors.contact_phone ? 'booking-contact_phone-error' : undefined}
          />
          {fieldError('contact_phone')}
        </div>
      </div>

      {nights > 0 && (
        <dl className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between">
            <dt>
              {formatPrice(place.nightly_price_pence)} x {nights} {nights === 1 ? 'night' : 'nights'}
            </dt>
            <dd>{formatPrice(nights * place.nightly_price_pence)}</dd>
          </div>
          {place.cleaning_charge_pence > 0 && (
            <div className="flex justify-between">
              <dt>Cleaning charge</dt>
              <dd>{formatPrice(place.cleaning_charge_pence)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t pt-1 font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      )}

      <button
        className="primary mt-4 min-h-[44px] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? 'Booking...' : user ? 'Book this stay' : 'Sign in to book'}
      </button>
    </form>
  );
};

export default BookingWidget;
