import React from 'react';

import {
  AMENITIES,
  BUDGETS,
  CATEGORIES,
  DEFAULT_FILTERS,
  REGIONS,
  SORTS,
  activeFilterCount,
  countiesIn,
} from '@/utils/listingFilters';

const selectClass =
  'h-10 rounded-full border border-gray-300 bg-paper px-4 text-sm text-gray-800 shadow-sm hover:border-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const pillClass = (active) =>
  `h-10 whitespace-nowrap rounded-full border px-4 text-sm transition ${
    active
      ? 'border-primary bg-primary text-white'
      : 'border-gray-300 bg-paper text-gray-800 hover:border-gray-400'
  }`;

const Filters = ({ places, filters, setFilters, resultCount }) => {
  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const counties = countiesIn(places, filters.region);
  const active = activeFilterCount(filters);

  const toggleAmenity = (id) =>
    set({
      amenities: filters.amenities.includes(id)
        ? filters.amenities.filter((a) => a !== id)
        : [...filters.amenities, id],
    });

  return (
    <div className="mx-auto w-full max-w-screen-xl px-4 pt-24 md:pt-28">
      {/* Category chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
        <button
          className={pillClass(filters.category === 'all')}
          onClick={() => set({ category: 'all' })}
        >
          All stays
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={pillClass(filters.category === c.id)}
            onClick={() => set({ category: filters.category === c.id ? 'all' : c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Dropdowns and amenity toggles */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3">
        <select
          aria-label="Nation"
          className={selectClass}
          value={filters.region}
          onChange={(e) => set({ region: e.target.value, county: 'all' })}
        >
          <option value="all">Anywhere in the UK</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {counties.length > 1 && (
          <select
            aria-label="County"
            className={selectClass}
            value={filters.county}
            onChange={(e) => set({ county: e.target.value })}
          >
            <option value="all">All counties</option>
            {counties.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}

        <select
          aria-label="Guests"
          className={selectClass}
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
          aria-label="Budget per night"
          className={selectClass}
          value={filters.budget}
          onChange={(e) => set({ budget: e.target.value })}
        >
          {BUDGETS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id === 'any' ? 'Any price' : `${b.label} / night`}
            </option>
          ))}
        </select>

        {AMENITIES.map((a) => (
          <button
            key={a.id}
            className={pillClass(filters.amenities.includes(a.id))}
            onClick={() => toggleAmenity(a.id)}
            aria-pressed={filters.amenities.includes(a.id)}
          >
            {a.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          <select
            aria-label="Sort by"
            className={selectClass}
            value={filters.sort}
            onChange={(e) => set({ sort: e.target.value })}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 text-sm text-gray-600">
        <span>
          <strong className="text-gray-900">{resultCount}</strong>{' '}
          {resultCount === 1 ? 'stay' : 'stays'}
        </span>
        {active > 0 && (
          <button
            className="bg-transparent font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setFilters(DEFAULT_FILTERS)}
          >
            Clear filters ({active})
          </button>
        )}
      </div>
    </div>
  );
};

export default Filters;
