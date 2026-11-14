import { useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Download } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { channelName } from '@/utils/bookingStatus';

const paidWith = (channel) => {
  const name = channelName(channel);
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const downloadCsv = (year, payments) => {
  const rows = [
    ['Paid on', 'Reference', 'Guest', 'Guest email', 'Home', 'Check in', 'Check out', 'Paid with', 'Currency', 'Amount', 'Refund', 'Refunded on'],
    ...payments.map((p) => [
      p.paid_at ? format(parseISO(p.paid_at), 'yyyy-MM-dd') : '',
      p.reference,
      p.guest_name,
      p.guest_email,
      p.listing_title,
      p.check_in,
      p.check_out,
      paidWith(p.channel),
      p.currency,
      (p.amount_cents / 100).toFixed(2),
      p.refunded_at || p.refund_due ? ((p.refund_cents ?? p.amount_cents) / 100).toFixed(2) : '',
      p.refunded_at ? format(parseISO(p.refunded_at), 'yyyy-MM-dd') : p.refund_due ? 'Due' : '',
    ]),
  ];
  const blob = new Blob([rows.map((r) => r.map(csvCell).join(',')).join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: `tg-bnb-payments-${year}.csv` });
  link.click();
  URL.revokeObjectURL(url);
};

const Total = ({ label, value, note, tone }) => (
  <div className="p-4 sm:p-5">
    <dt className="text-sm font-medium text-ink/65">{label}</dt>
    <dd className={`tabular mt-2 text-2xl font-bold tracking-tight sm:text-3xl ${tone === 'alert' ? 'text-red-800' : ''}`}>{value}</dd>
    {note && <dd className="mt-1 text-sm text-ink/60">{note}</dd>}
  </div>
);

const th = 'py-3 pr-4 text-left text-xs font-semibold text-ink/60';
const thNum = 'py-3 pl-3 text-right text-xs font-semibold text-ink/60';
const td = 'py-3 pr-4';
const tdNum = 'tabular py-3 pl-3 text-right';

const CurrencySection = ({ summary, year }) => {
  const money = (cents) => formatPrice(cents, summary.currency);
  const activeMonths = summary.months.filter((m) => m.received_cents || m.refunded_cents);

  return (
    <div className="grid min-w-0 gap-10">
      <dl className="grid grid-cols-2 overflow-hidden rounded-3xl border border-ink/15 bg-paper lg:grid-cols-4 lg:divide-x lg:divide-ink/10 [&>*]:border-ink/10 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r lg:[&>*]:!border-b-0 lg:[&>*]:!border-r-0">
        <Total label={`Received in ${year}`} value={money(summary.received_cents)} note={`${summary.payments_count} payments`} />
        <Total label="Refunded" value={money(summary.refunded_cents)} />
        <Total label="Net" value={money(summary.net_cents)} note="Received less refunds" />
        <Total
          label="Refunds due now"
          value={money(summary.refunds_due_cents)}
          note={summary.refunds_due_count ? `${summary.refunds_due_count} to pay back` : 'Nothing owed'}
          tone={summary.refunds_due_count ? 'alert' : undefined}
        />
      </dl>

      {summary.booked_ahead_count > 0 && (
        <p className="text-pretty text-ink/75">
          <span className="font-semibold text-ink">{money(summary.booked_ahead_cents)}</span> more is booked across{' '}
          {summary.booked_ahead_count} confirmed {summary.booked_ahead_count === 1 ? 'stay' : 'stays'} still to come.
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-2">
        <section aria-labelledby={`months-${summary.currency}`} className="min-w-0">
          <h2 id={`months-${summary.currency}`} className="text-xl font-bold tracking-tight">
            By month
          </h2>
          {activeMonths.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">No money in or out in {year}.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
            <table className="w-full border-t border-ink/15 text-sm">
              <thead>
                <tr className="border-b border-ink/15">
                  <th scope="col" className={th}>Month</th>
                  <th scope="col" className={thNum}>Received</th>
                  <th scope="col" className={thNum}>Refunded</th>
                  <th scope="col" className={thNum}>Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {summary.months.map((m) => (
                  <tr key={m.month} className={m.received_cents || m.refunded_cents ? '' : 'text-ink/40'}>
                    <th scope="row" className={`${td} text-left font-medium`}>{MONTHS[m.month - 1]}</th>
                    <td className={tdNum}>{money(m.received_cents)}</td>
                    <td className={tdNum}>{m.refunded_cents ? money(m.refunded_cents) : '-'}</td>
                    <td className={`${tdNum} font-semibold`}>{money(m.net_cents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>

        <section aria-labelledby={`homes-${summary.currency}`} className="min-w-0">
          <h2 id={`homes-${summary.currency}`} className="text-xl font-bold tracking-tight">
            By home
          </h2>
          {summary.homes.length === 0 ? (
            <p className="mt-3 text-sm text-ink/70">No home took a payment in {year}.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
            <table className="w-full border-t border-ink/15 text-sm">
              <thead>
                <tr className="border-b border-ink/15">
                  <th scope="col" className={th}>Home</th>
                  <th scope="col" className={thNum}>Stays</th>
                  <th scope="col" className={thNum}>Nights</th>
                  <th scope="col" className={thNum}>Received</th>
                  <th scope="col" className={thNum}>Refunds</th>
                  <th scope="col" className={thNum}>Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {summary.homes.map((h) => (
                  <tr key={h.listing_id}>
                    <th scope="row" className={`${td} text-left font-medium`}>
                      {h.deleted ? (
                        <>
                          {h.title} <span className="font-normal text-ink/55">(deleted)</span>
                        </>
                      ) : (
                        <Link to={`/account/places/${h.listing_id}`} className="hover:underline hover:underline-offset-4">
                          {h.title}
                        </Link>
                      )}
                    </th>
                    <td className={tdNum}>{h.bookings}</td>
                    <td className={tdNum}>{h.nights}</td>
                    <td className={tdNum}>{money(h.received_cents)}</td>
                    <td className={tdNum}>{h.refunds_cents ? money(h.refunds_cents) : '-'}</td>
                    <td className={`${tdNum} font-semibold`}>{money(h.net_cents)}</td>
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

const FinancesContent = () => {
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

  const summary = data?.currencies.find((c) => c.currency === currency) ?? data?.currencies[0];

  return (
    <div className="pb-16">
      <AccountNav
        description="Payments from guests, refunds, and what each home earns."
        actions={
          data && (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="finance-year" className="sr-only">Year</label>
              <select
                id="finance-year"
                value={data.year}
                onChange={(e) => setSearchParams({ year: e.target.value })}
                className="h-11 rounded-full border border-ink/25 bg-white px-4 font-medium focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15"
              >
                {data.years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <Button variant="outline" onClick={() => downloadCsv(data.year, data.payments)} disabled={!data.payments.length}>
                <Download aria-hidden className="size-4" />
                Download CSV
              </Button>
            </div>
          )
        }
      />

      <div className="mx-4">
        {error && (
          <p role="alert" className="mb-6 rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">{error}</p>
        )}

        {!data && !error && (
          <div className="grid gap-4" aria-label="Loading finances">
            <div className="h-32 animate-pulse rounded-3xl bg-ink/[0.07]" />
            <div className="h-64 animate-pulse rounded-3xl bg-ink/[0.05]" />
          </div>
        )}

        {data && data.currencies.length === 0 && (
          <div className="rounded-3xl border border-dashed border-ink/25 p-8">
            <p className="font-semibold">No payments in {data.year}.</p>
            <p className="mt-1 text-sm text-ink/70">Guest payments through Paystack show up here as soon as they go through.</p>
            <Link to="/account/reservations" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">
              See bookings
            </Link>
          </div>
        )}

        {data && data.currencies.length > 1 && (
          <div role="group" aria-label="Currency" className="mb-6 flex gap-2">
            {data.currencies.map((c) => (
              <button
                key={c.currency}
                type="button"
                aria-pressed={summary?.currency === c.currency}
                onClick={() => setCurrency(c.currency)}
                className={`h-10 rounded-full px-4 text-sm font-medium ${
                  summary?.currency === c.currency ? 'bg-ink text-sand' : 'border border-ink/20 hover:border-ink/50'
                }`}
              >
                {c.currency}
              </button>
            ))}
          </div>
        )}

        {summary && <CurrencySection summary={summary} year={data.year} />}

        {data && data.payments.length > 0 && (
          <section aria-labelledby="payments-heading" className="mt-12">
            <h2 id="payments-heading" className="text-xl font-bold tracking-tight">
              Payments in {data.year}
            </h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[44rem] border-t border-ink/15 text-sm">
                <thead>
                  <tr className="border-b border-ink/15">
                    <th scope="col" className={th}>Paid on</th>
                    <th scope="col" className={th}>Guest</th>
                    <th scope="col" className={th}>Home</th>
                    <th scope="col" className={th}>Paid with</th>
                    <th scope="col" className={thNum}>Amount</th>
                    <th scope="col" className={thNum}>Refund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10">
                  {data.payments.map((p) => (
                    <tr key={p.id}>
                      <td className={`${td} tabular whitespace-nowrap`}>
                        {p.paid_at ? format(parseISO(p.paid_at), 'd MMM') : '-'}
                      </td>
                      <td className={td}>
                        <Link to={`/account/reservations/${p.booking_id}`} className="font-medium hover:underline hover:underline-offset-4">
                          {p.guest_name}
                        </Link>
                      </td>
                      <td className={`${td} max-w-[14rem] truncate`}>{p.listing_title}</td>
                      <td className={td}>{paidWith(p.channel)}</td>
                      <td className={`${tdNum} font-semibold`}>{formatPrice(p.amount_cents, p.currency)}</td>
                      <td className={`${tdNum} whitespace-nowrap`}>
                        {p.refunded_at ? (
                          <span className="text-ink/60">
                            {formatPrice(p.refund_cents ?? p.amount_cents, p.currency)} refunded {format(parseISO(p.refunded_at), 'd MMM')}
                          </span>
                        ) : p.refund_due ? (
                          <span className="font-semibold text-red-800">{formatPrice(p.refund_cents ?? p.amount_cents, p.currency)} due</span>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const FinancesPage = () => {
  const { user } = useAuth();
  if (user?.role !== 'admin') return <Navigate to="/account" replace />;
  return <FinancesContent />;
};

export default FinancesPage;
