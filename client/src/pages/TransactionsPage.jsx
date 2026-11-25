import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Download, Search, X } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import Pagination from '@/components/ui/Pagination';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { channelName } from '@/utils/bookingStatus';
import { isOwner } from '@/utils/roles';
import { cn } from '@/lib/utils';

const paidWith = (channel) => {
  const name = channelName(channel);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const Total = ({ label, value, note, tone }) => (
  <div className="p-4 sm:p-5">
    <dt className="text-sm font-medium text-ink/65">{label}</dt>
    <dd
      className={`tabular mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${tone === 'alert' ? 'text-red-800' : ''}`}
    >
      {value}
    </dd>
    {note && <dd className="mt-1 text-sm text-ink/60">{note}</dd>}
  </div>
);

const th = 'py-3 pr-4 text-left text-xs font-semibold text-ink/60';
const thNum = 'py-3 pl-3 text-right text-xs font-semibold text-ink/60';
const td = 'py-3 pr-4';
const tdNum = 'tabular py-3 pl-3 text-right';

const CurrencySection = ({ summary, year }) => {
  const money = (cents) => formatPrice(cents, summary.currency);
  const activeMonths = summary.months.filter(
    (m) => m.received_cents || m.refunded_cents,
  );

  return (
    <div className="grid min-w-0 gap-10">
      <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-ink/15 bg-paper lg:grid-cols-4 lg:divide-x lg:divide-ink/10 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r [&>*]:border-ink/10 lg:[&>*]:!border-b-0 lg:[&>*]:!border-r-0">
        <Total
          label={`Received in ${year}`}
          value={money(summary.received_cents)}
          note={`${summary.payments_count} payments`}
        />
        <Total label="Refunded" value={money(summary.refunded_cents)} />
        <Total
          label="Net"
          value={money(summary.net_cents)}
          note="Received less refunds"
        />
        <Total
          label="Refunds due now"
          value={money(summary.refunds_due_cents)}
          note={
            summary.refunds_due_count
              ? `${summary.refunds_due_count} to pay back`
              : 'Nothing owed'
          }
          tone={summary.refunds_due_count ? 'alert' : undefined}
        />
      </dl>

      {summary.booked_ahead_count > 0 && (
        <p className="text-pretty text-ink/75">
          <span className="font-semibold text-ink">
            {money(summary.booked_ahead_cents)}
          </span>{' '}
          more is booked across {summary.booked_ahead_count} confirmed{' '}
          {summary.booked_ahead_count === 1 ? 'stay' : 'stays'} still to come.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <section
          aria-labelledby={`months-${summary.currency}`}
          className="min-w-0 rounded-[28px] bg-paper p-5 sm:p-6"
        >
          <h2
            id={`months-${summary.currency}`}
            className="text-xl font-bold tracking-tight"
          >
            By month
          </h2>
          {activeMonths.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">
              No money in or out in {year}.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-t border-ink/15 text-sm">
                <thead>
                  <tr className="border-b border-ink/15">
                    <th scope="col" className={th}>
                      Month
                    </th>
                    <th scope="col" className={thNum}>
                      Received
                    </th>
                    <th scope="col" className={thNum}>
                      Refunded
                    </th>
                    <th scope="col" className={thNum}>
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {summary.months.map((m) => (
                    <tr
                      key={m.month}
                      className={
                        m.received_cents || m.refunded_cents
                          ? ''
                          : 'text-ink/40'
                      }
                    >
                      <th scope="row" className={`${td} text-left font-medium`}>
                        {MONTHS[m.month - 1]}
                      </th>
                      <td className={tdNum}>{money(m.received_cents)}</td>
                      <td className={tdNum}>
                        {m.refunded_cents ? money(m.refunded_cents) : '-'}
                      </td>
                      <td className={`${tdNum} font-semibold`}>
                        {money(m.net_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section
          aria-labelledby={`homes-${summary.currency}`}
          className="min-w-0 rounded-[28px] bg-paper p-5 sm:p-6"
        >
          <h2
            id={`homes-${summary.currency}`}
            className="text-xl font-bold tracking-tight"
          >
            By home
          </h2>
          {summary.homes.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">
              No home took a payment in {year}.
            </p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-t border-ink/15 text-sm">
                <thead>
                  <tr className="border-b border-ink/15">
                    <th scope="col" className={th}>
                      Home
                    </th>
                    <th scope="col" className={thNum}>
                      Stays
                    </th>
                    <th scope="col" className={thNum}>
                      Nights
                    </th>
                    <th scope="col" className={thNum}>
                      Received
                    </th>
                    <th scope="col" className={thNum}>
                      Refunds
                    </th>
                    <th scope="col" className={thNum}>
                      Net
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {summary.homes.map((h) => (
                    <tr key={h.listing_id}>
                      <th scope="row" className={`${td} text-left font-medium`}>
                        {h.deleted ? (
                          <>
                            {h.title}{' '}
                            <span className="font-normal text-ink/55">
                              (deleted)
                            </span>
                          </>
                        ) : (
                          <Link
                            to={`/account/places/${h.listing_id}`}
                            className="hover:underline hover:underline-offset-4"
                          >
                            {h.title}
                          </Link>
                        )}
                      </th>
                      <td className={tdNum}>{h.bookings}</td>
                      <td className={tdNum}>{h.nights}</td>
                      <td className={tdNum}>{money(h.received_cents)}</td>
                      <td className={tdNum}>
                        {h.refunds_cents ? money(h.refunds_cents) : '-'}
                      </td>
                      <td className={`${tdNum} font-semibold`}>
                        {money(h.net_cents)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

const STATES = [
  { value: 'paid', label: 'Paid' },
  { value: 'refund_due', label: 'Refund due' },
  { value: 'refunded', label: 'Refunded' },
];

const FILTER_KEYS = ['q', 'home', 'state', 'channel', 'from', 'to'];

const control =
  'h-10 rounded-full border border-transparent bg-ink/[0.05] px-4 text-sm text-ink focus:border-ink/40 focus:outline-none focus:ring-2 focus:ring-ink/10';

const StateBadge = ({ row }) => {
  const refund = row.refund_cents
    ? formatPrice(row.refund_cents, row.currency)
    : null;
  if (row.state === 'refunded') {
    return (
      <span className="inline-flex flex-col items-end">
        <span className="rounded-full bg-ink/10 px-2.5 py-0.5 text-xs">
          Refunded
        </span>
        <span className="mt-0.5 text-[11px] text-ink/55">
          {refund} on {format(parseISO(row.refunded_at), 'd MMM yyyy')}
        </span>
      </span>
    );
  }
  if (row.state === 'refund_due') {
    return (
      <span className="inline-flex flex-col items-end">
        <span className="rounded-full bg-red-800/10 px-2.5 py-0.5 text-xs font-medium text-red-800">
          Refund due
        </span>
        <span className="mt-0.5 text-[11px] text-red-800/80">{refund}</span>
      </span>
    );
  }
  return (
    <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs text-sand">
      Paid
    </span>
  );
};

const stayDates = (row) =>
  `${format(parseISO(row.check_in), 'd MMM')} – ${format(parseISO(row.check_out), 'd MMM yyyy')}`;

// The filtered, paged list. `owner` adds the guest and home columns, the home
// filter and the CSV download; guests see their own payments with receipts.
const TransactionsList = ({ endpoint, owner }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [homes, setHomes] = useState([]);
  const [exporting, setExporting] = useState(false);
  const top = useRef(null);

  const filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? '']),
  );
  const page = Number(searchParams.get('page')) || 1;
  const params = {
    q: filters.q || undefined,
    listing_id: filters.home || undefined,
    state: filters.state || undefined,
    channel: filters.channel || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
  const paramsKey = JSON.stringify({ ...params, page });
  const filtered = FILTER_KEYS.some((key) => filters[key]);

  const update = (changes, { keepPage = false } = {}) =>
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) =>
          value ? next.set(key, value) : next.delete(key),
        );
        if (!keepPage) next.delete('page');
        return next;
      },
      { replace: true },
    );

  // Search as the owner types, a moment after they stop.
  useEffect(() => {
    if (query === filters.q) return undefined;
    const timer = setTimeout(() => update({ q: query.trim() }), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => setQuery(filters.q), [filters.q]);

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    api
      .get(endpoint, { params: { ...params, page } })
      .then(({ data }) => current && setData(data))
      .catch((err) => current && setError(errorMessageFrom(err)))
      .finally(() => current && setLoading(false));
    return () => {
      current = false;
    };
  }, [endpoint, paramsKey]);

  useEffect(() => {
    if (!owner) return;
    api
      .get('/admin/listings')
      .then(({ data }) => setHomes(data.listings ?? data))
      .catch(() => setHomes([]));
  }, [owner]);

  const goTo = (next) => {
    update({ page: next > 1 ? String(next) : '' }, { keepPage: true });
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const downloadCsv = async () => {
    setExporting(true);
    try {
      const response = await api.get('/admin/transactions/export', {
        params,
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      Object.assign(document.createElement('a'), {
        href: url,
        download: `tg-homes-transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      }).click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setExporting(false);
    }
  };

  const totals = data?.totals;
  const money = (cents) => formatPrice(cents, totals?.currency ?? 'KES');
  const channels = data?.channels ?? [];

  return (
    <section
      ref={top}
      aria-labelledby="transactions-heading"
      className="scroll-mt-6 rounded-[28px] bg-paper p-5 sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="transactions-heading" className="text-xl tracking-tight">
            {owner ? 'All transactions' : 'Your transactions'}
          </h2>
          <p className="text-sm text-ink/45">
            {data
              ? `${data.total.toLocaleString()} ${data.total === 1 ? 'payment' : 'payments'}${filtered ? (data.total === 1 ? ' matches your filters' : ' match your filters') : ''}`
              : 'Loading…'}
          </p>
        </div>
        {owner && (
          <Button
            variant="outline"
            onClick={downloadCsv}
            disabled={exporting || !data?.total}
          >
            <Download aria-hidden className="size-4" />
            {exporting
              ? 'Preparing…'
              : filtered
                ? 'Download these as CSV'
                : 'Download CSV'}
          </Button>
        )}
      </header>

      {totals && (
        <dl className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {[
            ['Received', money(totals.received_cents)],
            ['Refunded', money(totals.refunded_cents)],
            ['Refunds due', money(totals.refund_due_cents)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-ink/[0.04] px-4 py-3">
              <dt className="text-xs text-ink/55">{label}</dt>
              <dd
                className={cn(
                  'tabular text-lg font-light tracking-tight',
                  label === 'Refunds due' &&
                    totals.refund_due_cents > 0 &&
                    'text-red-800',
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <form
        role="search"
        aria-label="Filter transactions"
        onSubmit={(e) => e.preventDefault()}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <div className="relative min-w-[14rem] grow basis-64">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink/45"
          />
          <input
            type="search"
            aria-label="Search transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              owner
                ? 'Search guest, email, home or reference'
                : 'Search home or reference'
            }
            className={cn(control, '!my-0 !min-h-0 !w-full !rounded-full !border-transparent !bg-ink/[0.05] !py-0 !pl-10 focus:!border-ink/40')}
          />
        </div>
        {owner && (
          <select
            aria-label="Home"
            value={filters.home}
            onChange={(e) => update({ home: e.target.value })}
            className={control}
          >
            <option value="">All homes</option>
            {homes.map((home) => (
              <option key={home.id} value={home.id}>
                {home.title}
              </option>
            ))}
          </select>
        )}
        <select
          aria-label="Status"
          value={filters.state}
          onChange={(e) => update({ state: e.target.value })}
          className={control}
        >
          <option value="">Any status</option>
          {STATES.map((state) => (
            <option key={state.value} value={state.value}>
              {state.label}
            </option>
          ))}
        </select>
        {(channels.length > 1 || filters.channel) && (
          <select
            aria-label="Paid with"
            value={filters.channel}
            onChange={(e) => update({ channel: e.target.value })}
            className={control}
          >
            <option value="">Any payment method</option>
            {[...new Set([...channels, filters.channel].filter(Boolean))].map(
              (channel) => (
                <option key={channel} value={channel}>
                  {paidWith(channel)}
                </option>
              ),
            )}
          </select>
        )}
        <div className="grid gap-1">
          <label htmlFor="tx-from" className="px-2 text-xs text-ink/55">
            Paid from
          </label>
          <input
            id="tx-from"
            type="date"
            value={filters.from}
            max={filters.to || undefined}
            onChange={(e) => update({ from: e.target.value })}
            className={control}
          />
        </div>
        <div className="grid gap-1">
          <label htmlFor="tx-to" className="px-2 text-xs text-ink/55">
            Paid to
          </label>
          <input
            id="tx-to"
            type="date"
            value={filters.to}
            min={filters.from || undefined}
            onChange={(e) => update({ to: e.target.value })}
            className={control}
          />
        </div>
        {filtered && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              update(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])));
            }}
            className="inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink/70 hover:bg-ink/[0.05] hover:text-ink"
          >
            <X aria-hidden className="size-4" />
            Clear filters
          </button>
        )}
      </form>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl bg-red-800/10 p-4 text-sm text-red-900"
        >
          {error}
        </p>
      )}

      {!data && loading && (
        <div
          className="mt-4 h-64 animate-pulse rounded-2xl bg-ink/[0.05]"
          aria-label="Loading transactions"
        />
      )}

      {data && data.total === 0 && (
        <div className="mt-4 rounded-2xl border border-dashed border-ink/20 p-8 text-center">
          <p className="font-medium">
            {filtered
              ? 'No transactions match these filters.'
              : 'No transactions yet.'}
          </p>
          <p className="mt-1 text-sm text-ink/60">
            {filtered
              ? 'Try a wider date range or clear the filters.'
              : owner
                ? 'Guest payments through Paystack show up here as soon as they go through.'
                : 'Payments for your bookings show up here.'}
          </p>
        </div>
      )}

      {data && data.total > 0 && (
        <div
          className={cn('mt-4 transition-opacity', loading && 'opacity-50')}
          aria-busy={loading}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-ink/15">
                  <th scope="col" className={th}>
                    Paid on
                  </th>
                  {owner && (
                    <th scope="col" className={th}>
                      Guest
                    </th>
                  )}
                  <th scope="col" className={th}>
                    Home and stay
                  </th>
                  <th scope="col" className={th}>
                    Paid with
                  </th>
                  <th scope="col" className={th}>
                    Reference
                  </th>
                  <th scope="col" className={thNum}>
                    Amount
                  </th>
                  <th scope="col" className={thNum}>
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {data.transactions.map((row) => (
                  <tr key={row.id} className="align-top">
                    <td className={`${td} tabular whitespace-nowrap`}>
                      {row.paid_at
                        ? format(parseISO(row.paid_at), 'd MMM yyyy')
                        : '-'}
                      {row.paid_at && (
                        <span className="block text-xs text-ink/45">
                          {format(parseISO(row.paid_at), 'HH:mm')}
                        </span>
                      )}
                    </td>
                    {owner && (
                      <td className={td}>
                        <Link
                          to={`/account/reservations/${row.booking_id}`}
                          className="font-medium hover:underline hover:underline-offset-4"
                        >
                          {row.guest_name}
                        </Link>
                        <span className="block max-w-[14rem] truncate text-xs text-ink/50">
                          {row.guest_email}
                        </span>
                      </td>
                    )}
                    <td className={td}>
                      {owner ? (
                        <span className="block max-w-[16rem] truncate">
                          {row.listing_title}
                        </span>
                      ) : (
                        <Link
                          to={`/account/bookings/${row.booking_id}`}
                          className="block max-w-[16rem] truncate font-medium hover:underline hover:underline-offset-4"
                        >
                          {row.listing_title}
                        </Link>
                      )}
                      <span className="block text-xs text-ink/50">
                        {stayDates(row)}
                      </span>
                    </td>
                    <td className={td}>{paidWith(row.channel)}</td>
                    <td className={td}>
                      <span className="font-mono text-xs text-ink/60">
                        {row.reference}
                      </span>
                      {!owner && (
                        <Link
                          to={`/account/bookings/${row.booking_id}/receipt`}
                          className="block text-xs font-medium underline underline-offset-4"
                        >
                          Receipt
                        </Link>
                      )}
                    </td>
                    <td className={`${tdNum} font-semibold`}>
                      {formatPrice(row.amount_cents, row.currency)}
                    </td>
                    <td className={`${tdNum} whitespace-nowrap`}>
                      <StateBadge row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            perPage={data.per_page}
            onPage={goTo}
            label="transactions"
          />
        </div>
      )}
    </section>
  );
};

// The owner's page: a summary of the chosen year, then every transaction.
const OwnerTransactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const year = searchParams.get('year') ?? undefined;
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [currency, setCurrency] = useState(null);

  useEffect(() => {
    setError('');
    api
      .get('/admin/finances', { params: { year } })
      .then(({ data }) => setData(data))
      .catch((err) => setError(errorMessageFrom(err)));
  }, [year]);

  const summary =
    data?.currencies.find((c) => c.currency === currency) ??
    data?.currencies[0];

  return (
    <div className="pb-16">
      <AccountNav
        description="Every payment and refund, with a summary of the year and what each home earns."
        actions={
          data && (
            <div className="flex items-center gap-2 text-sm text-ink/60">
              <span aria-hidden>Summary for</span>
              <select
                id="finance-year"
                aria-label="Year"
                value={data.year}
                onChange={(e) =>
                  setSearchParams(
                    (prev) => {
                      const next = new URLSearchParams(prev);
                      next.set('year', e.target.value);
                      return next;
                    },
                    { replace: true },
                  )
                }
                className={cn(control, 'font-medium')}
              >
                {data.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )
        }
      />

      <div className="mx-4 grid grid-cols-1 gap-4">
        {error && (
          <p
            role="alert"
            className="rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900"
          >
            {error}
          </p>
        )}

        {!data && !error && (
          <div className="grid gap-4" aria-label="Loading the summary">
            <div className="h-32 animate-pulse rounded-3xl bg-ink/[0.07]" />
          </div>
        )}

        {data && data.currencies.length > 1 && (
          <div role="group" aria-label="Currency" className="flex gap-2">
            {data.currencies.map((c) => (
              <button
                key={c.currency}
                type="button"
                aria-pressed={summary?.currency === c.currency}
                onClick={() => setCurrency(c.currency)}
                className={`h-10 rounded-full px-4 text-sm font-medium ${
                  summary?.currency === c.currency
                    ? 'bg-ink text-sand'
                    : 'border border-ink/20 hover:border-ink/50'
                }`}
              >
                {c.currency}
              </button>
            ))}
          </div>
        )}

        {data && data.currencies.length === 0 && (
          <p className="rounded-[28px] bg-paper p-6 text-sm text-ink/70">
            No money in or out in {data.year}.
          </p>
        )}

        {summary && <CurrencySection summary={summary} year={data.year} />}

        <TransactionsList endpoint="/admin/transactions" owner />
      </div>
    </div>
  );
};

const GuestTransactions = () => (
  <div className="pb-16">
    <AccountNav description="Your payments and refunds across every booking. Open one for its receipt." />
    <div className="mx-4">
      <TransactionsList endpoint="/transactions" />
    </div>
  </div>
);

const TransactionsPage = () => {
  const { user } = useAuth();
  if (isOwner(user)) return <OwnerTransactions />;
  if (user?.role === 'guest') return <GuestTransactions />;
  return <Navigate to="/account" replace />;
};

export default TransactionsPage;
