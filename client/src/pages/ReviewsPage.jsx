import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Trash2 } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { Stars } from '@/components/ui/StarRating';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';
import { cn } from '@/lib/utils';
import { isOwner } from '@/utils/roles';
import { useAuth } from '../../hooks';

// Staff reply; hiding and deleting are for the owner. Reviews come only from guests.
const ReviewRow = ({ review, onChange, onDeleted, owner }) => {
  const [reply, setReply] = useState(review.owner_reply ?? '');
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const remove = async () => {
    setBusy(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/reviews/${review.id}`);
      setDeleting(false);
      onDeleted(review);
      toast.success('Review deleted.');
    } catch (err) {
      setDeleteError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const save = async (payload, message) => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/admin/reviews/${review.id}`, payload);
      onChange(data.review);
      toast.success(message);
    } catch (err) {
      toast.error(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className={cn('rounded-2xl border p-5', review.hidden ? 'border-ink/10 bg-ink/[0.03]' : 'border-ink/20 bg-paper')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p>
          <span className="font-semibold">{review.author_name}</span> on{' '}
          <Link to={`/account/reservations/${review.booking_id}`} className="underline underline-offset-4">
            {review.listing_title}
          </Link>
        </p>
        <p className="text-xs text-ink/55">{formatDate(review.created_at)}</p>
      </div>
      <Stars value={review.rating} className="mt-1" />
      {review.comment && <p className="mt-2 text-pretty text-sm text-ink/85">{review.comment}</p>}
      {review.hidden && <p className="mt-2 text-sm font-semibold">Hidden from the home's page.</p>}
      <form
        className="mt-4 grid gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          save({ owner_reply: reply }, reply.trim() ? 'Reply saved. It shows under the review.' : 'Reply removed.');
        }}
      >
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Your public reply</span>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={2}
            maxLength={2000}
            className="rounded-xl border border-ink/25 bg-sand/40 px-3 py-2 focus:border-ink focus:outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="outline" disabled={busy}>
            Save reply
          </Button>
          {owner && (
            <>
              <Button
                variant={review.hidden ? 'outline' : 'danger-outline'}
                disabled={busy}
                onClick={() => save({ hidden: !review.hidden }, review.hidden ? 'Review shown again.' : 'Review hidden.')}
              >
                {review.hidden ? 'Show on the home page' : 'Hide (breaks the rules)'}
              </Button>
              <Button variant="danger-outline" disabled={busy} onClick={() => { setDeleteError(''); setDeleting(true); }}>
                <Trash2 aria-hidden className="size-4" />
                Delete
              </Button>
            </>
          )}
        </div>
      </form>
      <ConfirmDialog
        open={deleting}
        onOpenChange={(open) => !open && setDeleting(false)}
        title="Delete this review?"
        confirmLabel="Delete review"
        busyLabel="Deleting..."
        busy={busy}
        error={deleteError}
        tone="danger"
        onConfirm={remove}
      >
        <p>
          {review.author_name}'s {review.rating}-star review of {review.listing_title} is removed for good, and the home's
          rating is worked out again. To keep it on record but off the home's page, hide it instead. You can't undo this.
        </p>
      </ConfirmDialog>
    </li>
  );
};

// Guest reviews: reply in public, or hide abusive ones.
const ReviewsPage = () => {
  const { user } = useAuth();
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload, setData } = useFetch('/admin/reviews', { page });
  return (
    <div className="pb-16">
      <AccountNav description="What guests said after their stays. Replies show under the review on the home's page." />
      {loading && !data && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.reviews.length ? (
          <ul className="mx-4 grid gap-4">
            {data.reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                owner={isOwner(user)}
                onChange={(updated) => setData({ ...data, reviews: data.reviews.map((r) => (r.id === updated.id ? updated : r)) })}
                onDeleted={reload}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews yet.">Guests are asked to review after they check out.</EmptyState>
        ))}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="reviews" className="mx-4" />}
    </div>
  );
};

export default ReviewsPage;
