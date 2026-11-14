import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { addDays, addMonths, eachDayOfInterval, format, isToday, isWeekend, parseISO } from 'date-fns';
import { toast } from 'react-toastify';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDate, toISODate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import { cn } from '@/lib/utils';

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
  requested: 'border-2 border-dashed border-ink bg-sand text-ink',
  pending_payment: 'bg-ink/25 text-ink',
};

// The owner's month across every home: who's staying, what's blocked, what's free.
// Pick a first and last free night on a home to block them.
const CalendarPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const month = /^\d{4}-\d{2}$/.test(searchParams.get('month') ?? '') ? searchParams.get('month') : format(new Date(), 'yyyy-MM');
  const { data, error, loading, reload } = useFetch('/admin/calendar', { month });
  const [pick, setPick] = useState(null); // { home, from, to? }
  const [reason, setReason] = useState('');
  const [unblock, setUnblock] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const first = parseISO(`${month}-01`);
  const days = useMemo(() => eachDayOfInterval({ start: first, end: addDays(addMonths(first, 1), -1) }), [month]);
  const go = (delta) => setSearchParams({ month: format(addMonths(first, delta), 'yyyy-MM') });

  const choose = (home, day) => {
    if (!pick || pick.home.id !== home.id || pick.to) return setPick({ home, from: day });
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
      setActionError(details ? Object.values(details).flat().join(' ') : errorMessageFrom(err));
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
    pick?.home.id === home.id && (pick.to ? pick.from <= day && day <= pick.to : pick.from === day);

  return (
    <div className="pb-16">
      <AccountNav description="Every home for the month. Tap a stay to open it; tap two free nights to block them." />

      <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" className="w-11 px-0" onClick={() => go(-1)} aria-label="Previous month">
            <ChevronLeft aria-hidden className="size-4" />
          </Button>
          <h2 className="min-w-40 text-center text-xl font-bold tracking-tight" aria-live="polite">
            {format(first, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" className="w-11 px-0" onClick={() => go(1)} aria-label="Next month">
            <ChevronRight aria-hidden className="size-4" />
          </Button>
          {month !== format(new Date(), 'yyyy-MM') && (
            <Button variant="outline" onClick={() => setSearchParams({})}>
              Today
            </Button>
          )}
        </div>
        <ul aria-label="Key" className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/75">
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-ink/20 bg-paper" /> Free</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-ink" /> Booked</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm border-2 border-dashed border-ink" /> Waiting for you</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-ink/25" /> Awaiting payment</li>
          <li className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-[repeating-linear-gradient(45deg,#2A272533_0_3px,transparent_3px_6px)]" /> Blocked</li>
        </ul>
      </div>

      {pick && !pick.to && (
        <p role="status" className="mx-4 mb-3 rounded-xl bg-ink px-4 py-2.5 text-sm text-sand">
          {pick.home.title}: first night {formatDate(pick.from)}. Now tap the last night to block.{' '}
          <button type="button" onClick={() => setPick(null)} className="font-semibold underline underline-offset-4">
            Cancel
          </button>
        </p>
      )}

      {loading && !data && <ListSkeleton rows={6} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data && (
        <div className="mx-4 overflow-x-auto rounded-2xl border border-ink/15 bg-paper">
          <table className="border-collapse text-xs">
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 min-w-40 bg-paper px-3 py-2 text-left font-semibold">
                  Home
                </th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    scope="col"
                    className={cn('w-11 min-w-11 px-0 py-2 text-center font-medium', isWeekend(d) && 'bg-ink/[0.04]', isToday(d) && 'text-red-800')}
                  >
                    <span className="block text-[10px] text-ink/55">{format(d, 'EEEEE')}</span>
                    <span className="tabular">{format(d, 'd')}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.homes.map((home) => (
                <tr key={home.id} className="border-t border-ink/10">
                  <th scope="row" className="sticky left-0 z-10 max-w-48 truncate bg-paper px-3 py-1 text-left text-sm font-medium">
                    <Link to={`/account/places/${home.id}`} className="hover:underline">
                      {home.title}
                    </Link>
                    {home.status !== 'published' && <span className="block text-[11px] font-normal text-ink/55">Hidden</span>}
                  </th>
                  {segmentsFor(home, days).map((seg) => {
                    if (!seg.item) {
                      return Array.from({ length: seg.span }, (_, k) => {
                        const day = toISODate(days[seg.index + k]);
                        const past = day < toISODate(new Date());
                        return (
                          <td key={day} className="h-12 p-0.5">
                            <button
                              type="button"
                              disabled={past}
                              onClick={() => choose(home, day)}
                              aria-label={`${home.title}, ${formatDate(day)}, free`}
                              aria-pressed={inPick(home, day)}
                              className={cn(
                                'size-full min-h-11 rounded-md border border-ink/10 transition-colors hover:border-ink/50 disabled:cursor-default disabled:opacity-40 disabled:hover:border-ink/10',
                                inPick(home, day) && 'border-ink bg-ink/15',
                              )}
                            />
                          </td>
                        );
                      });
                    }
                    const { item } = seg;
                    if (item.guest_name) {
                      return (
                        <td key={seg.day} colSpan={seg.span} className="h-12 p-0.5">
                          <Link
                            to={`/account/reservations/${item.id}`}
                            title={`${item.guest_name}, ${formatDate(item.check_in)} to ${formatDate(item.check_out)}`}
                            className={cn('flex size-full min-h-11 items-center truncate rounded-md px-2 font-medium', STAY_STYLE[item.status])}
                          >
                            <span className="truncate">{item.guest_name}</span>
                          </Link>
                        </td>
                      );
                    }
                    return (
                      <td key={seg.day} colSpan={seg.span} className="h-12 p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setActionError('');
                            setUnblock({ home, block: item });
                          }}
                          title={item.reason || 'Blocked'}
                          aria-label={`${home.title}, blocked ${formatDate(item.starts_on)} to ${formatDate(addDays(parseISO(item.ends_on), -1))}${item.reason ? `: ${item.reason}` : ''}. Reopen`}
                          className="flex size-full min-h-11 items-center truncate rounded-md bg-[repeating-linear-gradient(45deg,#2A272522_0_4px,transparent_4px_8px)] px-2 text-left font-medium text-ink/80 hover:ring-1 hover:ring-ink/40"
                        >
                          <span className="truncate">{item.reason || 'Blocked'}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
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
          Nights of {pick && formatDate(pick.from)} to {pick?.to && formatDate(pick.to)}. Guests can't book them until you
          reopen them.
        </p>
        <label className="mt-1 grid gap-1.5">
          <span className="font-medium text-ink">Note for yourself (optional)</span>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
            placeholder="Repairs, own use..."
            className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm text-ink focus:border-ink focus:outline-none"
          />
        </label>
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(unblock)}
        onOpenChange={(open) => !open && setUnblock(null)}
        title="Reopen these nights?"
        confirmLabel="Reopen for booking"
        busyLabel="Reopening..."
        busy={busy}
        error={actionError}
        onConfirm={removeBlock}
      >
        <p>
          {unblock?.home.title}: {unblock && formatDate(unblock.block.starts_on)} to{' '}
          {unblock && formatDate(addDays(parseISO(unblock.block.ends_on), -1))}
          {unblock?.block.reason && ` (${unblock.block.reason})`}. Guests can book them again.
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default CalendarPage;
