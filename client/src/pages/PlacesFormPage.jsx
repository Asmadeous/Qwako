import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import {
  amountToCents,
  centsToAmount,
  currencyForAddress,
} from '@/utils/currency';
import { useAuth } from '../../hooks';

import AccountNav from '@/components/ui/AccountNav';
import Perks from '@/components/ui/Perks';
import PhotosUploader from '@/components/ui/PhotosUploader';
import VideosUploader from '@/components/ui/VideosUploader';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

// Form fields whose server errors are reported under other names.
const ERROR_KEYS = {
  address: ['address', 'country'],
  price: ['nightly_price_cents'],
  cleaning: ['cleaning_charge_cents'],
  amenities: ['amenity_keys', 'amenities'],
};

const EMPTY = {
  title: '',
  address: '',
  description: '',
  house_rules: '',
  max_guests: 2,
  price: 10000,
  cleaning: 0,
  status: 'published',
  amenities: [],
};

const fromListing = (listing) => ({
  title: listing.title,
  address: listing.address,
  description: listing.description,
  house_rules: listing.house_rules,
  max_guests: listing.max_guests,
  price: centsToAmount(listing.nightly_price_cents),
  cleaning: centsToAmount(listing.cleaning_charge_cents),
  status: listing.status,
  amenities: listing.amenities,
});

const PlacesFormPage = () => {
  const { id } = useParams();
  const auth = useAuth();
  const [redirect, setRedirect] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [hasBookings, setHasBookings] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/admin/listings/${id}`)
      .then(({ data }) => {
        setForm(fromListing(data.listing));
        setPhotos(data.listing.photos);
        setVideos(data.listing.videos ?? []);
        setHasBookings(Boolean(data.listing.has_bookings));
      })
      .catch((error) => setFormError(errorMessageFrom(error)))
      .finally(() => setLoading(false));
  }, [id]);

  // A field's error clears as soon as the owner edits it.
  const clearErrors = (keys) =>
    setErrors((current) => {
      if (!keys.some((key) => current[key])) return current;
      const next = { ...current };
      keys.forEach((key) => delete next[key]);
      return next;
    });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    clearErrors(ERROR_KEYS[type === 'checkbox' ? 'amenities' : name] ?? [name]);
    if (type === 'checkbox') {
      setForm((current) => ({
        ...current,
        amenities: current.amenities.includes(name)
          ? current.amenities.filter((key) => key !== name)
          : [...current.amenities, name],
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setErrors({});
    setFormError('');
    const listing = {
      title: form.title,
      address: form.address,
      description: form.description,
      house_rules: form.house_rules,
      max_guests: Number(form.max_guests),
      nightly_price_cents: amountToCents(form.price),
      cleaning_charge_cents: amountToCents(form.cleaning || 0),
      status: form.status,
      amenity_keys: form.amenities,
      photo_urls: photos,
      video_urls: videos,
    };
    try {
      if (id) await api.patch(`/admin/listings/${id}`, { listing });
      else await api.post('/admin/listings', { listing });
      toast.success('Home saved.');
      setRedirect(true);
    } catch (error) {
      setErrors(fieldErrorsFrom(error));
      setFormError(errorMessageFrom(error));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (auth.loading) return <Spinner />;
  if (!auth.user) return <Navigate to="/login" />;
  if (auth.user.role !== 'admin') return <Navigate to="/account" />;
  const deleteHome = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/listings/${id}`);
      toast.success('Home deleted.');
      setRedirect(true);
    } catch (error) {
      setDeleteError(errorMessageFrom(error));
      setDeleting(false);
    }
  };

  if (redirect) return <Navigate to="/account/places" />;
  if (loading) return <Spinner />;

  const currency = currencyForAddress(form.address);
  const currencyLabel = currency === 'GBP' ? '£' : 'Ksh';
  const currencyName = currency === 'GBP' ? 'pounds' : 'Kenyan shillings';

  const fieldError = (field) =>
    errors[field] && (
      <p id={`listing-${field}-error`} className="text-sm text-red-700">
        {errors[field]}
      </p>
    );
  const invalid = (field) => ({
    'aria-invalid': errors[field] ? 'true' : undefined,
    'aria-describedby': errors[field] ? `listing-${field}-error` : undefined,
  });
  const field = (htmlFor, label, input, { hint, error = htmlFor } = {}) => (
    <div className="grid content-start gap-1.5">
      <label htmlFor={`listing-${htmlFor}`} className="text-sm font-medium">
        {label}
      </label>
      {hint && <p className="text-sm text-ink/60">{hint}</p>}
      {input}
      {fieldError(error)}
    </div>
  );
  const section = (title, hint, children) => (
    <section className="grid gap-6 border-t border-ink/15 py-10 md:grid-cols-[minmax(0,240px)_1fr] md:gap-12">
      <div>
        <h2 className="text-3xl font-bold leading-tight tracking-tight">
          {title}
        </h2>
        {hint && <p className="mt-1 text-sm text-ink/60">{hint}</p>}
      </div>
      <div className="grid gap-6">{children}</div>
    </section>
  );

  return (
    <div>
      <AccountNav />
      <form
        onSubmit={save}
        className="mx-4 max-w-5xl [&_input]:!my-0 [&_textarea]:!my-0"
      >
        {formError && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800"
          >
            {formError}
          </p>
        )}

        {section(
          'The basics',
          'What guests see first on the homes page.',
          <>
            {field(
              'title',
              'Name',
              <input
                id="listing-title"
                type="text"
                name="title"
                required
                maxLength={120}
                value={form.title}
                onChange={handleChange}
                {...invalid('title')}
              />,
              { hint: 'Short and clear, for example "Diani Beach Villa".' },
            )}
            {field(
              'address',
              'Area',
              <input
                id="listing-address"
                type="text"
                name="address"
                required
                maxLength={200}
                value={form.address}
                onChange={handleChange}
                {...invalid('address')}
              />,
              {
                hint: 'Town, county, country. For example "Diani Beach, Kwale, Kenya". Homes in Kenya are priced in shillings, homes in England, Scotland, Wales or Northern Ireland in pounds.',
                error: 'country',
              },
            )}
            {fieldError('address')}
          </>,
        )}

        {section(
          'Photos',
          'The first photo is the cover. Up to 30.',
          <>
            <PhotosUploader
              addedPhotos={photos}
              setAddedPhotos={(next) => {
                clearErrors(['photos']);
                setPhotos(next);
              }}
            />
            {fieldError('photos')}
          </>,
        )}

        {section(
          'Videos',
          'Optional walkthroughs, shown on the listing in this order. Up to 10.',
          <>
            <VideosUploader
              videos={videos}
              setVideos={(next) => {
                clearErrors(['videos']);
                setVideos(next);
              }}
            />
            {fieldError('videos')}
          </>,
        )}

        {section(
          'Description',
          'Tell guests what the home is like and what is nearby.',
          <>
            {field(
              'description',
              'About this home',
              <textarea
                id="listing-description"
                name="description"
                rows={6}
                value={form.description}
                onChange={handleChange}
                {...invalid('description')}
              />,
            )}
            {field(
              'house_rules',
              'House rules',
              <textarea
                id="listing-house_rules"
                name="house_rules"
                rows={4}
                value={form.house_rules}
                onChange={handleChange}
                {...invalid('house_rules')}
              />,
              { hint: 'Check-in and check-out times, smoking, parties, pets.' },
            )}
          </>,
        )}

        {section(
          'Amenities',
          'Only ticked items are shown on the listing.',
          <fieldset>
            <legend className="sr-only">Amenities</legend>
            <Perks selected={form.amenities} handleFormData={handleChange} />
          </fieldset>,
        )}

        {section(
          'Price and guests',
          `Prices are in ${currencyName}, set by the home's country. Guests pay the nightly price plus one cleaning charge.`,
          <div className="grid gap-6 sm:grid-cols-2">
            {field(
              'price',
              `Price per night (${currencyLabel})`,
              <input
                id="listing-price"
                type="number"
                name="price"
                min={1}
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
                {...invalid('nightly_price_cents')}
                className="tabular"
              />,
              { error: 'nightly_price_cents' },
            )}
            {field(
              'cleaning',
              `Cleaning charge per stay (${currencyLabel})`,
              <input
                id="listing-cleaning"
                type="number"
                name="cleaning"
                min={0}
                step="0.01"
                value={form.cleaning}
                onChange={handleChange}
                {...invalid('cleaning_charge_cents')}
                className="tabular"
              />,
              { error: 'cleaning_charge_cents' },
            )}
            {field(
              'max_guests',
              'Sleeps up to',
              <input
                id="listing-max_guests"
                type="number"
                name="max_guests"
                min={1}
                max={16}
                required
                value={form.max_guests}
                onChange={handleChange}
                {...invalid('max_guests')}
                className="tabular"
              />,
            )}
            {field(
              'status',
              'Visibility',
              <select
                id="listing-status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-ink focus:border-ink focus:outline-none"
              >
                <option value="published">Published, bookable by guests</option>
                <option value="unlisted">
                  Unlisted, hidden from the homes page
                </option>
                <option value="draft">Draft, not bookable</option>
              </select>,
            )}
          </div>,
        )}

        <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-ink/15 bg-sand pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <Button type="submit" size="lg" disabled={saving} aria-busy={saving}>
            {saving ? 'Saving...' : 'Save home'}
          </Button>
          <Link
            to="/account/places"
            className="inline-flex h-12 items-center rounded-full px-5 text-sm text-ink/75 transition-colors hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>

      {id && !loading && (
        <section className="mx-4 mb-24 mt-12 max-w-3xl border-t border-ink/15 pt-6">
          <h2 className="text-2xl font-bold tracking-tight">
            Delete this home
          </h2>
          {hasBookings ? (
            <p className="mt-1 max-w-prose text-sm text-ink/70">
              Guests have booked this home, so it can't be deleted: their
              bookings and payments need it. To hide it from guests, set
              Visibility to Unlisted and save.
            </p>
          ) : (
            <>
              <p className="mt-1 max-w-prose text-sm text-ink/70">
                Nobody has booked this home yet, so it can be deleted for good.
              </p>
              <Button
                variant="danger-outline"
                className="mt-4"
                onClick={() => {
                  setDeleteError('');
                  setConfirmDelete(true);
                }}
              >
                Delete home
              </Button>
              <ConfirmDialog
                open={confirmDelete}
                onOpenChange={setConfirmDelete}
                title="Delete this home?"
                confirmLabel="Delete home"
                busyLabel="Deleting..."
                busy={deleting}
                error={deleteError}
                tone="danger"
                onConfirm={deleteHome}
              >
                <p>
                  {form.title || 'This home'}, its photos and videos will be
                  removed from the site. You can't undo this.
                </p>
              </ConfirmDialog>
            </>
          )}
        </section>
      )}
    </div>
  );
};

export default PlacesFormPage;
