import { useMemo, useState } from 'react';

import { usePlaces } from '../../hooks';
import Spinner from '@/components/ui/Spinner';
import PlaceCard from '@/components/ui/PlaceCard';
import Filters from '@/components/ui/Filters';
import { DEFAULT_FILTERS, applyFilters } from '@/utils/listingFilters';

const IndexPage = () => {
  const { places, loading, error } = usePlaces();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  const results = useMemo(() => applyFilters(places, filters), [places, filters]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <p role="alert" className="mx-auto max-w-xl px-4 py-20 text-center text-lg">
        {error}
      </p>
    );
  }

  return (
    <>
      <Filters
        places={places}
        filters={filters}
        setFilters={setFilters}
        resultCount={results.length}
      />

      {results.length > 0 ? (
        <div className="grid grid-cols-1 justify-items-center px-4 pt-6 pb-32 md:grid-cols-2 md:gap-0 lg:grid-cols-3 lg:gap-2 xl:grid-cols-4 xl:gap-10">
          {results.map((place) => (
            <PlaceCard place={place} key={place.id} />
          ))}
        </div>
      ) : (
        <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
          <h1 className="text-2xl font-semibold">No stays match</h1>
          <p className="mt-2 text-gray-600">
            {places.length > 0
              ? 'Try removing a filter or widening your budget.'
              : "Sorry, we couldn't find the place you're looking for."}
          </p>
          {places.length > 0 ? (
            <button
              className="mt-6 rounded-full bg-primary px-6 py-2 text-white"
              onClick={() => setFilters(DEFAULT_FILTERS)}
            >
              Clear filters
            </button>
          ) : (
            <a href="/stays" className="mt-6 rounded-full bg-primary px-6 py-2 text-white">
              Show all stays
            </a>
          )}
        </div>
      )}
    </>
  );
};

export default IndexPage;
