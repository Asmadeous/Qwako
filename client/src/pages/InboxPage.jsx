import { useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import AccountNav from '@/components/ui/AccountNav';
import ConversationList from '@/components/ui/ConversationList';
import ConversationThread from '@/components/ui/ConversationThread';
import { Button } from '@/components/ui/button';
import { EmptyState, ErrorNote, ListSkeleton, ViewTabs } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import { cn } from '@/lib/utils';

const ContactMessages = () => {
  const { data, error, loading, reload, setData } = useFetch('/admin/contact_messages');

  const toggle = async (c) => {
    try {
      const { data: res } = await api.post(`/admin/contact_messages/${c.id}/handle`);
      setData({ ...data, contact_messages: data.contact_messages.map((x) => (x.id === c.id ? res.contact_message : x)) });
    } catch (err) {
      toast.error(errorMessageFrom(err));
    }
  };

  if (loading) return <ListSkeleton />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  if (!data.contact_messages.length) {
    return <EmptyState title="No contact form messages.">Messages sent from the Contact page land here.</EmptyState>;
  }
  return (
    <ul className="mx-4 grid gap-3">
      {data.contact_messages.map((c) => (
        <li key={c.id} className={cn('rounded-2xl border p-4', c.handled_at ? 'border-ink/10 opacity-70' : 'border-ink/25 bg-paper')}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-semibold">{c.name}</p>
            <p className="text-xs text-ink/55">{formatDateTime(c.created_at)}</p>
          </div>
          <p className="text-sm">
            <a href={`mailto:${c.email}`} className="underline underline-offset-4">{c.email}</a>
            {c.phone && (
              <>
                {', '}
                <a href={`tel:${c.phone}`} className="underline underline-offset-4">{c.phone}</a>
              </>
            )}
          </p>
          <p className="mt-2 whitespace-pre-line text-pretty text-sm text-ink/85">{c.body}</p>
          <Button variant="outline" className="mt-3" onClick={() => toggle(c)}>
            {c.handled_at ? 'Mark as not dealt with' : 'Mark as dealt with'}
          </Button>
        </li>
      ))}
    </ul>
  );
};

// The owner's inbox: guest conversations and contact form messages.
const InboxPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = ['unread', 'all', 'contact'].includes(searchParams.get('view')) ? searchParams.get('view') : 'all';
  const conversations = useFetch(id || view === 'contact' ? null : '/admin/conversations', { view });

  if (id) {
    return (
      <div>
        <AccountNav />
        <ConversationThread id={id} base="/admin/conversations" owner backTo="/account/inbox" backLabel="Inbox" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <AccountNav description="Guests' questions and messages about their bookings, and the contact form." />
      <ViewTabs
        label="Inbox"
        current={view}
        onChange={(next) => setSearchParams(next === 'all' ? {} : { view: next })}
        tabs={[
          { id: 'all', label: 'All messages' },
          { id: 'unread', label: 'Unread' },
          { id: 'contact', label: 'Contact form' },
        ]}
      />
      {view === 'contact' ? (
        <ContactMessages />
      ) : (
        <>
          {conversations.loading && <ListSkeleton />}
          {conversations.error && <ErrorNote onRetry={conversations.reload}>{conversations.error}</ErrorNote>}
          {conversations.data &&
            (conversations.data.conversations.length ? (
              <ConversationList conversations={conversations.data.conversations} linkBase="/account/inbox" owner />
            ) : (
              <EmptyState title={view === 'unread' ? "You're all caught up." : 'No messages yet.'}>
                When guests ask about a home or a booking, their messages appear here.
              </EmptyState>
            ))}
        </>
      )}
    </div>
  );
};

export default InboxPage;
