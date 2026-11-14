import AccountNav from '@/components/ui/AccountNav';
import PlaceCard from '@/components/ui/PlaceCard';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import useFetch from '@/utils/useFetch';

// Homes the guest saved with the heart.
const SavedPage = () => {
  const { data, error, loading, reload } = useFetch('/saved_listings');

  return (
    <div className="pb-16">
      <AccountNav description="Homes you saved with the heart. Tap the heart again to remove one." />
      {loading && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.listings.length ? (
          <div className="mx-4 grid gap-x-6 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {data.listings.map((place) => (
              <PlaceCard key={place.id} place={place} saved onSavedChange={reload} />
            ))}
          </div>
        ) : (
          <EmptyState title="No saved homes yet." action="Browse homes" to="/homes">
            Tap the heart on any home to keep it here for later.
          </EmptyState>
        ))}
    </div>
  );
};

export default SavedPage;
