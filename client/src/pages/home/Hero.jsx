import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

import DatePickerWithRange from '@/components/ui/DatePickerWithRange';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toISODate } from '@/utils/format';
import { BUDGETS } from '@/utils/listingFilters';
import { useHomePhotos } from './images';
import { photoProps } from './motion';

const GUEST_CHOICES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  value: String(n),
  label: `${n} ${n === 1 ? 'guest' : 'guests'}`,
}));
const BUDGET_CHOICES = BUDGETS.KES.map((band) => ({ value: band.id, label: band.label }));

// The slogan over a home's cover photo, with a search for dates and guests
// that opens the homes page showing only the homes free for that stay.
const Hero = () => {
  const cover = useHomePhotos().pick(0);
  const navigate = useNavigate();
  const [dates, setDates] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState(2);
  const [budget, setBudget] = useState('any');

  const search = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (dates.from && dates.to) {
      query.set('check_in', toISODate(dates.from));
      query.set('check_out', toISODate(dates.to));
    }
    query.set('guests', String(guests));
    if (budget !== 'any') query.set('budget', budget);
    navigate(`/homes?${query}`);
  };

  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink text-white">
      {cover && (
        <img
          {...photoProps(cover.url, 2400, '100vw', { eager: true })}
          alt={cover.alt}
          className="absolute inset-0 h-full w-full animate-[heroZoom_2.4s_ease-out_both] object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />

      <div className="relative mx-auto flex w-full max-w-screen-xl grow flex-col justify-end px-5 pb-12 pt-28 md:px-8 md:pb-20">
        <h1 className="animate-[fadeUp_1.2s_ease-out_0.2s_both] text-[10vw] font-bold leading-[0.95] tracking-tight md:text-[6vw]">
          Where comfort
          <br />
          meets Tranquility
        </h1>

        <form
          onSubmit={search}
          aria-label="Find a home"
          className="mt-8 grid animate-[fadeUp_1.2s_ease-out_0.5s_both] gap-2 rounded-2xl bg-sand p-2 text-ink shadow-xl sm:grid-cols-2 sm:items-center md:max-w-4xl md:grid-cols-[minmax(0,1fr)_9rem_13rem_auto]"
        >
          <label htmlFor="hero-dates" className="sr-only">
            Dates
          </label>
          <DatePickerWithRange
            id="hero-dates"
            value={dates}
            onChange={setDates}
            placeholder="Add your dates"
            className="border-transparent"
          />
          <label htmlFor="hero-guests" className="sr-only">
            Guests
          </label>
          <Select
            id="hero-guests"
            value={String(guests)}
            onValueChange={(v) => setGuests(Number(v))}
            options={GUEST_CHOICES}
          />
          <label htmlFor="hero-budget" className="sr-only">
            Price a night
          </label>
          <Select
            id="hero-budget"
            value={budget}
            onValueChange={setBudget}
            options={BUDGET_CHOICES}
          />
          <Button type="submit" size="lg">
            <Search aria-hidden className="size-4" />
            Search
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Hero;
