import { useState } from 'react';
import { format, startOfToday } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const day = (date) => format(date, 'EEE d MMM yyyy');

// Controlled range picker: the booking form owns the dates.
export default function DatePickerWithRange({ id, value, onChange, className, invalid }) {
  const [open, setOpen] = useState(false);

  let label = 'Choose your dates';
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
          onSelect={(range) => onChange(range ?? { from: undefined, to: undefined })}
          numberOfMonths={1}
          weekStartsOn={1}
          disabled={{ before: startOfToday() }}
        />
      </PopoverContent>
    </Popover>
  );
}
