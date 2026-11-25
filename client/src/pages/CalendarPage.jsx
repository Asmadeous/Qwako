import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  eachDayOfInterval,
  format,
  isToday,
  isWeekend,
  max,
  min,
  parseISO,
} from 'date-fns';
import { toast } from 'react-toastify';
import {
  ArrowUpRight,
  Ban,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Home,
  Hourglass,
  Moon,
  Plus,
} from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Card } from '@/components/ui/DashCards';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDate, toISODate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import { cn } from '@/lib/utils';
import { isOwner } from '@/utils/roles';
import { useAuth } from '../../hooks';

// Splits a home's month into runs of free nights, stays and blocks.
const segmentsFor = (home, days) => {
  const iso = days.map(toISODate);
  const itemOn = (day) =>
    home.bookings.find((b) => b.check_in <= day && day < b.check_out) ??
    home.blocks.find((b) => b.starts_on <= day && day < b.ends_on);
  const segments = [];
  iso.forEach((day, i) => {
    const item = itemOn(day) ?? null;
    const last = segments[segments.length - 1];
    if (item && last?.item === item) last.span += 1;
    else segments.push({ item, day, index: i, span: 1 });
  });
  return segments;
};

const STAY_STYLE = {
  confirmed: 'bg-ink text-sand hover:bg-ink/85',
  requested:
    'border-2 border-dashed border-ink/70 bg-paper text-ink hover:border-ink',
  pending_payment: 'bg-ink/20 text-ink hover:bg-ink/30',
};

const STATUS_LABEL = {
  confirmed: 'Booked',
  requested: 'Waiting for you',
  pending_payment: 'Awaiting payment',
};

const HATCH =
  'bg-[repeating-linear-gradient(45deg,rgb(var(--ink)/0.14)_0_4px,transparent_4px_8px)]';

// Nights of a stay or block that fall inside the month.
const nightsIn = (from, to, first, end) =>
  Math.max(
    0,
    differenceInCalendarDays(
      min([parseISO(to), end]),
      max([parseISO(from), first]),
    ),
  );

const Stat = ({ icon: Icon, label, value, note }) => (
  <div className="flex items-center gap-4 rounded-[28px] bg-paper p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink/[0.06]">
      <Icon aria-hidden strokeWidth={1.5} className="size-5" />
    </span>
    <div className="min-w-0">
      <p className="text-sm text-ink/55">{label}</p>
      <p className="tabular text-2xl font-light leading-tight tracking-tight">
        {value}
      </p>
      {note && <p className="truncate text-xs text-ink/45">{note}</p>}
    </div>
  </div>
);

// The owner's month across every home: who's staying, what's blocked, what's free.
// Pick a first and last free night on a home to block them.
const CalendarPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const month = /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '')
    ? searchParams.get('month')
    : format(new Date(), 'yyyy-MM');
  const { data, error, loading, reload } = useFetch('/admin/calendar', {
    month,
  });
  const [pick, setPick] = useState(null); // { home, from, to? }
  const [reason, setReason] = useState('');
  const [unblock, setUnblock] = useState(null); // { home, block, from, to, reason }
  const [confirmReopen, setConfirmReopen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const first = parseISO(`${month}-01`);
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: first,
        end: addDays(addMonths(first, 1), -1),
      }),
    [month],
  );
  const go = (delta) =>
    setSearchParams({ month: format(addMonths(first, delta), 'yyyy-MM') });

  const choose = (home, day) => {
    if (!pick || pick.home.id !== home.id || pick.to)
      return setPick({ home, from: day });
    const [from, to] = day < pick.from ? [day, pick.from] : [pick.from, day];
    setActionError('');
    setReason('');
    setPick({ home, from, to });
  };

  const saveBlock = async () => {
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/admin/listings/${pick.home.id}/blocks`, {
        starts_on: pick.from,
        ends_on: toISODate(addDays(parseISO(pick.to), 1)),
        reason,
      });
      toast.success(`Blocked ${pick.home.title}.`);
      setPick(null);
      reload();
    } catch (err) {
      const details = err?.response?.data?.error?.details;
      setActionError(
        details
          ? Object.values(details).flat().join(' ')
          : errorMessageFrom(err),
      );
    } finally {
      setBusy(false);
    }
  };

  const openBlock = (home, block) => {
    setActionError('');
    setConfirmReopen(false);
    setUnblock({
      home,
      block,
      from: block.starts_on,
      to: toISODate(addDays(parseISO(block.ends_on), -1)),
      reason: block.reason ?? '',
    });
  };

  const updateBlock = async (e) => {
    e.preventDefault();
    setBusy(true);
    setActionError('');
    try {
      await api.patch(`/admin/blocks/${unblock.block.id}`, {
        starts_on: unblock.from,
        ends_on: toISODate(addDays(parseISO(unblock.to), 1)),
        reason: unblock.reason,
      });
      toast.success('Blocked nights changed.');
      setUnblock(null);
      reload();
    } catch (err) {
      const details = err?.response?.data?.error?.details;
      setActionError(
        details
          ? Object.values(details).flat().join(' ')
          : errorMessageFrom(err),
      );
    } finally {
      setBusy(false);
    }
  };

  const removeBlock = async () => {
    setBusy(true);
    setActionError('');
    try {
      await api.delete(`/admin/blocks/${unblock.block.id}`);
      toast.success('Those nights are open again.');
      setUnblock(null);
      reload();
    } catch (err) {
      setActionError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const inPick = (home, day) =>
    pick?.home.id === home.id &&
    (pick.to ? pick.from <= day && day <= pick.to : pick.from === day);

  const end = addMonths(first, 1);
  const homes = data?.homes ?? [];
  const stays = homes
    .flatMap((home) => home.bookings.map((booking) => ({ ...booking, home })))
    .sort((a, b) => a.check_in.localeCompare(b.check_in));
  const blocks = homes
    .flatMap((home) => home.blocks.map((block) => ({ ...block, home })))
    .sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const bookedNights = stays.reduce(
    (n, b) => n + nightsIn(b.check_in, b.check_out, first, end),
    0,
  );
  const blockedNights = blocks.reduce(
    (n, b) => n + nightsIn(b.starts_on, b.ends_on, first, end),
    0,
  );
  const arrivals = stays.filter(
    (b) => b.check_in >= toISODate(first) && b.check_in < toISODate(end),
  ).length;
  const waiting = stays.filter((b) => b.status === 'requested').length;
  const today = toISODate(new Date());
  const thisMonth = month === format(new Date(), 'yyyy-MM');

  return (
    <div className="pb-16">
      <AccountNav description="Every home for the month. Tap a stay to open it; tap two free nights to block them; tap a block to change or reopen it." />

      {loading && !data && <ListSkeleton rows={6} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data && (
        <div className="mx-4 grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              icon={Moon}
              label="Nights booked"
              value={bookedNights}
              note={`across ${homes.length} ${homes.length === 1 ? 'home' : 'homes'}`}
            />
            <Stat
              icon={CalendarCheck}
              label="Arrivals"
              value={arrivals}
              note={`in ${format(first, 'MMMM')}`}
            />
            <Stat
              icon={Hourglass}
              label="Waiting for you"
              value={waiting}
              note={waiting ? 'requests to answer' : 'nothing to answer'}
            />
            <Stat
              icon={Ban}
              label="Blocked nights"
              value={blockedNights}
              note="closed to guests"
            />
          </div>

          <Card
            title={
              <span
                className="text-2xl font-normal tracking-[-0.03em]"
                aria-live="polite"
              >
                {format(first, 'MMMM yyyy')}
              </span>
            }
            kicker="Tap a free night to start blocking"
            className="min-w-0"
            action={
              <div className="flex items-center gap-1.5">
                {!thisMonth && (
                  <button
                    type="button"
                    onClick={() => setSearchParams({})}
                    className="min-h-10 rounded-full bg-ink/[0.05] px-4 text-sm font-medium transition-colors hover:bg-ink/10"
                  >
                    Today
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => go(-1)}
                  aria-label="Previous month"
                  className="grid size-10 place-items-center rounded-full bg-ink/[0.05] transition-colors hover:bg-ink/10"
                >
                  <ChevronLeft aria-hidden className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => go(1)}
                  aria-label="Next month"
                  className="grid size-10 place-items-center rounded-full bg-ink/[0.05] transition-colors hover:bg-ink/10"
                >
                  <ChevronRight aria-hidden className="size-4" />
                </button>
              </div>
            }
          >
            <ul
              aria-label="Key"
              className="mb-4 flex flex-wrap gap-2 text-xs text-ink/70"
            >
              <li className="flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5">
                <span className="size-2.5 rounded-full bg-ink" /> Booked
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5">
                <span className="size-2.5 rounded-full border-[1.5px] border-dashed border-ink" />{' '}
                Waiting for you
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5">
                <span className="size-2.5 rounded-full bg-ink/25" /> Awaiting
                payment
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5">
                <span className={cn('size-2.5 rounded-full', HATCH)} /> Blocked
              </li>
              <li className="flex items-center gap-1.5 rounded-full bg-ink/[0.04] px-3 py-1.5">
                <span className="size-2.5 rounded-full bg-ink/[0.07]" /> Free
              </li>
            </ul>

            {pick && !pick.to && (
              <p
                role="status"
                className="mb-3 flex flex-wrap items-center gap-x-2 rounded-2xl bg-ink px-4 py-2.5 text-sm text-sand"
              >
                {pick.home.title}: first night {formatDate(pick.from)}. Now tap
                the last night to block.
                <button
                  type="button"
                  onClick={() => setPick(null)}
                  className="font-semibold underline underline-offset-4"
                >
                  Cancel
                </button>
              </p>
            )}

            <div className="-mx-5 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
              <table className="w-full min-w-[60rem] table-fixed border-separate border-spacing-y-1.5 text-xs">
                <colgroup>
                  <col className="w-52" />
                  {days.map((d) => (
                    <col key={d.toISOString()} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="sticky left-0 z-10 bg-paper pb-1 text-left text-xs font-medium text-ink/55"
                    >
                      Home
                    </th>
                    {days.map((d) => (
                      <th
                        key={d.toISOString()}
                        scope="col"
                        className="px-0 pb-1 text-center font-normal"
                      >
                        <span
                          className={cn(
                            'block text-[10px] uppercase',
                            isWeekend(d) ? 'text-ink/70' : 'text-ink/40',
                          )}
                        >
                          {format(d, 'EEEEE')}
                        </span>
                        <span
                          className={cn(
                            'tabular mx-auto mt-0.5 grid size-6 place-items-center rounded-full text-xs',
                            isToday(d)
                              ? 'bg-ink font-semibold text-sand'
                              : 'text-ink/80',
                          )}
                        >
                          {format(d, 'd')}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {homes.map((home) => (
                    <tr key={home.id}>
                      <th
                        scope="row"
                        className="sticky left-0 z-10 bg-paper py-0 pr-3 text-left font-normal"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink/[0.06]">
                            <Home
                              aria-hidden
                              strokeWidth={1.5}
                              className="size-4"
                            />
                          </span>
                          <span className="min-w-0">
                            {isOwner(user) ? (
                              <Link
                                to={`/account/places/${home.id}`}
                                className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                              >
                                {home.title}
                              </Link>
                            ) : (
                              <span className="line-clamp-2 text-sm font-medium leading-snug">
                                {home.title}
                              </span>
                            )}
                            {home.status !== 'published' && (
                              <span className="block text-[11px] text-ink/50">
                                Hidden
                              </span>
                            )}
                          </span>
                        </div>
                      </th>
                      {segmentsFor(home, days).map((seg) => {
                        if (!seg.item) {
                          return Array.from({ length: seg.span }, (_, k) => {
                            const d = days[seg.index + k];
                            const day = toISODate(d);
                            const past = day < today;
                            const picked = inPick(home, day);
                            return (
                              <td key={day} className="h-14 p-0 px-px">
                                <button
                                  type="button"
                                  disabled={past}
                                  onClick={() => choose(home, day)}
                                  aria-label={`${home.title}, ${formatDate(day)}, free`}
                                  aria-pressed={picked}
                                  className={cn(
                                    'group grid size-full place-items-center rounded-xl transition-colors disabled:cursor-default',
                                    past
                                      ? 'bg-transparent'
                                      : isWeekend(d)
                                        ? 'bg-ink/[0.06] hover:bg-ink/15'
                                        : 'bg-ink/[0.035] hover:bg-ink/15',
                                    day === today &&
                                      'ring-1 ring-inset ring-ink/40',
                                    picked &&
                                      'bg-ink/25 ring-1 ring-inset ring-ink hover:bg-ink/25',
                                  )}
                                >
                                  {past ? (
                                    <span
                                      aria-hidden
                                      className="size-1 rounded-full bg-ink/15"
                                    />
                                  ) : (
                                    <Plus
                                      aria-hidden
                                      className={cn(
                                        'size-3.5 text-ink/60 opacity-0 transition-opacity group-hover:opacity-100',
                                        picked && 'opacity-100',
                                      )}
                                    />
                                  )}
                                </button>
                              </td>
                            );
                          });
                        }
                        const { item } = seg;
                        if (item.guest_name) {
                          const nights = differenceInCalendarDays(
                            parseISO(item.check_out),
                            parseISO(item.check_in),
                          );
                          return (
                            <td
                              key={seg.day}
                              colSpan={seg.span}
                              className="h-14 p-0 px-px"
                            >
                              <Link
                                to={`/account/reservations/${item.id}`}
                                title={`${item.guest_name}, ${formatDate(item.check_in)} to ${formatDate(item.check_out)}`}
                                className={cn(
                                  'flex size-full flex-col justify-center overflow-hidden rounded-xl px-2.5 transition-colors',
                                  STAY_STYLE[item.status],
                                )}
                              >
                                <span className="truncate font-medium">
                                  {item.guest_name}
                                </span>
                                {seg.span > 1 && (
                                  <span className="truncate text-[10px] opacity-70">
                                    {nights} {nights === 1 ? 'night' : 'nights'}
                                  </span>
                                )}
                              </Link>
                            </td>
                          );
                        }
                        return (
                          <td
                            key={seg.day}
                            colSpan={seg.span}
                            className="h-14 p-0 px-px"
                          >
                            <button
                              type="button"
                              onClick={() => openBlock(home, item)}
                              title={item.reason || 'Blocked'}
                              aria-label={`${home.title}, blocked ${formatDate(item.starts_on)} to ${formatDate(addDays(parseISO(item.ends_on), -1))}${item.reason ? `: ${item.reason}` : ''}. Change or reopen`}
                              className={cn(
                                'flex size-full items-center overflow-hidden rounded-xl px-2.5 text-left font-medium text-ink/80 ring-inset hover:ring-1 hover:ring-ink/40',
                                HATCH,
                              )}
                            >
                              <span className="truncate">
                                {item.reason || 'Blocked'}
                              </span>
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
            <Card
              title="Stays this month"
              kicker={`${stays.length} ${stays.length === 1 ? 'stay' : 'stays'} in ${format(first, 'MMMM')}`}
              className="lg:col-span-8"
            >
              {stays.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink/55">
                  No stays this month.
                </p>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {stays.map((stay) => {
                    const nights = differenceInCalendarDays(
                      parseISO(stay.check_out),
                      parseISO(stay.check_in),
                    );
                    return (
                      <li key={stay.id}>
                        <Link
                          to={`/account/reservations/${stay.id}`}
                          className="group flex items-center gap-4 py-3"
                        >
                          <span className="grid w-12 shrink-0 place-items-center rounded-2xl bg-ink/[0.05] py-1.5 text-center leading-tight">
                            <span className="text-[10px] uppercase text-ink/50">
                              {format(parseISO(stay.check_in), 'MMM')}
                            </span>
                            <span className="tabular text-lg">
                              {format(parseISO(stay.check_in), 'd')}
                            </span>
                          </span>
                          <span className="min-w-0 grow">
                            <span className="block truncate text-sm font-medium">
                              {stay.guest_name}
                            </span>
                            <span className="block truncate text-xs text-ink/55">
                              {stay.home.title} · {nights}{' '}
                              {nights === 1 ? 'night' : 'nights'}
                              {stay.guests_count
                                ? ` · ${stay.guests_count} ${stay.guests_count === 1 ? 'guest' : 'guests'}`
                                : ''}
                            </span>
                          </span>
                          <span
                            className={cn(
                              'shrink-0 rounded-full px-2.5 py-1 text-xs',
                              stay.status === 'confirmed' && 'bg-ink text-sand',
                              stay.status === 'requested' &&
                                'border border-dashed border-ink/60',
                              stay.status === 'pending_payment' && 'bg-ink/15',
                            )}
                          >
                            {STATUS_LABEL[stay.status] ?? stay.status}
                          </span>
                          <ArrowUpRight
                            aria-hidden
                            className="size-4 shrink-0 text-ink/40 transition-colors group-hover:text-ink"
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card
              title="Blocked nights"
              kicker="Closed to guests"
              className="lg:col-span-4"
            >
              {blocks.length === 0 ? (
                <p className="py-6 text-center text-sm text-ink/55">
                  Nothing blocked this month.
                </p>
              ) : (
                <ul className="grid gap-2">
                  {blocks.map((block) => (
                    <li key={block.id}>
                      <button
                        type="button"
                        onClick={() => openBlock(block.home, block)}
                        className="flex w-full items-center gap-3 rounded-2xl bg-ink/[0.04] p-3 text-left transition-colors hover:bg-ink/[0.08]"
                      >
                        <span
                          className={cn('size-9 shrink-0 rounded-xl', HATCH)}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {block.reason || 'Blocked'}
                          </span>
                          <span className="block truncate text-xs text-ink/55">
                            {block.home.title} · {formatDate(block.starts_on)}{' '}
                            to{' '}
                            {formatDate(addDays(parseISO(block.ends_on), -1))}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pick?.to)}
        onOpenChange={(open) => !open && setPick(null)}
        title={`Block ${pick?.home.title ?? ''}?`}
        confirmLabel="Block these nights"
        busyLabel="Blocking..."
        busy={busy}
        error={actionError}
        onConfirm={saveBlock}
      >
        <p>
          Nights of {pick && formatDate(pick.from)} to{' '}
          {pick?.to && formatDate(pick.to)}. Guests can't book them until you
          reopen them.
        </p>
        <label className="mt-1 grid gap-1.5">
          <span className="font-medium text-ink">
            Note for yourself (optional)
          </span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
            placeholder="Repairs, own use..."
            className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </label>
      </ConfirmDialog>

      <Dialog
        open={Boolean(unblock)}
        onOpenChange={(next) => !busy && !next && setUnblock(null)}
      >
        <DialogContent className="max-w-md">
          {unblock && (
            <form onSubmit={updateBlock} className="grid gap-4">
              <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">
                Blocked: {unblock.home.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-ink/70">
                Change the nights or the note, or reopen them so guests can
                book.
              </DialogDescription>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-medium">
                  First night
                  <input
                    type="date"
                    required
                    value={unblock.from}
                    onChange={(e) =>
                      setUnblock({ ...unblock, from: e.target.value })
                    }
                    className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-medium">
                  Last night
                  <input
                    type="date"
                    required
                    min={unblock.from}
                    value={unblock.to}
                    onChange={(e) =>
                      setUnblock({ ...unblock, to: e.target.value })
                    }
                    className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none"
                  />
                </label>
              </div>
              <label className="grid gap-1.5 text-sm font-medium">
                Note for yourself (optional)
                <input
                  value={unblock.reason}
                  onChange={(e) =>
                    setUnblock({ ...unblock, reason: e.target.value })
                  }
                  maxLength={120}
                  className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none"
                />
              </label>
              {confirmReopen && (
                <p className="rounded-xl bg-ink/[0.05] p-3 text-sm">
                  Reopen {formatDate(unblock.block.starts_on)} to{' '}
                  {formatDate(addDays(parseISO(unblock.block.ends_on), -1))}?
                  Guests can book them again.
                </p>
              )}
              {actionError && (
                <p role="alert" className="text-sm font-semibold text-red-800">
                  {actionError}
                </p>
              )}
              <DialogFooter className="gap-2 sm:justify-between">
                {confirmReopen ? (
                  <Button
                    variant="danger-outline"
                    onClick={removeBlock}
                    disabled={busy}
                  >
                    {busy ? 'Reopening...' : 'Yes, reopen for booking'}
                  </Button>
                ) : (
                  <Button
                    variant="danger-outline"
                    onClick={() => setConfirmReopen(true)}
                    disabled={busy}
                  >
                    Reopen for booking
                  </Button>
                )}
                <Button type="submit" disabled={busy}>
                  {busy && !confirmReopen ? 'Saving...' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarPage;
