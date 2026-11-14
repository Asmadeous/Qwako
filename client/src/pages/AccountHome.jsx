import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { AlertCircle, ChevronRight, Plus } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import GuestOverview from './GuestOverview';

const whenLabel = (iso) => {
  const days = differenceInCalendarDays(parseISO(iso), new Date());
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return format(parseISO(iso), 'd MMM');
};

const Figure = ({ label, value, note, to }) => {
  const body = (
    <>
      <p className="text-sm font-medium text-ink/65">{label}</p>
      <p className="tabular mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-sm text-ink/60">{note}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="block h-full p-4 sm:p-5 transition-colors hover:bg-ink/[0.04]">
      {body}
    </Link>
  ) : (
    <div className="p-4 sm:p-5">{body}</div>
  );
};

const Skeleton = ({ className }) => <div className={`animate-pulse rounded-lg bg-ink/[0.07] ${className}`} />;

const OwnerOverview = () => {
  const [finances, setFinances] = useState(null);
  const [arrivals, setArrivals] = useState(null);
  const [homes, setHomes] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/admin/finances'),
      api.get('/admin/bookings', { params: { view: 'upcoming' } }),
      api.get('/admin/listings'),
      api.get('/admin/overview'),
    ])
      .then(([f, b, l, o]) => {
        setFinances(f.data);
        setArrivals(b.data.bookings.slice(0, 6));
        setHomes(l.data.listings);
        setToday(o.data);
      })
      .catch((err) => setError(errorMessageFrom(err)));
  }, []);

  const loading = !finances && !error;
  const main = finances?.currencies?.[0];
  const currency = main?.currency ?? 'KES';
  const refundsDue = finances?.currencies?.reduce((n, c) => n + c.refunds_due_count, 0) ?? 0;
  const noPhotos = homes?.filter((h) => h.photos.length === 0) ?? [];
  const noCategory = homes?.filter((h) => !h.category) ?? [];
  const live = homes?.filter((h) => h.status === 'published').length ?? 0;
  const todos = [
    ...(today?.requests ?? []).map((r) => ({
      to: `/account/reservations/${r.id}`,
      text: `${r.guest_name} asks to book ${r.listing_title}. Answer by ${format(parseISO(r.requested_until), 'd MMM, HH:mm')}`,
    })),
    today?.unread_messages > 0 && {
      to: '/account/inbox?view=unread',
      text: `${today.unread_messages} unread ${today.unread_messages === 1 ? 'conversation' : 'conversations'}`,
    },
    today?.new_contact_messages > 0 && {
      to: '/account/inbox?view=contact',
      text: `${today.new_contact_messages} contact form ${today.new_contact_messages === 1 ? 'message' : 'messages'} to answer`,
    },
    refundsDue > 0 && {
      to: '/account/reservations?view=refunds',
      text: `${refundsDue} ${refundsDue === 1 ? 'refund is' : 'refunds are'} due to guests`,
    },
    noPhotos.length > 0 && {
      to: `/account/places/${noPhotos[0].id}`,
      text: `${noPhotos.length} ${noPhotos.length === 1 ? 'home has' : 'homes have'} no photos`,
    },
    noCategory.length > 0 && {
      to: '/account/places',
      text: `${noCategory.length} ${noCategory.length === 1 ? 'home has' : 'homes have'} no category`,
    },
  ].filter(Boolean);

  return (
    <div className="pb-16">
      <AccountNav
        description={`Here is how your homes are doing in ${finances?.year ?? new Date().getFullYear()}.`}
        actions={
          <Link to="/account/places/new" className={buttonVariants()}>
            <Plus aria-hidden className="size-4" />
            Add a home
          </Link>
        }
      />

      {error && (
        <p role="alert" className="mx-4 mb-6 rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      )}

      <section aria-label="Key figures" className="mx-4 grid overflow-hidden grid-cols-2 divide-ink/10 rounded-3xl border border-ink/15 bg-paper lg:grid-cols-4 lg:divide-x [&>*]:border-ink/10 [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r lg:[&>*]:!border-b-0 lg:[&>*]:!border-r-0">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="p-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
            </div>
          ))
        ) : (
          <>
            <Figure
              label="Received this year"
              value={formatPrice(main?.net_cents ?? 0, currency)}
              note={`${main?.payments_count ?? 0} payments, after refunds`}
              to="/account/finances"
            />
            <Figure
              label="Booked ahead"
              value={formatPrice(main?.booked_ahead_cents ?? 0, currency)}
              note={`${main?.booked_ahead_count ?? 0} confirmed stays`}
              to="/account/reservations"
            />
            <Figure
              label="Refunds due"
              value={formatPrice(main?.refunds_due_cents ?? 0, currency)}
              note={refundsDue ? `${refundsDue} to pay back` : 'Nothing owed'}
              to={refundsDue ? '/account/reservations?view=refunds' : undefined}
            />
            <Figure
              label="Homes"
              value={homes?.length ?? 0}
              note={`${live} listed for guests`}
              to="/account/places"
            />
          </>
        )}
      </section>

      {today && (
        <section aria-labelledby="today-heading" className="mx-4 mt-6">
          <h2 id="today-heading" className="sr-only">
            Today
          </h2>
          <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            {[
              { label: 'Arriving today', value: today.arrivals_today.length, note: today.arrivals_today.map((a) => a.guest_name).join(', ') },
              { label: 'Leaving today', value: today.departures_today.length, note: today.departures_today.map((a) => a.guest_name).join(', ') },
              { label: 'Booked this month', value: `${today.occupancy_this_month}%`, note: 'of nights across listed homes' },
              { label: 'Next 30 days', value: `${today.occupancy_next_30_days}%`, note: `booked; ${today.in_house} staying now` },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink/15 p-4">
                <dt className="font-medium text-ink/65">{item.label}</dt>
                <dd className="tabular mt-1 text-2xl font-bold tracking-tight">{item.value}</dd>
                {item.note && <dd className="mt-0.5 truncate text-ink/60">{item.note}</dd>}
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mx-4 mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section aria-labelledby="arrivals-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="arrivals-heading" className="text-xl font-bold tracking-tight">
              Next arrivals
            </h2>
            <Link to="/account/reservations" className="text-sm font-medium underline underline-offset-4">
              All bookings
            </Link>
          </div>
          {!arrivals && !error ? (
            <div className="mt-4 grid gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : arrivals?.length ? (
            <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
              {arrivals.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/account/reservations/${b.id}`}
                    className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-4 py-3 transition-colors hover:bg-ink/[0.03]"
                  >
                    <span className="text-sm font-semibold">{whenLabel(b.check_in)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.guest.name}</span>
                      <span className="block truncate text-sm text-ink/60">
                        {b.listing.title}, {b.nights} {b.nights === 1 ? 'night' : 'nights'}
                      </span>
                    </span>
                    <span className="tabular text-sm">{formatPrice(b.total_cents, b.currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-2xl border border-dashed border-ink/25 p-6 text-sm text-ink/70">
              No upcoming stays. New bookings show up here as soon as guests book.
            </p>
          )}
        </section>

        <section aria-labelledby="todo-heading">
          <h2 id="todo-heading" className="text-xl font-bold tracking-tight">
            Needs your attention
          </h2>
          {homes && todos.length === 0 && (
            <p className="mt-4 text-sm text-ink/70">Nothing right now. Requests, unread messages, refunds owed and homes missing photos show up here.</p>
          )}
          {todos.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {todos.map((todo) => (
                <li key={todo.text}>
                  <Link
                    to={todo.to}
                    className="flex min-h-12 items-center gap-3 rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm font-medium transition-colors hover:border-ink/40"
                  >
                    <AlertCircle aria-hidden className="size-4 shrink-0 text-red-800" />
                    <span className="grow">{todo.text}</span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-ink/50" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};

// /account: the owner's overview, or the guest's.
const AccountHome = () => {
  const { user } = useAuth();
  return user?.role === 'admin' ? <OwnerOverview /> : <GuestOverview />;
};

export default AccountHome;
