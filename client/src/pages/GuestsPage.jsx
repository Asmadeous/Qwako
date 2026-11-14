import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Search } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import BookingDates from '@/components/ui/BookingDates';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { bookingStatusLabel } from '@/utils/bookingStatus';
import { formatPrice } from '@/utils/currency';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';

const GuestDetail = ({ id }) => {
  const { data, error, loading, reload } = useFetch(`/admin/guests/${id}`);
  if (loading) return <ListSkeleton />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  const { guest, bookings } = data;
  return (
    <div className="mx-4">
      <Link to="/account/guests" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        All guests
      </Link>
      <section className="mt-2 rounded-3xl border border-ink/15 bg-paper p-6">
        <h2 className="text-3xl font-bold tracking-tight">{guest.name}</h2>
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
                  <span className="tabular block">{formatPrice(b.total_cents, b.currency)}</span>
                  <span className="text-ink/60">{bookingStatusLabel(b.status, { owner: true })}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink/70">No bookings.</p>
      )}
    </div>
  );
};

// Everyone with a guest account, with stays and spend.
const GuestsPage = () => {
  const { id } = useParams();
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
        <GuestDetail id={id} />
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
      <AccountNav description="People with a guest account, what they've booked and spent." />
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
          <div className="mx-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-ink/15 text-ink/60">
                <tr>
                  <th scope="col" className="py-2 pr-4 font-medium">Guest</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Phone</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Stays</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Spent</th>
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
                    <td className="tabular py-3 pr-4 text-right">{formatPrice(g.spent_cents, 'KES')}</td>
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
            Guests appear here once they make an account.
          </EmptyState>
        ))}
    </div>
  );
};

export default GuestsPage;
