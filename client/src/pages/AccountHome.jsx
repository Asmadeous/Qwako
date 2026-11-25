import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { AlertCircle, CalendarCheck, ChevronRight, Home as House, Plus, Undo2, Wallet } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice, formatPriceCompact } from '@/utils/currency';
import { Card, DashBar, Legend, LineChart, PillLink, ShareBars, Toggle } from '@/components/ui/DashCards';
import { isOwner, isTeam } from '@/utils/roles';
import GuestOverview from './GuestOverview';

const whenLabel = (iso) => {
  const days = differenceInCalendarDays(parseISO(iso), new Date());
  if (days <= 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  return format(parseISO(iso), 'd MMM');
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Skeleton = ({ className }) => <div className={`animate-pulse rounded-lg bg-ink/[0.07] ${className}`} />;

const occupancyWord = (percent) => (percent >= 70 ? 'Busy' : percent >= 40 ? 'Steady' : 'Quiet');

// Staff get today's work; money and homes are for the owner.
const OwnerOverview = ({ owner }) => {
  const [finances, setFinances] = useState(null);
  const [year, setYear] = useState(null);
  const [arrivals, setArrivals] = useState(null);
  const [homes, setHomes] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const empty = Promise.resolve({ data: null });
    Promise.all([
      api.get('/admin/bookings', { params: { view: 'upcoming' } }),
      owner ? api.get('/admin/listings') : empty,
      api.get('/admin/overview'),
    ])
      .then(([b, l, o]) => {
        setArrivals(b.data.bookings.slice(0, 6));
        setHomes(l.data?.listings ?? []);
        setToday(o.data);
      })
      .catch((err) => setError(errorMessageFrom(err)));
  }, [owner]);

  // Money for the chosen year (this year to begin with).
  useEffect(() => {
    if (!owner) return;
    api
      .get('/admin/finances', { params: { year: year ?? undefined } })
      .then(({ data }) => setFinances(data))
      .catch((err) => setError(errorMessageFrom(err)));
  }, [owner, year]);

  const main = finances?.currencies?.[0];
  const currency = main?.currency ?? 'KES';
  const money = (cents) => formatPrice(cents, currency);
  const refundsDue = finances?.currencies?.reduce((n, c) => n + c.refunds_due_count, 0) ?? 0;
  const noPhotos = homes?.filter((h) => h.photos.length === 0) ?? [];
  const noCategory = homes?.filter((h) => !h.category) ?? [];
  const live = homes?.filter((h) => h.status === 'published').length ?? 0;
  const months = main?.months ?? MONTHS.map((_, i) => ({ month: i + 1, received_cents: 0, refunded_cents: 0, net_cents: 0 }));
  const bestMonth = Math.max(1, ...months.map((m) => m.net_cents));
  const byHome = (main?.homes ?? []).filter((h) => h.net_cents > 0).slice(0, 4);
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

  const occupancyCard = (
    <Card
      title="Occupancy"
      kicker="Nights booked"
      action={<PillLink to="/account/calendar">Calendar</PillLink>}
      className={owner ? 'lg:col-span-4' : 'lg:col-span-6'}
    >
      {!today ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <div className="grid grow content-end gap-5">
          <div>
            <DashBar value={today.occupancy_this_month} />
            <p className="mt-3 flex items-baseline gap-2">
              <span className="tabular text-3xl font-light tracking-tight">{today.occupancy_this_month}%</span>
              <span className="text-sm text-ink/55">this month · {occupancyWord(today.occupancy_this_month)}</span>
            </p>
          </div>
          <div>
            <DashBar value={today.occupancy_next_30_days} color="rgb(var(--ink))" />
            <p className="mt-3 flex items-baseline gap-2">
              <span className="tabular text-3xl font-light tracking-tight">{today.occupancy_next_30_days}%</span>
              <span className="text-sm text-ink/55">next 30 days · {occupancyWord(today.occupancy_next_30_days)}</span>
            </p>
          </div>
        </div>
      )}
    </Card>
  );

  const todayCard = (
    <Card title="Today" kicker={format(new Date(), 'EEEE d MMMM')} className={owner ? '' : 'lg:col-span-4'}>
      {!today ? (
        <Skeleton className="h-28 w-full" />
      ) : (
        <dl className="grid grow grid-cols-3 content-end gap-3">
          {[
            { label: 'Arriving', value: today.arrivals_today.length, names: today.arrivals_today },
            { label: 'Leaving', value: today.departures_today.length, names: today.departures_today },
            { label: 'Staying now', value: today.in_house },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-ink/[0.03] p-3">
              <dt className="text-xs text-ink/55">{item.label}</dt>
              <dd className="tabular mt-1 text-3xl font-light tracking-tight">{item.value}</dd>
              {item.names?.length > 0 && (
                <dd className="mt-0.5 truncate text-xs text-ink/55">{item.names.map((a) => a.guest_name).join(', ')}</dd>
              )}
            </div>
          ))}
        </dl>
      )}
    </Card>
  );

  return (
    <div className="pb-16">
      <AccountNav
        description={
          owner
            ? `Here is how your homes are doing in ${finances?.year ?? new Date().getFullYear()}.`
            : "Today's arrivals, departures and what needs answering."
        }
        actions={
          owner && (
            <div className="flex flex-wrap gap-2">
              <Link to="/account/reservations/new" className={buttonVariants({ variant: 'outline' })}>
                <Plus aria-hidden className="size-4" />
                New booking
              </Link>
              <Link to="/account/places/new" className={buttonVariants()}>
                <Plus aria-hidden className="size-4" />
                Add a home
              </Link>
            </div>
          )
        }
      />

      {error && (
        <p role="alert" className="mx-4 mb-6 rounded-2xl border border-red-700/30 bg-red-50 p-4 text-sm text-red-900">
          {error}
        </p>
      )}

      <div className="mx-4 grid gap-4 lg:grid-cols-12">
        {owner && (
          <Card
            title="Money by home"
            kicker={`Received in ${finances?.year ?? ''}, after refunds`}
            action={
              main && (
                <span className="grid size-[76px] shrink-0 -rotate-6 content-center place-items-center gap-1 rounded-full bg-brand text-center text-sand shadow-[0_6px_16px_rgb(var(--brand)/0.35)]">
                  <span className="text-[10px] leading-none opacity-80">Total</span>
                  <span className="tabular text-xs font-semibold leading-none">{formatPriceCompact(main.net_cents, currency)}</span>
                </span>
              )
            }
            className="lg:col-span-4"
          >
            {!finances ? (
              <Skeleton className="h-28 w-full" />
            ) : byHome.length ? (
              <ShareBars items={byHome.map((h) => ({ label: h.title, value: h.net_cents }))} format={money} />
            ) : (
              <p className="text-sm text-ink/55">No payments yet this year. Each home's share shows here once guests pay.</p>
            )}
            <PillLink to="/account/transactions" className="mt-4 self-start">
              Transactions
            </PillLink>
          </Card>
        )}

        {occupancyCard}

        {owner && (
          <Card title="Received this year" kicker="Payments in, refunds out" className="lg:col-span-4">
            {!finances ? (
              <Skeleton className="h-28 w-full" />
            ) : (
              <div className="grid grow content-end gap-4">
                <p className="tabular text-4xl font-light tracking-tight">{money(main?.net_cents ?? 0)}</p>
                <div aria-hidden className="flex gap-1">
                  {months.map((m) => (
                    <span
                      key={m.month}
                      title={`${MONTHS[m.month - 1]}: ${money(m.net_cents)}`}
                      className="h-3 flex-1 rounded-full"
                      style={{ background: m.net_cents > 0 ? `rgb(var(--brand) / ${0.2 + 0.8 * (m.net_cents / bestMonth)})` : 'rgb(var(--ink) / 0.07)' }}
                    />
                  ))}
                </div>
                <p className="text-xs text-ink/55">
                  <span className="font-medium text-emerald-600">{main?.payments_count ?? 0} payments</span> · {money(main?.booked_ahead_cents ?? 0)} booked ahead
                </p>
              </div>
            )}
          </Card>
        )}

        {owner && (
          <Card
            title="Money flow"
            kicker="Received and refunded, by month"
            action={
              finances?.years?.length > 1 && (
                <Toggle
                  label="Year"
                  value={finances.year}
                  onChange={setYear}
                  options={finances.years.slice(0, 3).map((y) => ({ value: y, label: String(y) }))}
                />
              )
            }
            className="lg:col-span-8"
          >
            <Legend
              items={[
                { label: 'Received', color: '#22A75E' },
                { label: 'Refunded', color: 'rgb(var(--brand))' },
              ]}
            />
            {!finances ? (
              <Skeleton className="mt-4 h-52 w-full" />
            ) : (
              <LineChart
                ariaLabel={`Money received and refunded each month of ${finances.year}`}
                labels={MONTHS}
                bars={months.map((m) => Math.max(0, m.net_cents))}
                series={[
                  { label: 'Received', color: '#22A75E', values: months.map((m) => m.received_cents) },
                  { label: 'Refunded', color: 'rgb(var(--brand))', values: months.map((m) => m.refunded_cents) },
                ]}
                format={(v) => formatPriceCompact(v, currency)}
              />
            )}
          </Card>
        )}

        <Card
          title="Needs your attention"
          kicker="To do"
          action={
            todos.length > 0 && (
              <span className="tabular grid size-9 place-items-center rounded-full bg-brand text-sm font-semibold text-sand">{todos.length}</span>
            )
          }
          className={owner ? 'lg:col-span-4' : 'lg:col-span-6'}
        >
          {today && (homes || !owner) && todos.length === 0 && (
            <p className="text-sm text-ink/55">
              {owner
                ? 'Nothing right now. Requests, unread messages, refunds owed and homes missing photos show up here.'
                : 'Nothing right now. Requests and unread messages show up here.'}
            </p>
          )}
          {todos.length > 0 && (
            <ul className="grid gap-2">
              {todos.map((todo) => (
                <li key={todo.text}>
                  <Link
                    to={todo.to}
                    className="flex min-h-12 items-center gap-3 rounded-2xl bg-ink/[0.03] px-4 py-3 text-sm transition-colors hover:bg-ink/[0.06]"
                  >
                    <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                      <AlertCircle className="size-4" />
                    </span>
                    <span className="grow">{todo.text}</span>
                    <ChevronRight aria-hidden className="size-4 shrink-0 text-ink/40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Next arrivals"
          kicker="Upcoming stays"
          action={<PillLink to="/account/reservations">All bookings</PillLink>}
          className="lg:col-span-8"
        >
          {!arrivals && !error ? (
            <div className="grid gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : arrivals?.length ? (
            <ul className="divide-y divide-ink/[0.06]">
              {arrivals.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/account/reservations/${b.id}`}
                    className="-mx-2 grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl px-2 py-3 transition-colors hover:bg-ink/[0.03]"
                  >
                    <span className="w-fit rounded-full bg-ink/[0.05] px-2.5 py-1 text-xs font-medium">{whenLabel(b.check_in)}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{b.guest.name}</span>
                      <span className="block truncate text-xs text-ink/55">
                        {b.listing.title}, {b.nights} {b.nights === 1 ? 'night' : 'nights'}
                      </span>
                    </span>
                    <span className="tabular text-sm">
                      {owner ? formatPrice(b.total_cents, b.currency) : `${b.guests_count} ${b.guests_count === 1 ? 'guest' : 'guests'}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/55">No upcoming stays. New bookings show up here as soon as guests book.</p>
          )}
        </Card>

        {owner ? (
          <div className="grid content-start gap-4 lg:col-span-4">
            {todayCard}
            <Card title="At a glance" kicker="Right now">
              <dl className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Booked ahead', value: money(main?.booked_ahead_cents ?? 0), note: `${main?.booked_ahead_count ?? 0} confirmed stays`, to: '/account/reservations', icon: CalendarCheck },
                  { label: 'Refunds due', value: money(main?.refunds_due_cents ?? 0), note: refundsDue ? `${refundsDue} to pay back` : 'Nothing owed', to: '/account/reservations?view=refunds', icon: Undo2 },
                  { label: 'Homes', value: homes?.length ?? 0, note: `${live} listed for guests`, to: '/account/places', icon: House },
                  { label: 'Payments', value: main?.payments_count ?? 0, note: `in ${finances?.year ?? ''}`, to: '/account/transactions', icon: Wallet },
                ].map(({ icon: Icon, ...item }) => (
                  <Link key={item.label} to={item.to} className="group rounded-2xl bg-ink/[0.03] p-4 transition-colors hover:bg-ink/[0.06]">
                    <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-brand/10 text-brand">
                      <Icon className="size-4" />
                    </span>
                    <dt className="mt-3 text-xs text-ink/55">{item.label}</dt>
                    <dd className="tabular mt-0.5 truncate text-xl font-light tracking-tight">{finances || homes ? item.value : '…'}</dd>
                    <dd className="truncate text-xs text-ink/50">{item.note}</dd>
                  </Link>
                ))}
              </dl>
            </Card>
          </div>
        ) : (
          todayCard
        )}
      </div>
    </div>
  );
};

// /account: the owner's overview, or the guest's.
const AccountHome = () => {
  const { user } = useAuth();
  return isTeam(user) ? <OwnerOverview owner={isOwner(user)} /> : <GuestOverview />;
};

export default AccountHome;
