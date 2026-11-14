import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { Stars } from '@/components/ui/StarRating';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import { cn } from '@/lib/utils';

const ReviewRow = ({ review, onChange }) => {
  const [reply, setReply] = useState(review.owner_reply ?? '');
  const [busy, setBusy] = useState(false);

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
          <Button
            variant={review.hidden ? 'outline' : 'danger-outline'}
            disabled={busy}
            onClick={() => save({ hidden: !review.hidden }, review.hidden ? 'Review shown again.' : 'Review hidden.')}
          >
            {review.hidden ? 'Show on the home page' : 'Hide (breaks the rules)'}
          </Button>
        </div>
      </form>
    </li>
  );
};

// Guest reviews: reply in public, or hide abusive ones.
const ReviewsPage = () => {
  const { data, error, loading, reload, setData } = useFetch('/admin/reviews');
  return (
    <div className="pb-16">
      <AccountNav description="What guests said after their stays. Replies show under the review on the home's page." />
      {loading && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.reviews.length ? (
          <ul className="mx-4 grid gap-4">
            {data.reviews.map((review) => (
              <ReviewRow
                key={review.id}
                review={review}
                onChange={(updated) => setData({ ...data, reviews: data.reviews.map((r) => (r.id === updated.id ? updated : r)) })}
              />
            ))}
          </ul>
        ) : (
          <EmptyState title="No reviews yet.">Guests are asked to review after they check out.</EmptyState>
        ))}
    </div>
  );
};

export default ReviewsPage;
