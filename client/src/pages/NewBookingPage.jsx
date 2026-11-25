import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ChevronLeft } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, fullErrorFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import useFetch from '@/utils/useFetch';

const METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'mpesa', label: 'M-Pesa' },
  { id: 'bank', label: 'Bank transfer' },
  { id: 'card', label: 'Card' },
];

const field = 'h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none';
const today = () => new Date().toISOString().slice(0, 10);

// A stay booked by phone or in person. The guest gets the usual confirmation email.
const NewBookingPage = () => {
  const navigate = useNavigate();
  const { data, error: loadError, loading, reload } = useFetch('/admin/listings');
  const homes = useMemo(() => (data?.listings ?? []).filter((h) => h.status === 'published'), [data]);
  const [homeId, setHomeId] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [guestMode, setGuestMode] = useState('existing');
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [guest, setGuest] = useState(null);
  const [newGuest, setNewGuest] = useState({ name: '', email: '', phone: '' });
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState('cash');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!homeId && homes.length) setHomeId(homes[0].id);
  }, [homes, homeId]);

  // Look guests up as the owner types.
  useEffect(() => {
    if (guestMode !== 'existing' || search.trim().length < 2) {
      setMatches([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      api
        .get('/admin/guests', { params: { q: search.trim() } })
        .then(({ data: res }) => setMatches(res.guests.slice(0, 8)))
        .catch(() => setMatches([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, guestMode]);

  const home = homes.find((h) => h.id === homeId);
  const nights = checkIn && checkOut ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn)) : 0;
  const total = home && nights > 0 ? nights * home.nightly_price_cents + home.cleaning_charge_cents : 0;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (guestMode === 'existing' && !guest) {
      setError('Pick a guest from the list, or choose "New guest".');
      return;
    }
    setBusy(true);
    try {
      const { data: res } = await api.post('/admin/bookings', {
        listing_id: homeId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
        ...(guestMode === 'existing' ? { guest_id: guest.id } : { guest: newGuest }),
        ...(paid ? { payment_amount: paid, payment_method: method } : {}),
      });
      toast.success('Booking saved. The guest has been sent their confirmation.');
      navigate(`/account/reservations/${res.booking.id}`);
    } catch (err) {
      setError(fullErrorFrom(err));
      setBusy(false);
    }
  };

  return (
    <div className="pb-24">
      <AccountNav description="For stays booked by phone or in person. The dates are taken off the website straight away." />
      <div className="mx-4">
        <Link to="/account/reservations" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink">
          <ChevronLeft aria-hidden className="size-4" />
          All bookings
        </Link>
      </div>
      {loading && <ListSkeleton rows={3} />}
      {loadError && <ErrorNote onRetry={reload}>{loadError}</ErrorNote>}
      {data && !homes.length && (
        <ErrorNote>No home is listed yet. List a home before taking bookings.</ErrorNote>
      )}
      {home && (
        <form onSubmit={submit} className="mx-4 mt-2 grid max-w-2xl gap-8">
          <fieldset className="grid gap-4">
            <legend className="mb-3 text-xl font-bold tracking-tight">The stay</legend>
            <label className="grid gap-1.5 text-sm font-medium">
              Home
              <select value={homeId} onChange={(e) => setHomeId(e.target.value)} className={field}>
                {homes.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm font-medium">
                Check-in
                <input type="date" required min={today()} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Check-out
                <input type="date" required min={checkIn || today()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Guests (up to {home.max_guests})
                <input type="number" required min={1} max={home.max_guests} value={guestsCount} onChange={(e) => setGuestsCount(e.target.value)} className={field} />
              </label>
            </div>
            {total > 0 && (
              <p className="tabular text-sm text-ink/75">
                {formatPrice(home.nightly_price_cents, home.currency)} x {nights} {nights === 1 ? 'night' : 'nights'}
                {home.cleaning_charge_cents > 0 && ` + ${formatPrice(home.cleaning_charge_cents, home.currency)} cleaning`} ={' '}
                <strong>{formatPrice(total, home.currency)}</strong>
              </p>
            )}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-3 text-xl font-bold tracking-tight">Guest</legend>
            <div className="flex gap-2" role="radiogroup" aria-label="Guest">
              {[
                { id: 'existing', label: 'Existing guest' },
                { id: 'new', label: 'New guest' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={guestMode === option.id}
                  onClick={() => setGuestMode(option.id)}
                  className={`h-10 rounded-full border px-4 text-sm ${guestMode === option.id ? 'border-ink bg-ink text-sand' : 'border-ink/25 hover:border-ink/60'}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {guestMode === 'existing' ? (
              guest ? (
                <p className="flex flex-wrap items-center gap-3 rounded-xl border border-ink/15 bg-paper p-3 text-sm">
                  <span className="grow">
                    <strong>{guest.name}</strong> <span className="text-ink/60">{guest.email}</span>
                  </span>
                  <button type="button" onClick={() => setGuest(null)} className="min-h-11 font-medium underline underline-offset-4">
                    Change
                  </button>
                </p>
              ) : (
                <div className="grid gap-2">
                  <label className="grid gap-1.5 text-sm font-medium">
                    Find a guest
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, email or phone" className={field} />
                  </label>
                  {matches.length > 0 && (
                    <ul className="divide-y divide-ink/10 rounded-xl border border-ink/15 bg-paper">
                      {matches.map((m) => (
                        <li key={m.id}>
                          <button type="button" onClick={() => setGuest(m)} className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-ink/[0.04]">
                            <strong>{m.name}</strong> <span className="text-ink/60">{m.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {search.trim().length >= 2 && matches.length === 0 && (
                    <p className="text-sm text-ink/65">No guest matches. Choose "New guest" to add them.</p>
                  )}
                </div>
              )
            ) : (
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { key: 'name', label: 'Full name', type: 'text', required: true },
                  { key: 'email', label: 'Email', type: 'email', required: true },
                  { key: 'phone', label: 'Phone', type: 'tel', required: false },
                ].map((f) => (
                  <label key={f.key} className="grid gap-1.5 text-sm font-medium">
                    {f.label}
                    <input
                      type={f.type}
                      required={f.required}
                      value={newGuest[f.key]}
                      onChange={(e) => setNewGuest({ ...newGuest, [f.key]: e.target.value })}
                      className={field}
                    />
                  </label>
                ))}
                <p className="text-sm text-ink/65 sm:col-span-3">
                  They get the booking confirmation by email and can set a password later with "Forgot password".
                </p>
              </div>
            )}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="mb-3 text-xl font-bold tracking-tight">Money received (optional)</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Amount (Ksh)
                <input type="number" min={1} step="1" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder="Leave empty if not paid yet" className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Paid by
                <select value={method} onChange={(e) => setMethod(e.target.value)} className={field} disabled={!paid}>
                  {METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
              {error}
            </p>
          )}
          <div>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : 'Save booking'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewBookingPage;
