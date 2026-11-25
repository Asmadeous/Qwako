import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { PenSquare, Trash2 } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConversationList from '@/components/ui/ConversationList';
import ConversationThread from '@/components/ui/ConversationThread';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { EmptyState, ErrorNote, ListSkeleton, ViewTabs } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { api, errorMessageFrom, fullErrorFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';
import { isOwner } from '@/utils/roles';
import { useAuth } from '../../hooks';
import { cn } from '@/lib/utils';

const field = 'h-11 w-full rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none';

const ContactMessages = ({ owner }) => {
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload, setData } = useFetch('/admin/contact_messages', { page });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const toggle = async (c) => {
    try {
      const { data: res } = await api.post(`/admin/contact_messages/${c.id}/handle`);
      setData({ ...data, contact_messages: data.contact_messages.map((x) => (x.id === c.id ? res.contact_message : x)) });
    } catch (err) {
      toast.error(errorMessageFrom(err));
    }
  };

  const remove = async () => {
    setBusy(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/contact_messages/${deleting.id}`);
      reload();
      setDeleting(null);
      toast.success('Message deleted.');
    } catch (err) {
      setDeleteError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !data) return <ListSkeleton />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;
  if (!data.contact_messages.length) {
    return <EmptyState title="No contact form messages.">Messages sent from the Contact page land here.</EmptyState>;
  }
  return (
    <>
      <ul className="mx-4 grid gap-3">
        {data.contact_messages.map((c) => (
          <li key={c.id} className={cn('rounded-2xl border p-4', c.handled_at ? 'border-ink/10 bg-paper opacity-70' : 'border-ink/25 bg-paper')}>
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
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => toggle(c)}>
                {c.handled_at ? 'Mark as not dealt with' : 'Mark as dealt with'}
              </Button>
              {owner && (
                <Button variant="danger-outline" onClick={() => { setDeleteError(''); setDeleting(c); }}>
                  <Trash2 aria-hidden className="size-4" />
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Pagination {...pageProps(data)} onPage={setPage} label="messages" className="mx-4" />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this message?"
        confirmLabel="Delete message"
        busyLabel="Deleting..."
        busy={busy}
        error={deleteError}
        tone="danger"
        onConfirm={remove}
      >
        <p>The message from {deleting?.name} is removed for good. You can't undo this.</p>
      </ConfirmDialog>
    </>
  );
};

// Write first to any guest, about anything.
const NewConversationDialog = ({ open, onOpenChange }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [guest, setGuest] = useState(null);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setSearch('');
    setGuest(null);
    setSubject('');
    setBody('');
    setError('');
  }, [open]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setMatches([]);
      return undefined;
    }
    const timer = setTimeout(() => {
      api
        .get('/admin/guests', { params: { q: search.trim() } })
        .then(({ data }) => setMatches(data.guests.slice(0, 6)))
        .catch(() => setMatches([]));
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const submit = async (e) => {
    e.preventDefault();
    if (!guest) {
      setError('Pick a guest first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/admin/conversations', { guest_id: guest.id, subject, body });
      onOpenChange(false);
      navigate(`/account/inbox/${data.conversation.id}`);
    } catch (err) {
      setError(fullErrorFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">New message</DialogTitle>
          <DialogDescription className="text-sm text-ink/70">The guest gets it by email and in their account.</DialogDescription>
          {guest ? (
            <p className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper p-3 text-sm">
              <span className="grow">
                To <strong>{guest.name}</strong> <span className="text-ink/60">{guest.email}</span>
              </span>
              <button type="button" onClick={() => setGuest(null)} className="min-h-11 font-medium underline underline-offset-4">
                Change
              </button>
            </p>
          ) : (
            <div className="grid gap-2">
              <label className="grid gap-1.5 text-sm font-medium">
                To
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Guest name, email or phone" className={field} />
              </label>
              {matches.length > 0 && (
                <ul className="divide-y divide-ink/10 rounded-xl border border-ink/15 bg-paper">
                  {matches.map((m) => (
                    <li key={m.id}>
                      <button type="button" onClick={() => setGuest(m)} className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-ink/[0.04]">
                        <strong>{m.name}</strong> <span className="text-ink/60">{m.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <label className="grid gap-1.5 text-sm font-medium">
            Subject
            <input type="text" required maxLength={160} value={subject} onChange={(e) => setSubject(e.target.value)} className={field} />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Message
            <textarea
              required
              rows={5}
              maxLength={4000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Sending...' : 'Send message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// The team's inbox: guest conversations and contact form messages.
// Deleting is for the owner.
const InboxPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const owner = isOwner(user);
  const [searchParams, setSearchParams] = useSearchParams();
  const view = ['unread', 'all', 'contact'].includes(searchParams.get('view')) ? searchParams.get('view') : 'all';
  const [page, setPage] = usePageParam();
  const conversations = useFetch(id || view === 'contact' ? null : '/admin/conversations', { view, page });
  const [writing, setWriting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const deleteConversation = async () => {
    setBusy(true);
    setDeleteError('');
    try {
      await api.delete(`/admin/conversations/${id}`);
      toast.success('Conversation deleted.');
      setDeleting(false);
      navigate('/account/inbox', { replace: true });
    } catch (err) {
      setDeleteError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  if (id) {
    return (
      <div>
        <AccountNav />
        <ConversationThread
          id={id}
          base="/admin/conversations"
          owner
          backTo="/account/inbox"
          backLabel="Inbox"
          actions={
            owner && (
              <Button variant="danger-outline" onClick={() => { setDeleteError(''); setDeleting(true); }}>
                <Trash2 aria-hidden className="size-4" />
                Delete
              </Button>
            )
          }
        />
        <ConfirmDialog
          open={deleting}
          onOpenChange={(open) => !open && setDeleting(false)}
          title="Delete this conversation?"
          confirmLabel="Delete conversation"
          busyLabel="Deleting..."
          busy={busy}
          error={deleteError}
          tone="danger"
          onConfirm={deleteConversation}
        >
          <p>Every message and file in it is removed for good, for you and for the guest. You can't undo this.</p>
        </ConfirmDialog>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <AccountNav
        description="Guests' questions and messages about their bookings, and the contact form."
        actions={
          <Button onClick={() => setWriting(true)}>
            <PenSquare aria-hidden className="size-4" />
            New message
          </Button>
        }
      />
      <NewConversationDialog open={writing} onOpenChange={setWriting} />
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
        <ContactMessages owner={owner} />
      ) : (
        <>
          {conversations.loading && !conversations.data && <ListSkeleton />}
          {conversations.error && <ErrorNote onRetry={conversations.reload}>{conversations.error}</ErrorNote>}
          {conversations.data &&
            (conversations.data.conversations.length ? (
              <>
                <ConversationList conversations={conversations.data.conversations} linkBase="/account/inbox" owner />
                <Pagination {...pageProps(conversations.data)} onPage={setPage} label="conversations" className="mx-4" />
              </>
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
