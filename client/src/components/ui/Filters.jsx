import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

import {
  AMENITIES,
  CATEGORIES,
  DEFAULT_FILTERS,
  SORTS,
  activeFilterCount,
  budgetsFor,
  countiesIn,
  countriesIn,
  moreFilterCount,
} from '@/utils/listingFilters';

const control =
  'h-11 w-full min-w-0 rounded-full md:w-auto border border-ink/25 bg-paper px-4 text-sm text-ink transition-colors hover:border-ink/50 focus:border-ink focus:outline-none';

const chip = (active) =>
  `h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm transition-colors active:scale-[0.98] ${
    active ? 'border-ink bg-ink text-sand' : 'border-ink/25 bg-transparent text-ink hover:border-ink/60'
  }`;

const Filters = ({ places, filters, setFilters, resultCount }) => {
  const [showMore, setShowMore] = useState(false);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const counties = countiesIn(places, filters.region);
  const countries = countriesIn(places);
  // With one country (Kenya at launch) the first choice is the county.
  const manyCountries = countries.length > 1;
  const budgets = budgetsFor(places, filters.region);
  const moreCount = moreFilterCount(filters, manyCountries);

  const toggleAmenity = (id) =>
    set({
      amenities: filters.amenities.includes(id)
        ? filters.amenities.filter((a) => a !== id)
        : [...filters.amenities, id],
    });

  return (
    <section aria-label="Search and filter stays" className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search by name or place</span>
          <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/50" />
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder="Search by name, town or county"
            className="!my-0 h-11 !rounded-full !pl-10"
          />
        </label>

        <div className="grid grid-cols-2 gap-2 md:contents">
          {manyCountries ? (
            <select
              aria-label="Country"
              className={control}
              value={filters.region}
              onChange={(e) => set({ region: e.target.value, county: 'all', budget: 'any' })}
            >
              <option value="all">Everywhere</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : (
            <select
              aria-label="County"
              className={control}
              value={filters.county}
              onChange={(e) => set({ county: e.target.value })}
            >
              <option value="all">All of {countries[0] ?? 'Kenya'}</option>
              {counties.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          <select
            aria-label="Guests"
            className={control}
            value={filters.guests}
            onChange={(e) => set({ guests: Number(e.target.value) })}
          >
            <option value={0}>Any guests</option>
            {[2, 4, 6, 8].map((n) => (
              <option key={n} value={n}>
                {n}+ guests
              </option>
            ))}
          </select>

          <select
            aria-label="Sort by"
            className={control}
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            className={`${control} flex shrink-0 items-center gap-2 ${showMore ? 'border-ink' : ''}`}
            aria-expanded={showMore}
            aria-controls="more-filters"
            onClick={() => setShowMore((open) => !open)}
          >
            <SlidersHorizontal aria-hidden className="size-4" />
            More filters
            {moreCount > 0 && (
              <span className="tabular grid size-5 place-items-center rounded-full bg-ink text-[11px] text-sand">
                {moreCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showMore && (
        <div id="more-filters" className="grid gap-5 rounded-2xl border border-ink/15 bg-paper p-5 md:grid-cols-[auto_auto_1fr]">
          {manyCountries && counties.length > 1 && (
            <label className="grid gap-1.5 text-sm font-medium">
              County
              <select
                className={control}
                value={filters.county}
                onChange={(e) => set({ county: e.target.value })}
              >
                <option value="all">Any county</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          )}
          {budgets && (
            <label className="grid gap-1.5 text-sm font-medium">
              Price per night
              <select className={control} value={filters.budget} onChange={(e) => set({ budget: e.target.value })}>
                {budgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <fieldset className="grid gap-1.5">
            <legend className="mb-1.5 text-sm font-medium">Must have</legend>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className={chip(filters.amenities.includes(a.id))}
                  onClick={() => toggleAmenity(a.id)}
                  aria-pressed={filters.amenities.includes(a.id)}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="group" aria-label="Type of stay">
        <button type="button" className={chip(filters.category === 'all')} aria-pressed={filters.category === 'all'} onClick={() => set({ category: 'all' })}>
          All stays
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            className={chip(filters.category === c.id)}
            aria-pressed={filters.category === c.id}
            onClick={() => set({ category: filters.category === c.id ? 'all' : c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-ink/15 pt-4 text-sm">
        <p aria-live="polite" className="tabular text-ink/70">
          {resultCount} {resultCount === 1 ? 'stay' : 'stays'}
        </p>
        {activeFilterCount(filters) > 0 && (
          <button
            type="button"
            className="underline decoration-ink/40 underline-offset-4 hover:decoration-ink"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Clear all
          </button>
        )}
      </div>
    </section>
  );
};

export default Filters;
