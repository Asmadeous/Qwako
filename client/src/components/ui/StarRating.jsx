import { Star } from 'lucide-react';

import { cn } from '@/lib/utils';

// Read-only stars, e.g. "4.6 (12 reviews)".
export const Stars = ({ value, className }) => (
  <span className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} out of 5`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        aria-hidden
        strokeWidth={1.5}
        className={cn('size-4', n <= Math.round(value) ? 'fill-ink text-ink' : 'text-ink/30')}
      />
    ))}
  </span>
);

// Pick 1 to 5 stars; works with the keyboard as a radio group.
export const StarInput = ({ value, onChange, name = 'rating' }) => (
  <fieldset className="flex gap-1">
    <legend className="sr-only">Rating out of 5</legend>
    {[1, 2, 3, 4, 5].map((n) => (
      <label key={n} className="cursor-pointer">
        <input
          type="radio"
          name={name}
          value={n}
          checked={value === n}
          onChange={() => onChange(n)}
          className="peer sr-only"
        />
        <span className="grid size-11 place-items-center rounded-full peer-focus-visible:ring-2 peer-focus-visible:ring-ink">
          <Star
            aria-hidden
            strokeWidth={1.5}
            className={cn('size-7 transition-colors', n <= value ? 'fill-ink text-ink' : 'text-ink/35')}
          />
        </span>
        <span className="sr-only">{n} {n === 1 ? 'star' : 'stars'}</span>
      </label>
    ))}
  </fieldset>
);
