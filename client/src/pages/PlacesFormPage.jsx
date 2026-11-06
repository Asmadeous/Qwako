import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
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

  const heading = (htmlFor, title, hint) => (
    <>
      <label htmlFor={htmlFor} className="mt-8 block font-serif text-3xl">
        {title}
      </label>
      {hint && <p className="font-grotesk text-sm text-ink/60">{hint}</p>}
    </>
  );
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

  return (
    <div className="p-4">
      <AccountNav />
      <form onSubmit={save} className="mx-4 max-w-4xl md:mx-0">
        {formError && (
          <p role="alert" className="rounded-[10px] border border-red-700 p-3 text-sm text-red-700">
            {formError}
          </p>
        )}

        {heading('listing-title', 'Title', 'Short and clear, as shown on the listing card.')}
        <input id="listing-title" type="text" name="title" required maxLength={120} value={form.title} onChange={handleChange} {...invalid('title')} />
        {fieldError('title')}

        {heading('listing-address', 'Area', 'Town, county and nation, for example "St Ives, Cornwall, England". The last part is the nation.')}
        <input id="listing-address" type="text" name="address" required maxLength={200} value={form.address} onChange={handleChange} {...invalid('address')} />
        {fieldError('address')}

        <h2 className="mt-8 font-serif text-3xl">Photos</h2>
        <p className="text-sm text-gray-500">The starred photo is the cover. At most 30.</p>
        <PhotosUploader addedPhotos={photos} setAddedPhotos={setPhotos} />
        {fieldError('photos')}

        {heading('listing-description', 'Description')}
        <textarea id="listing-description" name="description" value={form.description} onChange={handleChange} {...invalid('description')} />
        {fieldError('description')}

        <h2 className="mt-8 font-serif text-3xl">Amenities</h2>
        <Perks selected={form.amenities} handleFormData={handleChange} />

        {heading('listing-house_rules', 'House rules', 'Check-in and check-out times, smoking, parties, pets.')}
        <textarea id="listing-house_rules" name="house_rules" value={form.house_rules} onChange={handleChange} {...invalid('house_rules')} />
        {fieldError('house_rules')}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label htmlFor="listing-max_guests">Max guests</label>
            <input id="listing-max_guests" type="number" name="max_guests" min={1} max={16} required value={form.max_guests} onChange={handleChange} {...invalid('max_guests')} />
            {fieldError('max_guests')}
          </div>
          <div>
            <label htmlFor="listing-price_pounds">Price per night (£)</label>
            <input id="listing-price_pounds" type="number" name="price_pounds" min={1} step="0.01" required value={form.price_pounds} onChange={handleChange} {...invalid('nightly_price_pence')} aria-describedby={errors.nightly_price_pence ? 'listing-nightly_price_pence-error' : undefined} />
            {fieldError('nightly_price_pence')}
          </div>
          <div>
            <label htmlFor="listing-cleaning_pounds">Cleaning charge per stay (£)</label>
            <input id="listing-cleaning_pounds" type="number" name="cleaning_pounds" min={0} step="0.01" value={form.cleaning_pounds} onChange={handleChange} aria-describedby={errors.cleaning_charge_pence ? 'listing-cleaning_charge_pence-error' : undefined} />
            {fieldError('cleaning_charge_pence')}
          </div>
          <div>
            <label htmlFor="listing-status">Visibility</label>
            <select id="listing-status" name="status" value={form.status} onChange={handleChange} className="my-2 w-full rounded-xl border border-ink/25 py-2 px-3">
              <option value="published">Published</option>
              <option value="unlisted">Unlisted</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>

        <button
          className="mx-auto my-10 flex min-h-[44px] rounded-full bg-ink py-3 px-20 font-grotesk text-sm font-medium tracking-[0.12em] text-sand disabled:opacity-70"
          disabled={saving}
          aria-busy={saving}
        >
          {saving ? 'SAVING...' : 'SAVE STAY'}
        </button>
      </form>
    </div>
  );
};

export default PlacesFormPage;
