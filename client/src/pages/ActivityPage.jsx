import { useState } from 'react';

import AccountNav from '@/components/ui/AccountNav';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import useFetch from '@/utils/useFetch';

// The admin log: who changed what, newest first.
const ActivityPage = () => {
  const { data, error, loading, reload, setData } = useFetch('/admin/audit_logs');
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState('');

  const loadMore = async () => {
    setMore(true);
    try {
      const { data: next } = await api.get('/admin/audit_logs', { params: { page: data.next_page } });
      setData({ entries: [...data.entries, ...next.entries], next_page: next.next_page });
    } catch (err) {
      setMoreError(errorMessageFrom(err));
    } finally {
      setMore(false);
    }
  };

  return (
    <div className="pb-16">
      <AccountNav description="Every change your team made: homes, bookings, refunds, blocked dates and team members." />
      {loading && <ListSkeleton />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data &&
        (data.entries.length ? (
          <div className="mx-4">
            <ol className="divide-y divide-ink/10 border-y border-ink/10">
              {data.entries.map((e) => (
                <li key={e.id} className="grid gap-1 py-3 text-sm sm:grid-cols-[11rem_minmax(0,1fr)]">
                  <span className="tabular text-ink/60">{formatDateTime(e.created_at)}</span>
                  <span>
                    <span className="font-medium">{e.admin_name}</span>: {e.summary}
                  </span>
                </li>
              ))}
            </ol>
            {moreError && <p role="alert" className="mt-3 text-sm text-red-800">{moreError}</p>}
            {data.next_page && (
              <Button variant="outline" className="mt-6" onClick={loadMore} disabled={more}>
                {more ? 'Loading...' : 'Show older'}
              </Button>
            )}
          </div>
        ) : (
          <EmptyState title="Nothing recorded yet.">Changes to homes, bookings and refunds show here.</EmptyState>
        ))}
    </div>
  );
};

export default ActivityPage;
