import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { amenityIcon } from '@/utils/amenities';
import { Button } from '@/components/ui/button';

// Home form: tick what the home offers, or add a new amenity and tick it.
const Perks = ({ selected, handleFormData, onAdded, manage }) => {
  const [amenities, setAmenities] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    api
      .get('/admin/amenities')
      .then(({ data }) => setAmenities(data.amenities))
      .catch((err) => setLoadError(errorMessageFrom(err)));
  }, []);

  useEffect(() => {
    if (adding) nameRef.current?.focus();
  }, [adding]);

  const closeAdd = () => {
    setAdding(false);
    setName('');
    setCreateError('');
  };

  const create = async () => {
    if (creating) return;
    if (!name.trim()) {
      setCreateError('Enter a name for the amenity.');
      nameRef.current?.focus();
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/admin/amenities', { amenity: { name } });
      setAmenities((current) => [...current, data.amenity].sort((a, b) => a.name.localeCompare(b.name)));
      onAdded(data.amenity.key);
      closeAdd();
    } catch (err) {
      const field = fieldErrorsFrom(err).name;
      setCreateError(field ? `That name ${field}.` : errorMessageFrom(err));
      nameRef.current?.focus();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid gap-3">
      {loadError && <p className="text-sm text-red-700">{loadError}</p>}
      {!amenities && !loadError && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Loading amenities">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-ink/[0.07]" />
          ))}
        </div>
      )}
      {amenities?.length === 0 && <p className="text-sm text-ink/70">No amenities yet. Add the first one below.</p>}
      {amenities?.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {amenities.map(({ key, name: label }) => {
            const Icon = amenityIcon(key);
            return (
              <label
                key={key}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-ink/20 px-3 py-2 text-sm transition-colors hover:border-ink/50 has-[:checked]:border-ink has-[:checked]:bg-paper has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink"
              >
                <input
                  type="checkbox"
                  className="size-4 shrink-0 accent-ink"
                  checked={selected.includes(key)}
                  name={key}
                  onChange={handleFormData}
                />
                <Icon aria-hidden strokeWidth={1.5} className="size-5 shrink-0 text-ink/70" />
                <span className="min-w-0">{label}</span>
              </label>
            );
          })}
        </div>
      )}

      {amenities && !adding && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Button variant="outline" onClick={() => setAdding(true)}>
            <Plus aria-hidden className="size-4" />
            Add an amenity
          </Button>
          {manage}
        </div>
      )}

      {adding && (
        <div className="grid gap-2 rounded-2xl border border-ink/15 bg-paper p-4">
          <label htmlFor="new-amenity-name" className="text-sm font-medium">
            New amenity
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="new-amenity-name"
              ref={nameRef}
              type="text"
              maxLength={40}
              value={name}
              placeholder="For example, Swimming pool"
              aria-invalid={createError ? 'true' : undefined}
              aria-describedby={createError ? 'new-amenity-error' : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setCreateError('');
              }}
              onKeyDown={(e) => {
                // Enter adds the amenity instead of submitting the whole home form.
                if (e.key === 'Enter') {
                  e.preventDefault();
                  create();
                }
                if (e.key === 'Escape') closeAdd();
              }}
              className="sm:max-w-xs"
            />
            <div className="flex gap-2">
              <Button onClick={create} disabled={creating} aria-busy={creating}>
                {creating ? 'Adding...' : 'Add and tick'}
              </Button>
              <Button variant="outline" onClick={closeAdd}>
                Cancel
              </Button>
            </div>
          </div>
          {createError && (
            <p id="new-amenity-error" className="text-sm text-red-700">
              {createError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default Perks;
