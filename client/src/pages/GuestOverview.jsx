import { Link } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ChevronRight, Star } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import BookingDates from '@/components/ui/BookingDates';
import PlaceImg from '@/components/ui/PlaceImg';
import { ErrorNote, Skeleton } from '@/components/ui/PageStates';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { useNotifications } from '@/providers/NotificationsProvider';
import { useSaved } from '@/providers/SavedProvider';
import { bookingStatusLabel } from '@/utils/bookingStatus';
import { readViewed } from '@/utils/recentlyViewed';
import useFetch from '@/utils/useFetch';
import { cn } from '@/lib/utils';

const countdown = (iso) => {
  const days = differenceInCalendarDays(parseISO(iso), new Date());
  if (days <= 0) return 'Check-in is today';
  if (days === 1) return 'Check-in is tomorrow';
  return `Check-in in ${days} days`;
};

// The guest's home page: their next trip first, then what needs doing.
const GuestOverview = () => {
  const { user } = useAuth();
  const { savedIds } = useSaved();
  const notifications = useNotifications();
  const bookings = useFetch('/bookings');
  const conversations = useFetch('/conversations');
  const today = format(new Date(), 'yyyy-MM-dd');
  const list = bookings.data?.bookings ?? [];
  const live = ['confirmed', 'requested', 'pending_payment'];
  const upcoming = list.filter((b) => live.includes(b.status) && b.check_out >= today).sort((a, b) => a.check_in.localeCompare(b.check_in));
  const next = upcoming[0];
  const toReview = list.filter((b) => b.reviewable);
  const unread = conversations.data?.conversations.filter((c) => c.unread).length ?? 0;
  const viewed = readViewed();

  return (
    <div className="pb-16">
      <AccountNav description={`Welcome back, ${user.name.split(' ')[0]}.`} />
      {bookings.error && <ErrorNote onRetry={bookings.reload}>{bookings.error}</ErrorNote>}

      <section aria-labelledby="next-trip" className="mx-4">
        <h2 id="next-trip" className="sr-only">
          Your next trip
        </h2>
        {bookings.loading ? (
          <Skeleton className="h-56 w-full rounded-3xl" />
        ) : next ? (
          <Link
            to={`/account/bookings/${next.id}`}
            className="grid overflow-hidden rounded-3xl border border-ink/15 bg-paper transition-colors hover:border-ink/40 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]"
          >
            <div className="h-48 bg-ink/10 md:h-full">
              <PlaceImg place={next.listing} className="size-full object-cover" />
            </div>
            <div className="grid content-center gap-2 p-6 md:p-8">
              <p className="text-sm font-semibold">{countdown(next.check_in)}</p>
              <p className="text-balance text-3xl font-bold leading-tight tracking-tight">{next.listing.title}</p>
              <BookingDates booking={next} className="text-sm text-ink/75" />
              <p className="text-sm text-ink/65">{bookingStatusLabel(next.status)}</p>
              <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
                Trip details, check-in and receipt <ChevronRight aria-hidden className="size-4" />
              </span>
            </div>
          </Link>
        ) : (
          <div className="rounded-3xl border border-dashed border-ink/25 p-8">
            <p className="text-2xl font-bold tracking-tight">No trips coming up.</p>
            <p className="mt-2 text-sm text-ink/70">Pick a home and your dates; your next trip shows here.</p>
            <Link to="/homes" className={cn(buttonVariants(), 'mt-5')}>
              Browse homes
            </Link>
          </div>
        )}
      </section>

      <section aria-label="Your account at a glance" className="mx-4 mt-6 grid grid-cols-2 overflow-hidden rounded-3xl border border-ink/15 bg-paper md:grid-cols-4">
        {[
          { label: 'Upcoming trips', value: upcoming.length, to: '/account/bookings' },
          { label: 'Saved homes', value: savedIds.size, to: '/account/saved' },
          { label: 'Unread messages', value: unread, to: '/account/messages' },
          { label: 'Notifications', value: notifications.data?.unread ?? 0, to: '/account/notifications' },
        ].map((item, i) => (
          <Link
            key={item.label}
            to={item.to}
            className={cn('p-5 transition-colors hover:bg-ink/[0.04]', i % 2 === 0 && 'border-r border-ink/10', i < 2 && 'border-b border-ink/10 md:border-b-0', i === 1 && 'md:border-r')}
          >
            <span className="block text-sm font-medium text-ink/65">{item.label}</span>
            <span className="tabular mt-2 block text-3xl font-bold tracking-tight">{item.value}</span>
          </Link>
        ))}
      </section>

      {toReview.length > 0 && (
        <section aria-labelledby="to-review" className="mx-4 mt-10">
          <h2 id="to-review" className="text-xl font-bold tracking-tight">
            Tell other guests how it was
          </h2>
          <ul className="mt-3 grid gap-2">
            {toReview.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/account/bookings/${b.id}`}
                  className="flex min-h-12 items-center gap-3 rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm font-medium hover:border-ink/40"
                >
                  <Star aria-hidden className="size-4 shrink-0" />
                  <span className="grow">Review your stay at {b.listing.title}</span>
                  <ChevronRight aria-hidden className="size-4 text-ink/50" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {viewed.length > 0 && (
        <section aria-labelledby="recent" className="mx-4 mt-10">
          <h2 id="recent" className="text-xl font-bold tracking-tight">
            Recently viewed
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {viewed.map((p) => (
              <li key={p.id}>
                <Link to={`/place/${p.id}`} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-ink/10">
                    {p.photo && <img src={p.photo} alt="" className="size-full object-cover" loading="lazy" />}
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold group-hover:underline">{p.title}</p>
                  <p className="truncate text-xs text-ink/60">{p.address}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default GuestOverview;
