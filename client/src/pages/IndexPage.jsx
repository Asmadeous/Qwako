import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { usePlaces } from '../../hooks';
import PlaceCard, { PlaceCardSkeleton } from '@/components/ui/PlaceCard';
import Filters from '@/components/ui/Filters';
import { DEFAULT_FILTERS, applyFilters, areaLabel } from '@/utils/listingFilters';

const IndexPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { places, loading, error } = usePlaces();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const results = useMemo(() => applyFilters(places, filters), [places, filters]);

  // Shown once when an old listing link redirected here.
  useEffect(() => {
    const notice = location.state?.notice;
    if (!notice) return;
    toast.info(notice, { toastId: 'stay-notice' });
    navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location, navigate]);

  return (
    <div className="px-4 pt-28 pb-24 md:px-4">
      <header className="mb-8 max-w-2xl">
        <h1 className="font-bold tracking-tight text-5xl leading-none md:text-7xl">Stays</h1>
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
          <Filters places={places} filters={filters} setFilters={setFilters} resultCount={results.length} />

          {loading ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => (
                <PlaceCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((place) => (
                <PlaceCard place={place} key={place.id} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-ink/15 px-6 py-14 text-center">
              <h2 className="font-bold tracking-tight text-4xl">No stays match those filters.</h2>
              <p className="mt-2 text-ink/70">Remove a filter or widen your price range to see more.</p>
              <button
                type="button"
                className="mt-6 h-11 rounded-full bg-ink px-6 text-sm font-medium text-sand transition-colors hover:bg-ink/90 active:scale-[0.98]"
                onClick={() => setFilters(DEFAULT_FILTERS)}
              >
                Clear filters
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IndexPage;
