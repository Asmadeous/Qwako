import { useState } from 'react';
import { toast } from 'react-toastify';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

import { api, errorMessageFrom } from '../../utils/axios';

const iconButton =
  'grid size-9 place-items-center rounded-full bg-ink/70 text-sand transition-colors hover:bg-ink';

const PhotosUploader = ({ addedPhotos, setAddedPhotos }) => {
  const [photoLink, setPhotoLink] = useState('');
  const [uploading, setUploading] = useState(false);

  // Linked photos are stored as given; the server accepts https links only.
  const addPhotoByLink = () => {
    const link = photoLink.trim();
    if (!link) return;
    if (!link.startsWith('https://')) {
      toast.error('Photo links must start with https://');
      return;
    }
    setAddedPhotos((prev) => (prev.includes(link) ? prev : [...prev, link]));
    setPhotoLink('');
  };

  const uploadPhoto = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (files.length === 0) return;
    const data = new FormData();
    files.forEach((file) => data.append('photos[]', file));
    setUploading(true);
    try {
      const { data: result } = await api.post('/admin/uploads', data);
      setAddedPhotos((prev) => [...prev, ...result.urls]);
    } catch (error) {
      toast.error(errorMessageFrom(error));
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (link) => setAddedPhotos(addedPhotos.filter((photo) => photo !== link));
  const makeCover = (link) => setAddedPhotos([link, ...addedPhotos.filter((photo) => photo !== link)]);

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {addedPhotos.map((link, index) => (
          <figure key={link} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-200">
            <img className="size-full object-cover" src={link} alt={`Photo ${index + 1}`} />
            {index === 0 && (
              <figcaption className="absolute left-2 top-2 rounded-full bg-paper px-2.5 py-1 text-xs font-medium">
                Cover
              </figcaption>
            )}
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              {index !== 0 && (
                <button type="button" aria-label={`Make photo ${index + 1} the cover`} onClick={() => makeCover(link)} className={iconButton}>
                  <Star aria-hidden className="size-4" />
                </button>
              )}
              <button type="button" aria-label={`Remove photo ${index + 1}`} onClick={() => removePhoto(link)} className={iconButton}>
                <Trash2 aria-hidden className="size-4" />
              </button>
            </div>
          </figure>
        ))}
        <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink/30 text-sm text-ink/70 transition-colors hover:border-ink hover:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ink">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={uploadPhoto}
          />
          <ImagePlus aria-hidden strokeWidth={1.5} className="size-6" />
          {uploading ? 'Uploading...' : 'Upload photos'}
        </label>
      </div>

      <div className="flex gap-2">
        <input
          value={photoLink}
          onChange={(e) => setPhotoLink(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addPhotoByLink();
            }
          }}
          type="url"
          aria-label="Photo link"
          placeholder="Or paste a photo link (https://...)"
          className="!my-0 h-11"
        />
        <button
          type="button"
          onClick={addPhotoByLink}
          className="h-11 shrink-0 rounded-full border border-ink/25 px-5 text-sm transition-colors hover:border-ink"
        >
          Add link
        </button>
      </div>
    </div>
  );
};

export default PhotosUploader;
