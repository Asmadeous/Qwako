import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import useFetch from '@/utils/useFetch';

// One conversation and a reply box. `base` is "/conversations" for guests or
// "/admin/conversations" for the owner's team; `owner` flips whose side is "you".
const ConversationThread = ({ id, base, owner = false, backTo, backLabel }) => {
  const { data, error, loading, reload, setData } = useFetch(`${base}/${id}`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setSendError('');
    try {
      const { data: res } = await api.post(`${base}/${id}/messages`, { body });
      setData({ ...data, messages: [...data.messages, res.message] });
      setBody('');
    } catch (err) {
      setSendError(errorMessageFrom(err));
    } finally {
      setSending(false);
    }
  };

  if (loading && !data) return <ListSkeleton rows={5} />;
  if (error) return <ErrorNote onRetry={reload}>{error}</ErrorNote>;

  const { conversation, messages } = data;
  const mine = (m) => (owner ? m.from_owner : !m.from_owner);

  return (
    <div className="mx-4 pb-16">
      <Link to={backTo} className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm text-ink/70 hover:text-ink">
        <ChevronLeft aria-hidden className="size-4" />
        {backLabel}
      </Link>
      <header className="mt-1 border-b border-ink/15 pb-4">
        <h2 className="text-balance text-2xl font-bold tracking-tight">{conversation.subject}</h2>
        {owner && (
          <p className="mt-1 text-sm text-ink/70">
            {conversation.guest.name}, {conversation.guest.email}
            {conversation.guest_phone && `, ${conversation.guest_phone}`}
          </p>
        )}
        {conversation.booking_id && (
          <Link
            to={owner ? `/account/reservations/${conversation.booking_id}` : `/account/bookings/${conversation.booking_id}`}
            className="mt-1 inline-block text-sm font-medium underline underline-offset-4"
          >
            View the booking
          </Link>
        )}
      </header>

      <ol aria-label="Messages" className="grid gap-3 py-6">
        {messages.map((m) => (
          <li key={m.id} className={cn('flex', mine(m) ? 'justify-end' : 'justify-start')}>
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-4 py-3 text-sm md:max-w-[70%]',
                mine(m) ? 'bg-ink text-sand' : 'border border-ink/15 bg-paper',
              )}
            >
              <p className="whitespace-pre-line text-pretty">{m.body}</p>
              <p className={cn('mt-1.5 text-xs', mine(m) ? 'text-sand/70' : 'text-ink/55')}>
                {mine(m) ? 'You' : m.from_owner ? `${m.sender_name}, T&G BnB` : m.sender_name}, {formatDateTime(m.created_at)}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <div ref={endRef} />

      <form onSubmit={send} className="sticky bottom-3 grid gap-2 rounded-2xl border border-ink/20 bg-paper p-3 shadow-sm">
        <label htmlFor="reply" className="sr-only">
          Reply
        </label>
        <textarea
          id="reply"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send(e);
          }}
          rows={3}
          maxLength={4000}
          placeholder="Write a reply"
          className="w-full resize-y rounded-xl border border-ink/20 bg-sand/40 px-3 py-2 text-sm focus:border-ink focus:outline-none"
        />
        {sendError && (
          <p role="alert" className="text-sm font-semibold text-red-800">
            {sendError}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={sending || !body.trim()} aria-busy={sending}>
            <Send aria-hidden className="size-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConversationThread;
