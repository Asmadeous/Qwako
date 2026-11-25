import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, FileText, Paperclip, Send, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatDateTime } from '@/utils/format';
import { cn } from '@/lib/utils';
import useFetch from '@/utils/useFetch';
import { getConsumer } from '@/utils/cable';

// One conversation and a reply box. `base` is "/conversations" for guests or
// "/admin/conversations" for the owner's team; `owner` flips whose side is "you".
const MAX_FILES = 10;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const fileSize = (bytes) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

// Files sent with a message: pictures show small, anything else as a download.
const MessageFiles = ({ files, mine }) => (
  <ul className="mb-2 grid gap-2">
    {files.map((f) => (
      <li key={f.id}>
        {f.preview_url ? (
          <a href={f.url} download={f.name} className="block" aria-label={`Download ${f.name}`}>
            <img src={f.preview_url} alt={f.name} loading="lazy" className="max-h-60 rounded-xl object-cover" />
          </a>
        ) : (
          <a
            href={f.url}
            download={f.name}
            className={cn(
              'flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 underline-offset-4 hover:underline',
              mine ? 'bg-sand/15' : 'bg-sand/60',
            )}
          >
            <FileText aria-hidden className="size-4 shrink-0" />
            <span className="min-w-0 truncate font-medium">{f.name}</span>
            <span className={cn('shrink-0 text-xs', mine ? 'text-sand/70' : 'text-ink/55')}>{fileSize(f.size)}</span>
          </a>
        )}
      </li>
    ))}
  </ul>
);

// `actions` sit beside the subject, for example the owner's Delete button.
const ConversationThread = ({ id, base, owner = false, backTo, backLabel, actions }) => {
  const { data, error, loading, reload, setData } = useFetch(`${base}/${id}`);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [files, setFiles] = useState([]);
  const endRef = useRef(null);
  const fileInputRef = useRef(null);

  const addFiles = (picked) => {
    const next = [...files, ...picked];
    const tooBig = next.filter((f) => f.size > MAX_FILE_BYTES);
    if (tooBig.length) setSendError(`Files must be 25 MB or smaller: ${tooBig.map((f) => f.name).join(', ')}.`);
    else if (next.length > MAX_FILES) setSendError(`You can send up to ${MAX_FILES} files at a time.`);
    else setSendError('');
    setFiles(next.filter((f) => f.size <= MAX_FILE_BYTES).slice(0, MAX_FILES));
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [data?.messages?.length]);

  // New messages appear as they are sent, from either side.
  useEffect(() => {
    const subscription = getConsumer().subscriptions.create(
      { channel: 'ConversationChannel', id },
      {
        received: ({ message }) => {
          if (!message) return;
          setData((current) =>
            current && !current.messages.some((m) => m.id === message.id)
              ? { ...current, messages: [...current.messages, message] }
              : current,
          );
        },
      },
    );
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim() && !files.length) return;
    setSending(true);
    setSendError('');
    try {
      const form = new FormData();
      form.append('body', body);
      files.forEach((f) => form.append('files[]', f));
      const { data: res } = await api.post(`${base}/${id}/messages`, form);
      setData((current) =>
        current.messages.some((m) => m.id === res.message.id)
          ? current
          : { ...current, messages: [...current.messages, res.message] },
      );
      setBody('');
      setFiles([]);
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-balance text-2xl font-bold tracking-tight">{conversation.subject}</h2>
          {actions}
        </div>
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
              {m.files?.length > 0 && <MessageFiles files={m.files} mine={mine(m)} />}
              {m.body && <p className="whitespace-pre-line text-pretty">{m.body}</p>}
              <p className={cn('mt-1.5 text-xs', mine(m) ? 'text-sand/70' : 'text-ink/55')}>
                {mine(m) ? 'You' : m.from_owner ? `${m.sender_name}, TG Homes` : m.sender_name}, {formatDateTime(m.created_at)}
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
        {files.length > 0 && (
          <ul aria-label="Files to send" className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-1 rounded-full bg-sand/60 py-1 pl-3 pr-1 text-xs">
                <span className="max-w-48 truncate font-medium">{f.name}</span>
                <span className="text-ink/55">{fileSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  aria-label={`Remove ${f.name}`}
                  className="grid size-7 place-items-center rounded-full hover:bg-ink/10"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {sendError && (
          <p role="alert" className="text-sm font-semibold text-red-800">
            {sendError}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              addFiles(Array.from(e.target.files || []));
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending || files.length >= MAX_FILES}
          >
            <Paperclip aria-hidden className="size-4" />
            Attach files
          </Button>
          <Button type="submit" disabled={sending || (!body.trim() && !files.length)} aria-busy={sending}>
            <Send aria-hidden className="size-4" />
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ConversationThread;
