import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronLeft, Pencil, Search, UserPlus, UserX } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import BookingDates from '@/components/ui/BookingDates';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom, fullErrorFrom } from '@/utils/axios';
import { bookingStatusLabel } from '@/utils/bookingStatus';
import { formatPrice } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import { isOwner } from '@/utils/roles';
import { useAuth } from '../../hooks';

const field = 'h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none';

// Add a guest, or change one's name, email and phone.
const GuestForm = ({ guest, open, onOpenChange, onSaved }) => {
  const [values, setValues] = useState({ name: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValues({ name: guest?.name ?? '', email: guest?.email ?? '', phone: guest?.phone ?? '' });
      setError('');
    }
  }, [open, guest]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = guest
        ? await api.patch(`/admin/guests/${guest.id}`, { guest: values })
        : await api.post('/admin/guests', { guest: values });
      onSaved(data.guest);
      onOpenChange(false);
    } catch (err) {
      setError(fullErrorFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">{guest ? `Edit ${guest.name}` : 'Add a guest'}</DialogTitle>
          <DialogDescription className="text-sm text-ink/70">
            {guest
              ? 'If you change the email, they confirm the new address before signing in again.'
              : 'For someone who books by phone or in person. They can set a password later with "Forgot password".'}
          </DialogDescription>
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
                value={values[f.key]}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className={field}
              />
            </label>
          ))}
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving...' : guest ? 'Save changes' : 'Add guest'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const GuestDetail = ({ id, owner }) => {
  const navigate = useNavigate();
  const { data, error, loading, reload, setData } = useFetch(`/admin/guests/${id}`);
  const [editing, setEditing] = useState(false);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [closeError, setCloseError] = useState('');
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  const { guest, bookings } = data;

  const closeAccount = async () => {
    setBusy(true);
    setCloseError('');
    try {
      await api.delete(`/admin/guests/${guest.id}`);
      toast.success(`${guest.name}'s account is closed.`);
      navigate('/account/guests', { replace: true });
    } catch (err) {
      setCloseError(errorMessageFrom(err));
      setBusy(false);
    }
  };

  return (
    <div className="mx-4">
      <Link to="/account/guests" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        All guests
      </Link>
      <section className="mt-2 rounded-3xl border border-ink/15 bg-paper p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-3xl font-bold tracking-tight">{guest.name}</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil aria-hidden className="size-4" />
              Edit
            </Button>
            {owner && (
              <Button variant="danger-outline" onClick={() => { setCloseError(''); setClosing(true); }}>
                <UserX aria-hidden className="size-4" />
                Close account
              </Button>
            )}
          </div>
        </div>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-ink/60">Email</dt>
            <dd className="mt-1 break-all">
              <a href={`mailto:${guest.email}`} className="underline underline-offset-4">{guest.email}</a>
              {!guest.email_verified && <span className="block text-xs text-ink/55">Not confirmed</span>}
            </dd>
          </div>
          <div>
            <dt className="text-ink/60">Phone</dt>
            <dd className="mt-1">{guest.phone ? <a href={`tel:${guest.phone}`} className="underline underline-offset-4">{guest.phone}</a> : 'Not given'}</dd>
          </div>
          <div>
            <dt className="text-ink/60">Guest since</dt>
            <dd className="mt-1">{formatDate(guest.created_at)}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-ink/65">{guest.marketing_consent ? 'Agreed to offers and news.' : "Hasn't agreed to offers and news; don't send marketing."}</p>
      </section>
      <h3 className="mt-8 text-xl font-bold tracking-tight">Bookings</h3>
      {bookings.length ? (
        <ul className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link to={`/account/reservations/${b.id}`} className="grid gap-1 py-3 hover:bg-ink/[0.03] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <span>
                  <span className="block font-medium">{b.listing.title}</span>
                  <BookingDates booking={b} className="text-sm text-ink/70" />
                </span>
                <span className="text-sm sm:text-right">
                  {owner && <span className="tabular block">{formatPrice(b.total_cents, b.currency)}</span>}
                  <span className="text-ink/60">{bookingStatusLabel(b.status, { owner: true })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70">No bookings.</p>
      )}
      <GuestForm
        guest={guest}
        open={editing}
        onOpenChange={setEditing}
        onSaved={(saved) => {
          setData((d) => ({ ...d, guest: saved }));
          toast.success('Guest details saved.');
        }}
      />
      <ConfirmDialog
        open={closing}
        onOpenChange={(open) => !open && setClosing(false)}
        title={`Close ${guest.name}'s account?`}
        confirmLabel="Close account"
        busyLabel="Closing..."
        busy={busy}
        error={closeError}
        tone="danger"
        onConfirm={closeAccount}
      >
        <p>
          Their name, email, phone and sign-in are removed. Their past bookings and payments stay in your records under
          "Closed account". You can't undo this.
        </p>
      </ConfirmDialog>
    </div>
  );
};

// Everyone with a guest account, with stays and spend.
const GuestsPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const owner = isOwner(user);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [rows, setRows] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);

  useEffect(() => {
    if (id) return;
    setRows(null);
    setError('');
    api
      .get('/admin/guests', { params: { q: query || undefined } })
      .then(({ data }) => {
        setRows(data.guests);
        setNextPage(data.next_page);
      })
      .catch((err) => setError(errorMessageFrom(err)));
  }, [id, query]);

  if (id) {
    return (
      <div className="pb-16">
        <AccountNav />
        <GuestDetail id={id} owner={owner} />
      </div>
    );
  }

  const loadMore = async () => {
    setMore(true);
    try {
      const { data } = await api.get('/admin/guests', { params: { q: query || undefined, page: nextPage } });
      setRows([...rows, ...data.guests]);
      setNextPage(data.next_page);
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setMore(false);
    }
  };

  return (
    <div className="pb-16">
      <AccountNav
        description={owner ? "People with a guest account, what they've booked and spent." : "People with a guest account and what they've booked."}
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus aria-hidden className="size-4" />
            Add a guest
          </Button>
        }
      />
      <GuestForm
        open={adding}
        onOpenChange={setAdding}
        onSaved={(saved) => {
          toast.success(`${saved.name} added.`);
          navigate(`/account/guests/${saved.id}`);
        }}
      />
      <form
        role="search"
        className="mx-4 mb-6 flex max-w-md gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(q.trim());
        }}
      >
        <label htmlFor="guest-search" className="sr-only">
          Search guests
        </label>
        <input
          id="guest-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, email or phone"
          className="h-11 grow rounded-full border border-ink/25 bg-paper px-4 text-sm focus:border-ink focus:outline-none"
        />
        <Button type="submit">
          <Search aria-hidden className="size-4" />
          Search
        </Button>
      </form>
      {error && <ErrorNote>{error}</ErrorNote>}
      {!rows && !error && <ListSkeleton />}
      {rows &&
        (rows.length ? (
          <div className="mx-4 overflow-x-auto rounded-[28px] bg-paper p-5 sm:p-6">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-ink/15 text-ink/60">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Guest</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Phone</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Stays</th>
                  {owner && <th scope="col" className="py-2 pr-4 text-right font-medium">Spent</th>}
                  <th scope="col" className="py-2 font-medium">Latest stay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {rows.map((g) => (
                  <tr key={g.id}>
                    <td className="py-3 pr-4">
                      <Link to={`/account/guests/${g.id}`} className="font-medium underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                        {g.name}
                      </Link>
                      <span className="block text-ink/60">{g.email}</span>
                    </td>
                    <td className="py-3 pr-4">{g.phone || <span className="text-ink/45">None</span>}</td>
                    <td className="tabular py-3 pr-4 text-right">{g.stays}</td>
                    {owner && <td className="tabular py-3 pr-4 text-right">{formatPrice(g.spent_cents, 'KES')}</td>}
                    <td className="py-3">{g.last_check_in ? formatDate(g.last_check_in) : <span className="text-ink/45">None</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {nextPage && (
              <Button variant="outline" className="mt-6" onClick={loadMore} disabled={more}>
                {more ? 'Loading...' : 'Show more guests'}
              </Button>
            )}
          </div>
        ) : (
          <EmptyState title={query ? `No guests match "${query}".` : 'No guests yet.'}>
            Guests appear here once they make an account, or when you add one.
          </EmptyState>
        ))}
    </div>
  );
};

export default GuestsPage;
