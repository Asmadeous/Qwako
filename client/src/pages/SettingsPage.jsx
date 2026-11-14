import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Download, MailCheck } from 'lucide-react';

import AccountNav from '@/components/ui/AccountNav';
import EditProfileDialog from '@/components/ui/EditProfileDialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';

const Section = ({ title, children, description }) => (
  <section className="grid gap-4 border-t border-ink/15 py-8 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10">
    <div>
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {description && <p className="mt-1 text-pretty text-sm text-ink/65">{description}</p>}
    </div>
    <div className="grid content-start gap-4">{children}</div>
  </section>
);

const Toggle = ({ label, hint, checked, onChange, disabled }) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-0.5 size-5 shrink-0 accent-ink"
    />
    <span>
      <span className="block font-medium">{label}</span>
      {hint && <span className="block text-sm text-ink/65">{hint}</span>}
    </span>
  </label>
);

// Phone, emails, privacy: download your data or close your account.
const SettingsPage = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [phone, setPhone] = useState(user.phone ?? '');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState('');
  const [closing, setClosing] = useState(false);
  const [password, setPassword] = useState('');
  const [closeError, setCloseError] = useState('');
  const [busyClose, setBusyClose] = useState(false);

  const save = async (key, payload, message) => {
    setSaving(key);
    try {
      const { data } = await api.patch('/profile', payload);
      setUser(data.user);
      toast.success(message);
      return true;
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      if (key === 'phone') setPhoneError(fields.phone ? `Phone ${fields.phone}` : errorMessageFrom(err));
      else toast.error(errorMessageFrom(err));
      return false;
    } finally {
      setSaving('');
    }
  };

  const resend = async () => {
    try {
      await api.post('/email_verification');
      toast.success(`We sent a new link to ${user.email}.`);
    } catch (err) {
      toast.error(errorMessageFrom(err));
    }
  };

  const closeAccount = async (e) => {
    e.preventDefault();
    setBusyClose(true);
    setCloseError('');
    try {
      await api.delete('/profile', { data: { password } });
      setUser(null);
      navigate('/', { replace: true });
      toast.success('Your account is closed.');
    } catch (err) {
      const fields = fieldErrorsFrom(err);
      setCloseError(fields.password ? 'That password is incorrect.' : errorMessageFrom(err));
    } finally {
      setBusyClose(false);
    }
  };

  return (
    <div className="pb-16">
      <AccountNav />
      <div>
        <div className="mx-4">
          <Section title="Profile" description="Your name, photo and password.">
            <div>
              <EditProfileDialog />
            </div>
          </Section>

          <Section title="Phone" description="So the owner can reach you about your stay. Only the owner's team sees it.">
            <form
              className="grid max-w-sm gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setPhoneError('');
                save('phone', { phone }, 'Phone number saved.');
              }}
            >
              <label htmlFor="phone" className="text-sm font-medium">
                Phone number
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+254 712 345 678"
                aria-invalid={phoneError ? 'true' : undefined}
                aria-describedby={phoneError ? 'phone-error' : undefined}
                className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700"
              />
              {phoneError && (
                <p id="phone-error" className="text-sm text-red-800">
                  {phoneError}
                </p>
              )}
              <Button type="submit" variant="outline" className="justify-self-start" disabled={saving === 'phone'}>
                {saving === 'phone' ? 'Saving...' : 'Save phone'}
              </Button>
            </form>
          </Section>

          <Section title="Email" description={user.email}>
            {user.email_verified ? (
              <p className="flex items-center gap-2 text-sm font-medium">
                <MailCheck aria-hidden className="size-4" />
                Email address confirmed
              </p>
            ) : (
              <div className="grid gap-2 text-sm">
                <p>Your email address isn't confirmed yet. Open the link we emailed you.</p>
                <Button variant="outline" className="justify-self-start" onClick={resend}>
                  Send the link again
                </Button>
              </div>
            )}
            <Toggle
              label="Email me about new messages"
              hint="Booking confirmations, receipts and refunds are always emailed."
              checked={user.email_messages}
              disabled={saving === 'email_messages'}
              onChange={(value) => save('email_messages', { email_messages: value }, 'Email setting saved.')}
            />
            <Toggle
              label="Send me offers and news"
              hint="At most once a month. You can stop at any time."
              checked={user.marketing_consent}
              disabled={saving === 'marketing'}
              onChange={(value) => save('marketing', { marketing_consent: value }, value ? 'You will get offers and news.' : 'No more offers or news.')}
            />
          </Section>

          <Section title="Your data" description="Kenya's Data Protection Act 2019 lets you see and delete what we hold about you.">
            <a
              href={`${api.defaults.baseURL}/profile/export`}
              download
              className="inline-flex h-11 items-center gap-2 justify-self-start rounded-full border border-ink/25 px-6 text-sm font-medium hover:border-ink/60"
            >
              <Download aria-hidden className="size-4" />
              Download my data
            </a>
            <div className="grid gap-2 text-sm">
              <p className="text-ink/70">
                Closing your account removes your name, email, phone and photo and signs you out everywhere. Records of
                past bookings and payments are kept without your details, as the law requires.
              </p>
              <Button variant="danger-outline" className="justify-self-start" onClick={() => setClosing(true)}>
                Close my account
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <Dialog open={closing} onOpenChange={(next) => !busyClose && setClosing(next)}>
        <DialogContent className="max-w-md">
          <form onSubmit={closeAccount} className="grid gap-4">
            <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">Close your account?</DialogTitle>
            <DialogDescription className="text-sm text-ink/75">
              You can't undo this. If you have a stay still to come, cancel it first.
            </DialogDescription>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Your password</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none"
              />
            </label>
            {closeError && (
              <p role="alert" className="text-sm font-semibold text-red-800">
                {closeError}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setClosing(false)} disabled={busyClose}>
                Keep my account
              </Button>
              <Button type="submit" variant="danger" disabled={busyClose || !password} aria-busy={busyClose}>
                {busyClose ? 'Closing...' : 'Close account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SettingsPage;
