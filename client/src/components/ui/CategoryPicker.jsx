import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';

import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { Button } from '@/components/ui/button';

// Home form field: pick one of the owner's categories, or create a new one
// on the spot and select it.
const CategoryPicker = ({ value, onChange, error, manage }) => {
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const nameRef = useRef(null);

  useEffect(() => {
    api
      .get('/admin/categories')
      .then(({ data }) => {
        setCategories(data.categories);
        // A category deleted from the list can't stay selected.
        if (value && !data.categories.some((c) => c.id === value)) onChange(null);
      })
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
      setCreateError('Enter a name for the category.');
      nameRef.current?.focus();
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await api.post('/admin/categories', {
        category: { name },
      });
      setCategories((current) =>
        [...current, data.category].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      onChange(data.category.id);
      closeAdd();
    } catch (err) {
      setCreateError(
        fieldErrorsFrom(err).name
          ? `That name ${fieldErrorsFrom(err).name}.`
          : errorMessageFrom(err),
      );
      nameRef.current?.focus();
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor="listing-category" className="text-sm font-medium">
        Category
      </label>
      <p className="text-sm text-ink/60">
        Guests can filter the homes page by category.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          id="listing-category"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value || null)}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? 'listing-category-error' : undefined}
          className="h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-ink focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/15 sm:max-w-xs"
        >
          <option value="">No category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {!adding && (
          <Button
            variant="outline"
            onClick={() => setAdding(true)}
            className="shrink-0"
          >
            <Plus aria-hidden className="size-4" />
            New category
          </Button>
        )}
      </div>
      {manage}
      {loadError && <p className="text-sm text-red-700">{loadError}</p>}
      {error && (
        <p id="listing-category-error" className="text-sm text-red-700">
          {error}
        </p>
      )}

      {adding && (
        <div className="mt-2 grid gap-2 rounded-2xl border border-ink/15 bg-paper p-4">
          <label htmlFor="new-category-name" className="text-sm font-medium">
            New category name
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="new-category-name"
              ref={nameRef}
              type="text"
              maxLength={40}
              value={name}
              placeholder="For example, Safari lodges"
              aria-invalid={createError ? 'true' : undefined}
              aria-describedby={createError ? 'new-category-error' : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setCreateError('');
              }}
              onKeyDown={(e) => {
                // Enter adds the category instead of submitting the whole home form.
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
                {creating ? 'Adding...' : 'Add and select'}
              </Button>
              <Button variant="outline" onClick={closeAdd}>
                Cancel
              </Button>
            </div>
          </div>
          {createError && (
            <p id="new-category-error" className="text-sm text-red-700">
              {createError}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryPicker;
