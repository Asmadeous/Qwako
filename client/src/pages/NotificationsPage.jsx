import { Link } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { useNotifications } from '@/providers/NotificationsProvider';
import { api } from '@/utils/axios';
import { timeAgo } from '@/utils/format';
import { cn } from '@/lib/utils';

const NotificationsPage = () => {
  const { data, error, loading, reload } = useNotifications();

  const markAll = async () => {
    await api.post('/notifications/read_all').catch(() => {});
    reload();
  };
  const open = (n) => {
    if (!n.read_at) api.post(`/notifications/${n.id}/read`).then(reload).catch(() => {});
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
          <ul className="mx-4 divide-y divide-ink/10 border-y border-ink/10">
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
    </div>
  );
};

export default NotificationsPage;
