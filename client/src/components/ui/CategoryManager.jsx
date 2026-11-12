import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const nameError = (error) => {
  const field = fieldErrorsFrom(error).name;
  return field ? `That name ${field}.` : errorMessageFrom(error);
};

const CONFIGS = {
  categories: {
    title: 'Categories',
    intro: 'Guests filter the homes page by these. Renaming one updates every home that uses it.',
    noun: 'category',
    endpoint: '/admin/categories',
    placeholder: 'For example, Safari lodges',
    deleteNote: (count) =>
      count ? `${count} ${count === 1 ? 'home uses' : 'homes use'} it. They stay listed, with no category.` : 'No homes use it.',
  },
  amenities: {
    title: 'Amenities',
    intro: 'What homes can offer. Guests can filter by them. Renaming one updates every home that has it.',
    noun: 'amenity',
    endpoint: '/admin/amenities',
    placeholder: 'For example, Swimming pool',
    deleteNote: (count) =>
      count ? `${count} ${count === 1 ? 'home has' : 'homes have'} it ticked. It is removed from them.` : 'No homes have it ticked.',
  },
};

// The owner's list of categories or amenities: add, rename and delete.
// `onChange` lets the page refresh its homes after a rename or delete.
const CategoryManager = ({ onChange, kind = 'categories', framed = true }) => {
  const config = CONFIGS[kind];
  const { noun } = config;
  const title = config.title;
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = () =>
    api
      .get(config.endpoint)
      .then(({ data }) => setCategories(data[kind]))
      .catch((error) => setLoadError(errorMessageFrom(error)))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (adding) return;
    if (!newName.trim()) return setAddError(`Enter a name for the ${noun}.`);
    setAdding(true);
    setAddError('');
    try {
      await api.post(config.endpoint, { [noun]: { name: newName } });
      setNewName('');
      toast.success(`${newName.trim()} added.`);
      await load();
      onChange?.();
    } catch (error) {
      setAddError(nameError(error));
    } finally {
      setAdding(false);
    }
  };

  const rename = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setEditError('');
    try {
      await api.patch(`${config.endpoint}/${editing.id}`, {
        [noun]: { name: editing.name },
      });
      setEditing(null);
      toast.success('Renamed.');
      await load();
      onChange?.();
    } catch (error) {
      setEditError(nameError(error));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleteBusy(true);
    setDeleteError('');
    try {
      await api.delete(`${config.endpoint}/${deleting.id}`);
      setDeleting(null);
      toast.success(`${deleting.name} deleted.`);
      await load();
      onChange?.();
    } catch (error) {
      setDeleteError(errorMessageFrom(error));
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <section
      aria-labelledby={`${kind}-heading`}
      className={framed ? 'rounded-2xl border border-ink/15 bg-paper p-5 md:p-6' : ''}
    >
      <div className="grid gap-1">
        <h2
          id={`${kind}-heading`}
          className="text-xl font-bold tracking-tight"
        >
          {title}
        </h2>
        <p className="text-sm text-ink/70">{config.intro}</p>
      </div>

      {loadError && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!loading && categories.length === 0 && !loadError && (
        <p className="mt-4 text-sm text-ink/70">
          No {kind} yet. Add your first one below.
        </p>
      )}

      {categories.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/10 border-y border-ink/10">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex min-h-14 flex-wrap items-center justify-between gap-3 py-2"
            >
              {editing?.id === category.id ? (
                <form onSubmit={rename} className="grid w-full gap-2">
                  <label htmlFor={`rename-${category.id}`} className="sr-only">
                    New name for {category.name}
                  </label>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      id={`rename-${category.id}`}
                      type="text"
                      maxLength={40}
                      autoFocus
                      value={editing.name}
                      onChange={(e) => {
                        setEditing({ ...editing, name: e.target.value });
                        setEditError('');
                      }}
                      onKeyDown={(e) => e.key === 'Escape' && setEditing(null)}
                      aria-invalid={editError ? 'true' : undefined}
                      className="!my-0 sm:max-w-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={saving}
                        aria-busy={saving}
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditing(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                  {editError && (
                    <p className="text-sm text-red-700">{editError}</p>
                  )}
                </form>
              ) : (
                <>
                  <p>
                    <span className="font-semibold">{category.name}</span>
                    <span className="tabular ml-2 text-sm text-ink/65">
                      {category.homes_count}{' '}
                      {category.homes_count === 1 ? 'home' : 'homes'}
                    </span>
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditError('');
                        setEditing({ id: category.id, name: category.name });
                      }}
                      aria-label={`Rename ${category.name}`}
                      className="grid size-11 place-items-center rounded-full text-ink/70 transition-colors hover:bg-sand hover:text-ink"
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError('');
                        setDeleting(category);
                      }}
                      aria-label={`Delete ${category.name}`}
                      className="grid size-11 place-items-center rounded-full text-red-800 transition-colors hover:bg-red-50"
                    >
                      <Trash2 aria-hidden className="size-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 grid gap-2">
        <label htmlFor={`add-${noun}`} className="text-sm font-medium">
          Add {noun === 'amenity' ? 'an' : 'a'} {noun}
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id={`add-${noun}`}
            type="text"
            maxLength={40}
            value={newName}
            placeholder={config.placeholder}
            onChange={(e) => {
              setNewName(e.target.value);
              setAddError('');
            }}
            aria-invalid={addError ? 'true' : undefined}
            aria-describedby={addError ? `add-${noun}-error` : undefined}
            className="!my-0 sm:max-w-xs"
          />
          <Button type="submit" disabled={adding} aria-busy={adding}>
            <Plus aria-hidden className="size-4" />
            {adding ? 'Adding...' : `Add ${noun}`}
          </Button>
        </div>
        {addError && (
          <p id={`add-${noun}-error`} className="text-sm text-red-700">
            {addError}
          </p>
        )}
      </form>

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={`Delete ${deleting?.name ?? noun}?`}
        confirmLabel={`Delete ${noun}`}
        busyLabel="Deleting..."
        busy={deleteBusy}
        error={deleteError}
        tone="danger"
        onConfirm={remove}
      >
        <p>{config.deleteNote(deleting?.homes_count ?? 0)}</p>
      </ConfirmDialog>
    </section>
  );
};

export default CategoryManager;
