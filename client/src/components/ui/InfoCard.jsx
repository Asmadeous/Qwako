import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PlaceImg from './PlaceImg';

const actionClass =
  'inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30 disabled:opacity-50';

// One home in the owner's Homes list, with edit, hide/show and delete.
// `onChange` reloads the list after a change.
const InfoCard = ({ place, onChange }) => {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const listed = place.status === 'published';
  const booked = place.bookings_count > 0;
  const upcoming = place.upcoming_count > 0;

  const setStatus = async (status) => {
    setBusy(true);
    setError('');
    try {
      await api.patch(`/admin/listings/${place.id}`, { listing: { status } });
      toast.success(status === 'published' ? `${place.title} is now shown to guests.` : `${place.title} is now hidden from guests.`);
      setConfirming(false);
      await onChange?.();
    } catch (err) {
      const message = errorMessageFrom(err);
      if (confirming) setError(message);
      else toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      await api.delete(`/admin/listings/${place.id}`);
      toast.success(`${place.title} deleted.`);
      setConfirming(false);
      await onChange?.();
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ink/15 bg-paper/60 p-3 sm:flex-row">
      <Link
        to={`/account/places/${place.id}`}
        tabIndex={-1}
        aria-hidden
        className="h-40 w-full shrink-0 overflow-hidden rounded-xl bg-ink/10 sm:h-32 sm:w-44"
      >
        <PlaceImg place={place} className="h-full w-full object-cover" />
      </Link>
      <div className="flex min-w-0 grow flex-col justify-between gap-3 py-1 sm:pr-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <p className="text-sm text-ink/60">{place.address}</p>
            <h2 className="mt-0.5 text-xl font-bold leading-tight tracking-tight">
              <Link to={`/account/places/${place.id}`} className="hover:underline hover:underline-offset-4">
                {place.title}
              </Link>
            </h2>
          </div>
          {!listed && (
            <span className="rounded-full border border-ink/40 px-2.5 py-0.5 text-sm font-medium">
              {place.status === 'draft' ? 'Draft' : 'Hidden from guests'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span className="tabular">{formatPrice(place.nightly_price_cents, place.currency)} a night</span>
            <span>Up to {place.max_guests} guests</span>
            <span className="tabular text-ink/60">
              {place.bookings_count} {place.bookings_count === 1 ? 'booking' : 'bookings'}
            </span>
            {place.category && (
              <span className="rounded-full bg-ink/10 px-2 py-0.5 font-medium">{place.category.name}</span>
            )}
          </p>
          <div className="-mr-1 flex flex-wrap gap-1">
            <Link to={`/account/places/${place.id}`} className={`${actionClass} hover:bg-ink/[0.07]`}>
              <Pencil aria-hidden className="size-4" />
              Edit
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => setStatus(listed ? 'unlisted' : 'published')}
              className={`${actionClass} hover:bg-ink/[0.07]`}
            >
              {listed ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
              {listed ? 'Hide' : 'Show to guests'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError('');
                setConfirming(true);
              }}
              aria-label={`Delete ${place.title}`}
              className={`${actionClass} text-red-800 hover:bg-red-50`}
            >
              <Trash2 aria-hidden className="size-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {upcoming ? (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`${place.title} can't be deleted yet`}
          confirmLabel={listed ? 'Hide from guests' : 'Close'}
          busyLabel="Hiding..."
          busy={busy}
          error={error}
          cancelLabel={listed ? 'Go back' : 'Close'}
          onConfirm={() => (listed ? setStatus('unlisted') : setConfirming(false))}
        >
          <p>
            {place.upcoming_count} {place.upcoming_count === 1 ? 'guest is' : 'guests are'} still due to stay. Cancel
            those bookings first, then delete it.
          </p>
          <p>
            {listed
              ? 'You can hide it now so nobody new can find or book it.'
              : 'It is already hidden, so nobody new can find or book it.'}
          </p>
        </ConfirmDialog>
      ) : (
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Delete ${place.title}?`}
          confirmLabel="Delete home"
          busyLabel="Deleting..."
          busy={busy}
          error={error}
          tone="danger"
          onConfirm={remove}
        >
          {booked ? (
            <p>
              It disappears from the site and from your homes. Its {place.bookings_count}{' '}
              {place.bookings_count === 1 ? 'booking' : 'bookings'} and their payments stay in Bookings and Finances.
              You can't undo this.
            </p>
          ) : (
            <p>The home, its photos and videos are removed from the site. You can't undo this.</p>
          )}
        </ConfirmDialog>
      )}
    </article>
  );
};

export default InfoCard;
