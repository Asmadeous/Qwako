import { useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';

// People who can manage the site. New members get an email to choose a password.
const TeamPage = () => {
  const { data, error, loading, reload } = useFetch('/admin/staff');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const add = async (e) => {
    e.preventDefault();
    setAdding(true);
    setFieldErrors({});
    try {
      await api.post('/admin/staff', { name, email });
      toast.success(`${name} was added and emailed a link to choose a password.`);
      setName('');
      setEmail('');
      reload();
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      setFieldErrors(Object.keys(fields).length ? fields : { base: errorMessageFrom(err) });
    } finally {
      setAdding(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setRemoveError('');
    try {
      await api.delete(`/admin/staff/${removing.id}`);
      toast.success(`${removing.name} no longer has access.`);
      setRemoving(null);
      reload();
    } catch (err) {
      setRemoveError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  const input = 'h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700';

  return (
    <div className="pb-16">
      <AccountNav description="Everyone here can manage homes, bookings, refunds and messages. Changes are recorded in the activity log." />
      {loading && <ListSkeleton rows={3} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data && (
        <ul className="mx-4 divide-y divide-ink/10 border-y border-ink/10">
          {data.staff.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span>
                <span className="block font-medium">
                  {m.name} {m.you && <span className="text-ink/55">(you)</span>}
                </span>
                <span className="block text-sm text-ink/65">
                  {m.email}, since {formatDate(m.created_at)}
                  {m.invited && ', not signed in yet'}
                </span>
              </span>
              {!m.you && (
                <Button variant="danger-outline" onClick={() => { setRemoveError(''); setRemoving(m); }}>
                  Remove access
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mx-4 mt-10 grid max-w-xl gap-4 rounded-3xl border border-ink/15 bg-paper p-6">
        <h2 className="text-xl font-bold tracking-tight">Add a team member</h2>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required aria-invalid={fieldErrors.name ? 'true' : undefined} className={input} />
          {fieldErrors.name && <span className="text-sm text-red-800">Name {fieldErrors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={fieldErrors.email ? 'true' : undefined} className={input} />
          {fieldErrors.email && <span className="text-sm text-red-800">Email {fieldErrors.email}</span>}
        </label>
        {fieldErrors.base && <p role="alert" className="text-sm font-semibold text-red-800">{fieldErrors.base}</p>}
        <Button type="submit" className="justify-self-start" disabled={adding} aria-busy={adding}>
          <UserPlus aria-hidden className="size-4" />
          {adding ? 'Adding...' : 'Add and send invite'}
        </Button>
      </form>

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={`Remove ${removing?.name ?? ''}?`}
        confirmLabel="Remove access"
        busyLabel="Removing..."
        busy={busy}
        error={removeError}
        tone="danger"
        onConfirm={remove}
      >
        <p>They're signed out at once and can't manage the site any more. Their account stays as a guest account.</p>
      </ConfirmDialog>
    </div>
  );
};

export default TeamPage;
