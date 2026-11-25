import { useState } from 'react';
import { toast } from 'react-toastify';
import { UserPlus } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/button';
import { ErrorNote, ListSkeleton } from '@/components/ui/PageStates';
import Pagination, { pageProps } from '@/components/ui/Pagination';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';
import { formatDate } from '@/utils/format';
import useFetch from '@/utils/useFetch';
import usePageParam from '@/utils/usePageParam';

const ROLES = [
  { id: 'staff', label: 'Staff', help: 'Bookings (accept, change dates and guests), calendar, guests, messages and review replies. No money, homes, newsletter, blog, team or deleting.' },
  { id: 'admin', label: 'Owner', help: 'Everything, including money, refunds, homes, the team and deleting.' },
];
const roleLabel = (role) => ROLES.find((r) => r.id === role)?.label ?? role;

// People who run the site: owners (everything) and staff (day-to-day running).
// New members get an email to choose a password.
const TeamPage = () => {
  const [page, setPage] = usePageParam();
  const { data, error, loading, reload } = useFetch('/admin/staff', { page });
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [changing, setChanging] = useState(null); // { member, role }
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
      await api.post('/admin/staff', { name, email, role });
      toast.success(`${name} was added as ${roleLabel(role).toLowerCase()} and emailed a link to choose a password.`);
      setName('');
      setEmail('');
      setRole('staff');
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

  const changeRole = async () => {
    setBusy(true);
    setRemoveError('');
    try {
      await api.patch(`/admin/staff/${changing.member.id}`, { role: changing.role });
      toast.success(`${changing.member.name} is now ${roleLabel(changing.role).toLowerCase()}.`);
      setChanging(null);
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
      <AccountNav description="Owners can do everything. Staff run bookings, the calendar, guests and messages, but can't see money or delete anything. Changes are recorded in the activity log." />
      {loading && !data && <ListSkeleton rows={3} />}
      {error && <ErrorNote onRetry={reload}>{error}</ErrorNote>}
      {data && (
        <ul className="mx-4 divide-y divide-ink/10 rounded-[28px] bg-paper px-5 sm:px-6">
          {data.staff.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <span>
                <span className="block font-medium">
                  {m.name} {m.you && <span className="text-ink/55">(you)</span>}
                  <span className="ml-2 rounded-full border border-ink/20 px-2 py-0.5 text-xs font-medium">{roleLabel(m.role)}</span>
                </span>
                <span className="block text-sm text-ink/65">
                  {m.email}, since {formatDate(m.created_at)}
                  {m.invited && ', not signed in yet'}
                </span>
              </span>
              {!m.you && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRemoveError('');
                      setChanging({ member: m, role: m.role === 'admin' ? 'staff' : 'admin' });
                    }}
                  >
                    {m.role === 'admin' ? 'Make staff' : 'Make owner'}
                  </Button>
                  <Button variant="danger-outline" onClick={() => { setRemoveError(''); setRemoving(m); }}>
                    Remove access
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data && <Pagination {...pageProps(data)} onPage={setPage} label="team members" className="mx-4" />}

      <form onSubmit={add} className="mx-4 mt-10 grid max-w-xl gap-4 rounded-3xl border border-ink/15 bg-paper p-6">
        <h2 className="text-xl font-bold tracking-tight">Add a team member</h2>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} required aria-invalid={fieldErrors.name ? 'true' : undefined} className={input} />
          {fieldErrors.name && <span className="text-sm text-red-800">{fieldErrors.name}</span>}
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required aria-invalid={fieldErrors.email ? 'true' : undefined} className={input} />
          {fieldErrors.email && <span className="text-sm text-red-800">{fieldErrors.email}</span>}
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-medium">Role</legend>
          {ROLES.map((r) => (
            <label key={r.id} className="flex cursor-pointer gap-3 rounded-xl border border-ink/15 p-3 has-[:checked]:border-ink">
              <input type="radio" name="role" value={r.id} checked={role === r.id} onChange={() => setRole(r.id)} className="mt-1" />
              <span>
                <span className="block text-sm font-semibold">{r.label}</span>
                <span className="block text-sm text-ink/65">{r.help}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {fieldErrors.base && <p role="alert" className="text-sm font-semibold text-red-800">{fieldErrors.base}</p>}
        <Button type="submit" className="justify-self-start" disabled={adding} aria-busy={adding}>
          <UserPlus aria-hidden className="size-4" />
          {adding ? 'Adding...' : 'Add and send invite'}
        </Button>
      </form>

      <ConfirmDialog
        open={Boolean(changing)}
        onOpenChange={(open) => !open && setChanging(null)}
        title={`Make ${changing?.member.name ?? ''} ${changing ? roleLabel(changing.role).toLowerCase() : ''}?`}
        confirmLabel={changing?.role === 'admin' ? 'Make owner' : 'Make staff'}
        busyLabel="Saving..."
        busy={busy}
        error={removeError}
        onConfirm={changeRole}
      >
        <p>{ROLES.find((r) => r.id === changing?.role)?.help}</p>
      </ConfirmDialog>

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
