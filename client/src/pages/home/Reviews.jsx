import { useEffect, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';

import { Stars } from '@/components/ui/StarRating';
import useFetch from '@/utils/useFetch';
import Section from './Section';

const pad = (n) => String(n).padStart(2, '0');
const EVERY = 5000; // ms between automatic moves

// The newest guest reviews of the published homes, as a carousel that moves on
// its own: one card on a phone, two on a tablet, three on a laptop. It waits
// while a visitor hovers, touches or tabs into it, and can be paused. Hidden
// until there are some reviews.
const Reviews = () => {
  const { data } = useFetch('/reviews');
  const reviews = data?.reviews ?? [];
  const track = useRef(null);
  const [first, setFirst] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const [stopped, setStopped] = useState(false); // the pause button
  const [holding, setHolding] = useState(false); // hover, touch or focus
  const [restart, setRestart] = useState(0); // a manual move restarts the wait

  // The distance from one card to the next, gap included.
  const step = () => {
    const [a, b] = track.current.children;
    return b ? b.offsetLeft - a.offsetLeft : track.current.clientWidth;
  };

  useEffect(() => {
    if (reviews.length < 2 || stopped || holding) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setInterval(() => {
      const el = track.current;
      if (!el || document.hidden) return;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 2;
      el.scrollTo({ left: end ? 0 : el.scrollLeft + step(), behavior: 'smooth' });
    }, EVERY);
    return () => clearInterval(timer);
  }, [reviews.length, stopped, holding, restart]);

  if (reviews.length === 0) return null;

  const onScroll = () => {
    const el = track.current;
    setFirst(Math.round(el.scrollLeft / step()));
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  const move = (direction) => {
    track.current.scrollBy({ left: direction * step(), behavior: 'smooth' });
    setRestart((n) => n + 1);
  };
  const hold = {
    onMouseEnter: () => setHolding(true),
    onMouseLeave: () => setHolding(false),
    onTouchStart: () => setHolding(true),
    onTouchEnd: () => setHolding(false),
    onFocus: () => setHolding(true),
    onBlur: () => setHolding(false),
  };

  const arrow =
    'grid size-11 place-items-center rounded-full border border-ink/25 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-sand disabled:pointer-events-none disabled:opacity-30';

  return (
    <Section
      id="reviews"
      title="What guests say"
      className="bg-paper"
      aside={
        <div className="flex items-center gap-4">
          <span className="tabular text-sm font-medium text-ink/60" aria-hidden>
            {pad(first + 1)} / {pad(reviews.length)}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className={arrow}
              onClick={() => setStopped((s) => !s)}
              aria-label={stopped ? 'Play reviews' : 'Pause reviews'}
            >
              {stopped ? <Play aria-hidden className="size-4" /> : <Pause aria-hidden className="size-4" />}
            </button>
            <button type="button" className={arrow} onClick={() => move(-1)} disabled={first === 0} aria-label="Previous review">
              <ArrowLeft aria-hidden className="size-4" />
            </button>
            <button type="button" className={arrow} onClick={() => move(1)} disabled={atEnd} aria-label="Next review">
              <ArrowRight aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      }
    >
      <ul
        ref={track}
        onScroll={onScroll}
        {...hold}
        aria-label="Guest reviews"
        className="-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-6 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:mx-0 md:scroll-px-0 md:px-0 [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((review) => (
          <li
            key={review.id}
            className="flex shrink-0 basis-[85%] snap-start flex-col rounded-2xl border border-ink/10 bg-sand p-6 sm:basis-[calc((100%-1.5rem)/2)] lg:basis-[calc((100%-3rem)/3)]"
          >
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
