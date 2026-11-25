import { useState } from 'react';
import { toast } from 'react-toastify';
import { Mail, Plus, Send, Trash2 } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { formatDateTime, plural } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';

// Who gets the newsletter. Adding someone emails them a link to confirm;
// nobody is sent anything until they confirm themselves.
const Readers = ({ onChanged }) => {
  const [page, setPage] = usePageParam('readers', { scroll: false });
  const { data, error, loading, reload } = useFetch('/admin/newsletter_subscribers', { page });
  const [email, setEmail] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      await api.post('/admin/newsletter_subscribers', { email });
      toast.success(`A confirmation email is on its way to ${email}.`);
      setEmail('');
      reload();
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      setAddError(fields.email ? fields.email : errorMessageFrom(err));
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setRemoveError('');
    try {
      await api.delete(`/admin/newsletter_subscribers/${encodeURIComponent(removing.email)}`);
      toast.success(`${removing.email} won't get newsletters any more.`);
      setRemoving(null);
      reload();
      onChanged();
    } catch (err) {
      setRemoveError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-labelledby="readers-heading" className="mx-4 mt-12">
      <h2 id="readers-heading" className="text-xl font-bold tracking-tight">
        Readers
      </h2>
      <form onSubmit={add} className="mt-3 flex max-w-xl flex-wrap gap-2">
        <label className="sr-only" htmlFor="reader-email">
          Email to invite
        </label>
        <input
          id="reader-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@example.com"
          className={`${input} h-11 grow`}
        />
        <Button type="submit" disabled={adding}>
          {adding ? 'Sending...' : 'Invite to subscribe'}
        </Button>
      </form>
      <p className="mt-1.5 text-sm text-ink/65">They get an email and are only added once they confirm.</p>
      {addError && <p role="alert" className="mt-2 text-sm font-semibold text-red-800">{addError}</p>}
      {loading && !data && <div className="mt-4"><ListSkeleton rows={2} /></div>}
      {error && <div className="mt-4"><ErrorNote onRetry={reload}>{error}</ErrorNote></div>}
      {data && (data.subscribers.length === 0 ? (
        <p className="mt-4 text-sm text-ink/70">Nobody has signed up yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-ink/10 rounded-[28px] bg-paper px-5 sm:px-6">
          {data.subscribers.map((r) => (
            <li key={r.email} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <span className="min-w-0 text-sm">
                <span className="block break-all font-medium">{r.name ? `${r.name}, ${r.email}` : r.email}</span>
                <span className="block text-ink/60">
                  {r.status === 'subscribed' ? 'Subscribed' : r.status === 'unsubscribed' ? 'Unsubscribed' : 'Waiting for them to confirm'}
                  {', '}
                  {r.source}
                  {r.since && `, ${formatDateTime(r.since)}`}
                </span>
              </span>
              <Button variant="danger-outline" onClick={() => { setRemoveError(''); setRemoving(r); }}>
                <Trash2 aria-hidden className="size-4" />
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ))}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="readers" />}
      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.email ?? ''}?`}
        confirmLabel="Remove"
        busyLabel="Removing..."
        busy={busy}
        error={removeError}
        tone="danger"
        onConfirm={remove}
      >
        <p>
          They stop getting newsletters.
          {removing?.source === 'guest account' && ' Their account keeps working; "offers and news" is turned off.'}
        </p>
      </ConfirmDialog>
    </section>
  );
};

const input = 'rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700';

// The owner writes a newsletter, sends a test copy to themselves, then sends
// it to everyone who signed up or turned on "offers and news".
const NewsletterPage = () => {
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload } = useFetch('/admin/newsletters', { page });
  const [editing, setEditing] = useState(null); // { id?, subject, body }
  const [fieldErrors, setFieldErrors] = useState({});
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(null); // { kind: 'send' | 'delete', newsletter }
  const [confirmError, setConfirmError] = useState('');
  const [viewing, setViewing] = useState(null);

  const save = async (e) => {
    e?.preventDefault();
    setBusy('save');
    setFieldErrors({});
    try {
      const payload = { newsletter: { subject: editing.subject, body: editing.body } };
      const { data: res } = editing.id
        ? await api.patch(`/admin/newsletters/${editing.id}`, payload)
        : await api.post('/admin/newsletters', payload);
      setEditing({ ...editing, id: res.newsletter.id });
      toast.success('Draft saved.');
      reload();
      return res.newsletter;
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      setFieldErrors(Object.keys(fields).length ? fields : { base: errorMessageFrom(err) });
      return null;
    } finally {
      setBusy('');
    }
  };

  const sendTest = async () => {
    const saved = await save();
    if (!saved) return;
    setBusy('test');
    try {
      const { data: res } = await api.post(`/admin/newsletters/${saved.id}/test`);
      toast.success(`A test copy is on its way to ${res.email}.`);
    } catch (err) {
      toast.error(errorMessageFrom(err));
    } finally {
      setBusy('');
    }
  };

  const confirmAction = async () => {
    setBusy('confirm');
    setConfirmError('');
    try {
      if (confirm.kind === 'send') {
        await api.post(`/admin/newsletters/${confirm.newsletter.id}/deliver`);
        toast.success('The newsletter is being sent.');
      } else {
        await api.delete(`/admin/newsletters/${confirm.newsletter.id}`);
        toast.success('Draft deleted.');
      }
      setConfirm(null);
      setEditing(null);
      reload();
    } catch (err) {
      setConfirmError(errorMessageFrom(err));
    } finally {
      setBusy('');
    }
  };

  const startSend = async () => {
    const saved = await save();
    if (saved) {
      setConfirmError('');
      setConfirm({ kind: 'send', newsletter: saved });
    }
  };

  const audience = data?.audience;

  return (
    <div className="pb-16">
      <AccountNav
        description={
          audience
            ? `${plural(audience.total, 'person', 'people')} will get the next newsletter: ${audience.sign_ups} from the website sign-up and ${plural(audience.guests, 'guest')} who turned on offers and news.`
            : 'Write to everyone who asked for news and offers.'
        }
        actions={
          !editing && (
            <Button onClick={() => { setFieldErrors({}); setEditing({ subject: '', body: '' }); }}>
              <Plus aria-hidden className="size-4" />
              New newsletter
            </Button>
          )
        }
      />
      {loading && !data && <ListSkeleton rows={3} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}

      {editing && (
        <form onSubmit={save} className="mx-4 mb-10 grid max-w-3xl gap-4 rounded-3xl border border-ink/15 bg-paper p-6">
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Subject</span>
            <input
              value={editing.subject}
              onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
              maxLength={150}
              required
              aria-invalid={fieldErrors.subject ? 'true' : undefined}
              className={`${input} h-11`}
            />
            {fieldErrors.subject && <span className="text-sm text-red-800">{fieldErrors.subject}</span>}
          </label>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <span className="text-sm text-ink/65">Leave an empty line between paragraphs. An unsubscribe link is added at the end.</span>
            <textarea
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
              rows={14}
              maxLength={20000}
              required
              aria-invalid={fieldErrors.body ? 'true' : undefined}
              className={`${input} resize-y py-2`}
            />
            {fieldErrors.body && <span className="text-sm text-red-800">{fieldErrors.body}</span>}
          </label>
          {fieldErrors.base && <p role="alert" className="text-sm font-semibold text-red-800">{fieldErrors.base}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline" disabled={Boolean(busy)} aria-busy={busy === 'save'}>
              {busy === 'save' ? 'Saving...' : 'Save draft'}
            </Button>
            <Button type="button" variant="outline" onClick={sendTest} disabled={Boolean(busy)} aria-busy={busy === 'test'}>
              <Mail aria-hidden className="size-4" />
              Send me a test
            </Button>
            <Button type="button" onClick={startSend} disabled={Boolean(busy)}>
              <Send aria-hidden className="size-4" />
              Send to everyone
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={Boolean(busy)}>
              Close
            </Button>
            {editing.id && (
              <Button
                type="button"
                variant="danger-outline"
                className="ml-auto"
                onClick={() => { setConfirmError(''); setConfirm({ kind: 'delete', newsletter: editing }); }}
                disabled={Boolean(busy)}
              >
                Delete draft
              </Button>
            )}
          </div>
        </form>
      )}

      {data && data.newsletters.length === 0 && !editing && (
        <p className="mx-4 text-ink/70">No newsletters yet. Write the first one with "New newsletter".</p>
      )}
      {data && data.newsletters.length > 0 && (
        <ul className="mx-4 divide-y divide-ink/10 rounded-[28px] bg-paper px-5 sm:px-6">
          {data.newsletters.map((n) => (
            <li key={n.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span className="min-w-0">
                <span className="block font-medium">{n.subject}</span>
                <span className="block text-sm text-ink/65">
                  {n.sent_at
                    ? `Sent ${formatDateTime(n.sent_at)}${n.sent_by ? ` by ${n.sent_by}` : ''}, to ${plural(n.recipients_count, 'person', 'people')}`
                    : `Draft, last saved ${formatDateTime(n.updated_at)}`}
                </span>
              </span>
              {n.sent_at ? (
                <Button variant="outline" onClick={() => setViewing(n)}>
                  View
                </Button>
              ) : (
                <Button variant="outline" onClick={() => { setFieldErrors({}); setEditing({ id: n.id, subject: n.subject, body: n.body }); }}>
                  Edit
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="newsletters" className="mx-4" />}

      <Readers onChanged={reload} />

      <Dialog open={Boolean(viewing)} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-h-[85dvh] max-w-2xl overflow-y-auto">
          <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">{viewing?.subject}</DialogTitle>
          <DialogDescription className="text-sm text-ink/65">
            Sent {viewing && formatDateTime(viewing.sent_at)}. A sent newsletter can't be changed or recalled.
          </DialogDescription>
          <div className="grid gap-3 text-sm">
            {viewing?.body.split(/\n\s*\n/).map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => !open && setConfirm(null)}
        title={confirm?.kind === 'send' ? `Send "${confirm.newsletter.subject}"?` : 'Delete this draft?'}
        confirmLabel={confirm?.kind === 'send' ? 'Send now' : 'Delete draft'}
        busyLabel={confirm?.kind === 'send' ? 'Sending...' : 'Deleting...'}
        busy={busy === 'confirm'}
        error={confirmError}
        tone={confirm?.kind === 'send' ? undefined : 'danger'}
        onConfirm={confirmAction}
      >
        <p>
          {confirm?.kind === 'send'
            ? `It goes to ${plural(audience?.total ?? 0, 'person', 'people')} now and can't be changed or recalled after that.`
            : "The draft is removed. This can't be undone."}
        </p>
      </ConfirmDialog>
    </div>
  );
};

export default NewsletterPage;
