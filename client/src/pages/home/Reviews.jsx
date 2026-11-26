import { format, parseISO } from 'date-fns';

import { Stars } from '@/components/ui/StarRating';
import useFetch from '@/utils/useFetch';
import Section from './Section';

// The newest guest reviews of the published homes. Hidden until there are some.
const Reviews = () => {
  const { data } = useFetch('/reviews');
  const reviews = data?.reviews ?? [];
  if (reviews.length === 0) return null;

  return (
    <Section id="reviews" title="What guests say" className="bg-paper">
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <li key={review.id} className="flex flex-col rounded-2xl border border-ink/10 bg-sand p-6">
            <Stars value={review.rating} />
            {review.comment && <p className="mt-4 grow leading-relaxed text-ink/85">“{review.comment}”</p>}
            <p className="mt-5 text-sm">
              <span className="font-semibold">{review.author_name}</span>
              <span className="text-ink/60">
                {' '}
                stayed at {review.listing_title}, {format(parseISO(review.created_at), 'MMMM yyyy')}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default Reviews;
