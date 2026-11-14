import { useMemo, useState } from 'react';
import { addDays, format, isSameDay, parseISO, startOfToday } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const day = (date) => format(date, 'EEE d MMM yyyy');

// Booked or blocked stays come as [{ from, to }] with `to` the check-out day,
// so that day is still free to arrive on.
const toNights = (unavailable = []) =>
  unavailable.map(({ from, to }) => ({ from: parseISO(from), to: addDays(parseISO(to), -1) }));

// Controlled range picker: the booking form owns the dates. Taken nights are
// greyed out; once check-in is picked, check-out can be any day up to the next
// taken night, including the day another guest arrives.
export default function DatePickerWithRange({ id, value, onChange, className, invalid, unavailable, placeholder }) {
  const [open, setOpen] = useState(false);
  const taken = useMemo(() => toNights(unavailable), [unavailable]);

  const disabled = useMemo(() => {
    const today = startOfToday();
    if (value?.from && !value?.to) {
      const nextTaken = taken.map((r) => r.from).filter((d) => d > value.from).sort((a, b) => a - b)[0];
      return [{ before: value.from }, ...(nextTaken ? [{ after: nextTaken }] : [])];
    }
    return [{ before: today }, ...taken];
  }, [taken, value?.from, value?.to]);

  // A click after a full range starts a new stay rather than stretching the old
  // one; a full range closes the calendar.
  const handleSelect = (range, clickedDay) => {
    if (value?.from && value?.to) return onChange({ from: clickedDay, to: undefined });
    const next = range ?? { from: undefined, to: undefined };
    if (next.from && next.to && isSameDay(next.from, next.to)) return onChange({ from: next.from, to: undefined });
    onChange(next);
    if (next.from && next.to) setOpen(false);
  };

  let label = placeholder || 'Choose your dates';
  if (value?.from && value?.to) label = `${day(value.from)} to ${day(value.to)}`;
  else if (value?.from) label = `${day(value.from)}, now pick check-out`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-invalid={invalid ? 'true' : undefined}
          className={cn(
            'flex min-h-11 w-full items-center gap-2 rounded-xl border border-ink/25 bg-paper px-3 py-2 text-left text-sm text-ink transition-colors hover:border-ink/50 aria-[invalid=true]:border-red-700',
            className,
          )}
        >
          <CalendarDays aria-hidden className="size-4 shrink-0 text-ink/60" />
          <span className="tabular">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-2xl border-ink/15 bg-paper p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={handleSelect}
          numberOfMonths={1}
          weekStartsOn={1}
          disabled={disabled}
          modifiers={{ taken }}
          modifiersClassNames={{ taken: 'line-through decoration-ink/50' }}
        />
        {(taken.length > 0 || (value?.from && !value?.to)) && (
          <div className="flex items-center justify-between gap-3 border-t border-ink/10 px-4 py-2 text-xs text-ink/65">
            <span>{taken.length > 0 ? 'Crossed-out nights are already booked.' : 'Now pick check-out.'}</span>
            {value?.from && !value?.to && (
              <button
                type="button"
                onClick={() => onChange({ from: undefined, to: undefined })}
                className="min-h-9 rounded-full px-2 font-medium text-ink underline underline-offset-4"
              >
                Start again
              </button>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
