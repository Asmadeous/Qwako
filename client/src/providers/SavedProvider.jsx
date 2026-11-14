import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';

const SavedContext = createContext({ savedIds: new Set(), toggle: () => {} });

// Which homes the signed-in guest has saved, shared by every heart on the page.
export const SavedProvider = ({ children }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState(new Set());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) return setSavedIds(new Set());
    api
      .get('/saved_listings')
      .then(({ data }) => setSavedIds(new Set(data.listings.map((l) => l.id))))
      .catch(() => {});
  }, [user]);

  const toggle = useCallback(
    async (place) => {
      if (!user) {
        navigate('/login', { state: { from: location.pathname + location.search } });
        return;
      }
      const saved = savedIds.has(place.id);
      const next = new Set(savedIds);
      if (saved) next.delete(place.id);
      else next.add(place.id);
      setSavedIds(next);
      try {
        if (saved) await api.delete(`/saved_listings/${place.id}`);
        else await api.post('/saved_listings', { listing_id: place.id });
        toast.success(saved ? `Removed ${place.title} from saved homes.` : `Saved ${place.title}.`);
      } catch (err) {
        setSavedIds(savedIds);
        toast.error(errorMessageFrom(err));
      }
    },
    [user, savedIds, navigate, location],
  );

  return <SavedContext.Provider value={{ savedIds, toggle }}>{children}</SavedContext.Provider>;
};

export const useSaved = () => useContext(SavedContext);
