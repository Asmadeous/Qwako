import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

import { Select } from '@/components/ui/select';

import {
  DEFAULT_FILTERS,
  amenitiesIn,
  SORTS,
  activeFilterCount,
  budgetsFor,
  categoriesIn,
  countiesIn,
  countriesIn,
  moreFilterCount,
} from '@/utils/listingFilters';

const control =
  'h-11 w-full min-w-0 rounded-full md:w-auto border border-ink/25 bg-paper px-4 text-sm text-ink transition-colors hover:border-ink/50 focus:border-ink focus:outline-none';

// The dropdowns sit on the page background, so they get a visible border.
const dropdown = 'rounded-full border-ink/25 px-4 md:w-auto md:min-w-[10rem]';
const choices = (items) => items.map((c) => ({ value: c, label: c }));
const GUESTS = [
  { value: '0', label: 'Any guests' },
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
    value: String(n),
    label: `${n} ${n === 1 ? 'guest' : 'guests'}`,
  })),
];

const chip = (active) =>
  `h-10 shrink-0 whitespace-nowrap rounded-full border px-4 text-sm transition-colors active:scale-[0.98] ${
    active
      ? 'border-ink bg-ink text-sand'
      : 'border-ink/25 bg-transparent text-ink hover:border-ink/60'
  }`;

const Filters = ({ places, filters, setFilters, resultCount }) => {
  const [showMore, setShowMore] = useState(false);
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const counties = countiesIn(places, filters.region);
  const categories = categoriesIn(places);
  const amenities = amenitiesIn(places);
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
    <section aria-label="Search and filter homes" className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]">
        <label className="relative block">
          <span className="sr-only">Search by name or place</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink/50"
          />
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
            <Select
              aria-label="Country"
              className={dropdown}
              value={filters.region}
              onValueChange={(v) => set({ region: v, county: 'all', budget: 'any' })}
              options={[{ value: 'all', label: 'Everywhere' }, ...choices(countries)]}
            />
          ) : (
            <Select
              aria-label="County"
              className={dropdown}
              value={filters.county}
              onValueChange={(v) => set({ county: v })}
              options={[
                { value: 'all', label: `All of ${countries[0] ?? 'Kenya'}` },
                ...choices(counties),
              ]}
            />
          )}

          <Select
            aria-label="Guests"
            className={dropdown}
            value={String(filters.guests)}
            onValueChange={(v) => set({ guests: Number(v) })}
            options={GUESTS}
          />

          <Select
            aria-label="Sort by"
            className={dropdown}
            value={filters.sort}
            onValueChange={(v) => set({ sort: v })}
            options={SORTS.map((o) => ({ value: o.id, label: o.label }))}
          />

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
        <div
          id="more-filters"
          className="grid gap-5 rounded-2xl border border-ink/15 bg-paper p-5 md:grid-cols-[auto_auto_1fr]"
        >
          {manyCountries && counties.length > 1 && (
            <div className="grid content-start gap-1.5 text-sm font-medium">
              <label htmlFor="filter-county">County</label>
              <Select
                id="filter-county"
                className="min-w-[12rem] border-ink/25 font-normal"
                value={filters.county}
                onValueChange={(v) => set({ county: v })}
                options={[{ value: 'all', label: 'Any county' }, ...choices(counties)]}
              />
            </div>
          )}
          {budgets && (
            <div className="grid content-start gap-1.5 text-sm font-medium">
              <label htmlFor="filter-budget">Price per night</label>
              <Select
                id="filter-budget"
                className="min-w-[12rem] border-ink/25 font-normal"
                value={filters.budget}
                onValueChange={(v) => set({ budget: v })}
                options={budgets.map((b) => ({ value: b.id, label: b.label }))}
              />
            </div>
          )}
          {amenities.length > 0 && (
            <fieldset className="grid gap-1.5">
              <legend className="mb-1.5 text-sm font-medium">Must have</legend>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    className={chip(filters.amenities.includes(a.key))}
                    onClick={() => toggleAmenity(a.key)}
                    aria-pressed={filters.amenities.includes(a.key)}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      )}

      {categories.length > 0 && (
        <div
          className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
          role="group"
          aria-label="Category"
        >
          <button
            type="button"
            className={chip(filters.category === 'all')}
            aria-pressed={filters.category === 'all'}
            onClick={() => set({ category: 'all' })}
          >
            All homes
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              type="button"
              className={chip(filters.category === c.slug)}
              aria-pressed={filters.category === c.slug}
              onClick={() =>
                set({ category: filters.category === c.slug ? 'all' : c.slug })
              }
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-ink/15 pt-4 text-sm">
        <p aria-live="polite" className="tabular text-ink/70">
          {resultCount} {resultCount === 1 ? 'home' : 'homes'}
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
