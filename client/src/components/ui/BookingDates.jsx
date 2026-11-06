import { format, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';

import { cn } from '@/lib/utils';

const day = (iso) => format(parseISO(iso), 'd MMM yyyy');

const BookingDates = ({ booking, className }) => (
  <p className={cn('tabular flex flex-wrap items-center gap-x-2 gap-y-1', className)}>
    <CalendarDays aria-hidden strokeWidth={1.5} className="size-4 shrink-0" />
    <span>
      {day(booking.check_in)} to {day(booking.check_out)}
    </span>
    <span className="text-ink/60">
      ({booking.nights} {booking.nights === 1 ? 'night' : 'nights'})
    </span>
  </p>
);

export default BookingDates;
