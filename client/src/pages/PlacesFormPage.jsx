import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { penceToPounds, poundsToPence } from '@/utils/currency';
import { useAuth } from '../../hooks';

import AccountNav from '@/components/ui/AccountNav';
import Perks from '@/components/ui/Perks';
import PhotosUploader from '@/components/ui/PhotosUploader';
import Spinner from '@/components/ui/Spinner';

const EMPTY = {
  title: '',
  address: '',
  description: '',
  house_rules: '',
  max_guests: 2,
  price_pounds: 100,
  cleaning_pounds: 0,
  status: 'published',
  amenities: [],
};

const fromListing = (listing) => ({
  title: listing.title,
  address: listing.address,
  description: listing.description,
  house_rules: listing.house_rules,
  max_guests: listing.max_guests,
  price_pounds: penceToPounds(listing.nightly_price_pence),
  cleaning_pounds: penceToPounds(listing.cleaning_charge_pence),
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
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!id) return;
    api
      .get(`/listings/${id}`)
      .then(({ data }) => {
        setForm(fromListing(data.listing));
        setPhotos(data.listing.photos);
      })
      .catch((error) => setFormError(errorMessageFrom(error)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
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
      nightly_price_pence: poundsToPence(form.price_pounds),
      cleaning_charge_pence: poundsToPence(form.cleaning_pounds || 0),
      status: form.status,
      amenity_keys: form.amenities,
      photo_urls: photos,
    };
    try {
      if (id) await api.patch(`/admin/listings/${id}`, { listing });
      else await api.post('/admin/listings', { listing });
      toast.success('Stay saved.');
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
  if (redirect) return <Navigate to="/account/places" />;
  if (loading) return <Spinner />;

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
        <h2 className="font-serif text-3xl leading-tight">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink/60">{hint}</p>}
      </div>
      <div className="grid gap-6">{children}</div>
    </section>
  );

  return (
    <div>
      <AccountNav />
      <form onSubmit={save} className="mx-4 max-w-5xl [&_input]:!my-0 [&_textarea]:!my-0">
        {formError && (
          <p role="alert" className="mb-6 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        )}

        {section('The basics', 'What guests see first on the stays page.', <>
          {field('title', 'Name', <input id="listing-title" type="text" name="title" required maxLength={120} value={form.title} onChange={handleChange} {...invalid('title')} />, { hint: 'Short and clear, for example "Porthmeor Beach Cottage".' })}
          {field('address', 'Area', <input id="listing-address" type="text" name="address" required maxLength={200} value={form.address} onChange={handleChange} {...invalid('address')} />, { hint: 'Town, county, nation. For example "St Ives, Cornwall, England".' })}
        </>)}

        {section('Photos', 'The first photo is the cover. Up to 30.', <>
          <PhotosUploader addedPhotos={photos} setAddedPhotos={setPhotos} />
          {fieldError('photos')}
        </>)}

        {section('Description', 'Tell guests what the stay is like and what is nearby.', <>
          {field('description', 'About this stay', <textarea id="listing-description" name="description" rows={6} value={form.description} onChange={handleChange} {...invalid('description')} />)}
          {field('house_rules', 'House rules', <textarea id="listing-house_rules" name="house_rules" rows={4} value={form.house_rules} onChange={handleChange} {...invalid('house_rules')} />, { hint: 'Check-in and check-out times, smoking, parties, pets.' })}
        </>)}

        {section('Amenities', 'Only ticked items are shown on the listing.', (
          <fieldset>
            <legend className="sr-only">Amenities</legend>
            <Perks selected={form.amenities} handleFormData={handleChange} />
          </fieldset>
        ))}

        {section('Price and guests', 'Prices are in pounds. Guests pay the nightly price plus one cleaning charge.', (
          <div className="grid gap-6 sm:grid-cols-2">
            {field('price_pounds', 'Price per night (£)', <input id="listing-price_pounds" type="number" name="price_pounds" min={1} step="0.01" required value={form.price_pounds} onChange={handleChange} {...invalid('nightly_price_pence')} className="tabular" />, { error: 'nightly_price_pence' })}
            {field('cleaning_pounds', 'Cleaning charge per stay (£)', <input id="listing-cleaning_pounds" type="number" name="cleaning_pounds" min={0} step="0.01" value={form.cleaning_pounds} onChange={handleChange} {...invalid('cleaning_charge_pence')} className="tabular" />, { error: 'cleaning_charge_pence' })}
            {field('max_guests', 'Sleeps up to', <input id="listing-max_guests" type="number" name="max_guests" min={1} max={16} required value={form.max_guests} onChange={handleChange} {...invalid('max_guests')} className="tabular" />)}
            {field('status', 'Visibility', (
              <select id="listing-status" name="status" value={form.status} onChange={handleChange} className="h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-ink focus:border-ink focus:outline-none">
                <option value="published">Published, bookable by guests</option>
                <option value="unlisted">Unlisted, hidden from the stays page</option>
                <option value="draft">Draft, not bookable</option>
              </select>
            ))}
          </div>
        ))}

        <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-ink/15 bg-sand pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            className="h-12 rounded-full bg-ink px-8 text-sm font-medium text-sand transition-colors hover:bg-ink/90 active:scale-[0.98] disabled:opacity-60"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? 'Saving...' : 'Save stay'}
          </button>
          <Link
            to="/account/places"
            className="inline-flex h-12 items-center rounded-full px-5 text-sm text-ink/75 transition-colors hover:text-ink"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default PlacesFormPage;
