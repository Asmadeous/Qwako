import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { isValid, parseISO } from 'date-fns';
import { toast } from 'react-toastify';

import { usePlaces } from '../../hooks';
import PlaceCard, { PlaceCardSkeleton } from '@/components/ui/PlaceCard';
import Filters from '@/components/ui/Filters';
import { BUDGETS, DEFAULT_FILTERS, applyFilters, areaLabel } from '@/utils/listingFilters';
import { Button } from '@/components/ui/button';
import DatePickerWithRange from '@/components/ui/DatePickerWithRange';
import { api } from '@/utils/axios';
import { formatDate, toISODate } from '@/utils/format';

const PAGE_SIZE = 12;

const datesFrom = (params) => {
  const from = parseISO(params.get('check_in') || '');
  const to = parseISO(params.get('check_out') || '');
  return isValid(from) && isValid(to) && to > from ? { from, to } : { from: undefined, to: undefined };
};

// Guests from the home page search (?guests=), 1 to 8; 0 means any.
const guestsFrom = (params) => {
  const n = Number(params.get('guests'));
  return Number.isInteger(n) && n >= 1 && n <= 8 ? n : 0;
};

// Price band from the home page search (?budget=), one of the shilling bands.
const budgetFrom = (params) => {
  const id = params.get('budget');
  return BUDGETS.KES.some((band) => band.id === id) ? id : 'any';
};

const IndexPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { places, loading, error } = usePlaces();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, guests: guestsFrom(searchParams), budget: budgetFrom(searchParams) }));
  const [dates, setDates] = useState(() => datesFrom(searchParams));
  const [freeIds, setFreeIds] = useState(null);
  const [checking, setChecking] = useState(false);
  const [shown, setShown] = useState(PAGE_SIZE);
  const datesChosen = Boolean(dates.from && dates.to);

  // Dates and guests live in the address so a search can be shared and the
  // booking form starts with them; the server says which homes are free.
  const searchQuery = (withDates) => {
    const query = new URLSearchParams();
    if (withDates && datesChosen) {
      query.set('check_in', toISODate(dates.from));
      query.set('check_out', toISODate(dates.to));
    }
    if (filters.guests > 0) query.set('guests', String(filters.guests));
    if (filters.budget !== 'any') query.set('budget', filters.budget);
    return query;
  };

  useEffect(() => {
    setSearchParams(searchQuery(true), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesChosen, dates.from, dates.to, filters.guests, filters.budget]);

  useEffect(() => {
    if (!datesChosen) {
      setFreeIds(null);
      return;
    }
    const check_in = toISODate(dates.from);
    const check_out = toISODate(dates.to);
    setChecking(true);
    api
      .get('/listings', { params: { check_in, check_out } })
      .then(({ data }) => setFreeIds(new Set(data.listings.map((l) => l.id))))
      .catch(() => setFreeIds(null))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datesChosen, dates.from, dates.to]);

  const results = useMemo(() => {
    const list = applyFilters(places, filters);
    return freeIds ? list.filter((p) => freeIds.has(p.id)) : list;
  }, [places, filters, freeIds]);

  useEffect(() => setShown(PAGE_SIZE), [filters, freeIds]);

  const clearDates = () => {
    setDates({ from: undefined, to: undefined });
  };

  // Shown once when an old listing link redirected here.
  useEffect(() => {
    const notice = location.state?.notice;
    if (!notice) return;
    toast.info(notice, { toastId: 'stay-notice' });
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location, navigate]);

  return (
    <div className="px-4 pt-24 pb-24 md:pt-28">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-bold tracking-tight text-5xl leading-[1.05] md:text-6xl">Homes</h1>
        <p className="mt-3 text-ink/70">
          Holiday homes across {areaLabel(places)}, booked directly with the owner.
        </p>
      </header>

      {error ? (
        <p role="alert" className="py-16 text-ink/80">
          {error}
        </p>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="grid w-full gap-1.5 sm:w-80">
              <label htmlFor="search-dates" className="text-sm font-medium">
                When
              </label>
              <DatePickerWithRange id="search-dates" value={dates} onChange={setDates} placeholder="Any dates" />
            </div>
            {datesChosen && (
              <Button variant="outline" onClick={clearDates}>
                Clear dates
              </Button>
            )}
            {datesChosen && (
              <p aria-live="polite" className="w-full text-sm text-ink/70 sm:w-auto">
                {checking ? 'Checking which homes are free...' : `Free from ${formatDate(dates.from)} to ${formatDate(dates.to)}`}
              </p>
            )}
          </div>
          <Filters places={places} filters={filters} setFilters={setFilters} resultCount={results.length} />

          {loading ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.slice(0, shown).map((place) => (
                <PlaceCard
                  place={place}
                  key={place.id}
                  query={searchQuery(true).size ? `?${searchQuery(true)}` : ''}
                />
              ))}
            </div>
          ) : null}
          {!loading && results.length > shown && (
            <div className="mt-10 flex flex-col items-center gap-2">
              <p className="text-sm text-ink/65">
                Showing {shown} of {results.length} homes
              </p>
              <Button variant="outline" onClick={() => setShown((n) => n + PAGE_SIZE)}>
                Show more homes
              </Button>
            </div>
          )}
          {!loading && results.length === 0 && (
            <div className="mt-8 rounded-2xl border border-ink/15 px-6 py-14 text-center">
              <h2 className="font-bold tracking-tight text-4xl">
                {datesChosen ? 'No homes free for those dates.' : 'No homes match those filters.'}
              </h2>
              <p className="mt-2 text-ink/70">
                {datesChosen ? 'Try other dates, or clear the dates to see every home.' : 'Remove a filter or widen your price range to see more.'}
              </p>
              <Button
                className="mt-6"
                onClick={() => {
                  setFilters(DEFAULT_FILTERS);
                  clearDates();
                }}
              >
                Clear search
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndexPage;
