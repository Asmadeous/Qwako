import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { useNotifications } from '@/providers/NotificationsProvider';
import { api } from '@/utils/axios';
import { timeAgo } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';
import { cn } from '@/lib/utils';

const NotificationsPage = () => {
  // The bell's count comes from the provider; this page loads its own page of the list.
  const bell = useNotifications();
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload } = useFetch('/notifications', { page });
  const refresh = () => {
    reload();
    bell.reload();
  };

  const markAll = async () => {
    await api.post('/notifications/read_all').catch(() => {});
    refresh();
  };
  const open = (n) => {
    if (!n.read_at) api.post(`/notifications/${n.id}/read`).then(refresh).catch(() => {});
  };

  return (
    <div className="pb-16">
      <AccountNav
        description="Bookings, payments, refunds and messages."
        actions={
          data?.unread > 0 && (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck aria-hidden className="size-4" />
              Mark all as read
            </Button>
          )
        }
      />
      {loading && !data && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.notifications.length ? (
          <ul className="mx-4 divide-y divide-ink/10 rounded-[28px] bg-paper px-5 sm:px-6">
            {data.notifications.map((n) => (
              <li key={n.id}>
                <Link
                  to={n.url || '#'}
                  onClick={() => open(n)}
                  className="grid grid-cols-[0.75rem_minmax(0,1fr)_auto] items-start gap-3 py-4 hover:bg-ink/[0.03]"
                >
                  <span className={cn('mt-2 size-2 rounded-full', n.read_at ? '' : 'bg-red-700')}>
                    {!n.read_at && <span className="sr-only">New</span>}
                  </span>
                  <span className="min-w-0">
                    <span className={cn('block', n.read_at ? 'font-medium' : 'font-bold')}>{n.title}</span>
                    {n.body && <span className="block text-pretty text-sm text-ink/65">{n.body}</span>}
                  </span>
                  <span className="text-xs text-ink/55">{timeAgo(n.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Nothing new.">Booking updates, refunds and replies to your messages appear here.</EmptyState>
        ))}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="notifications" className="mx-4" />}
    </div>
  );
};

export default NotificationsPage;
