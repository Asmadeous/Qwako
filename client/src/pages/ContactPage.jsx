import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom, fieldErrorsFrom } from '@/utils/axios';

const field = 'h-11 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700';

// Anyone can write to the owner; it lands in the owner's inbox.
const ContactPage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '', body: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError('');
    try {
      await api.post('/contact_messages', { contact_message: form });
      setSent(true);
    } catch (err) {
      setErrors(fieldErrorsFrom(err));
      setFormError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-24 pb-24 md:pt-28">
      <h1 className="text-5xl font-bold leading-[1.05] tracking-tight">Contact us</h1>
      <p className="mt-3 text-ink/70">Questions about a home, a group booking or your stay. We usually reply within a day.</p>
      {sent ? (
        <div role="status" className="mt-8 rounded-2xl border border-ink/20 bg-paper p-6">
          <p className="text-2xl font-bold tracking-tight">Message sent.</p>
          <p className="mt-2 text-sm text-ink/70">We'll reply to {form.email}.</p>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-8 grid gap-4">
          {[
            { key: 'name', label: 'Your name', autoComplete: 'name' },
            { key: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
            { key: 'phone', label: 'Phone (optional)', type: 'tel', autoComplete: 'tel' },
          ].map(({ key, label, type = 'text', autoComplete }) => (
            <label key={key} className="grid gap-1.5">
              <span className="text-sm font-medium">{label}</span>
              <input
                type={type}
                autoComplete={autoComplete}
                value={form[key]}
                onChange={set(key)}
                aria-invalid={errors[key] ? 'true' : undefined}
                className={field}
              />
              {errors[key] && <span className="text-sm text-red-800">{label.replace(' (optional)', '')} {errors[key]}</span>}
            </label>
          ))}
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Message</span>
            <textarea
              value={form.body}
              onChange={set('body')}
              rows={6}
              maxLength={4000}
              aria-invalid={errors.body ? 'true' : undefined}
              className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none aria-[invalid=true]:border-red-700"
            />
            {errors.body && <span className="text-sm text-red-800">Message {errors.body}</span>}
          </label>
          {formError && !Object.keys(errors).length && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {formError}
            </p>
          )}
          <Button type="submit" size="lg" className="justify-self-start" disabled={busy} aria-busy={busy}>
            {busy ? 'Sending...' : 'Send message'}
          </Button>
        </form>
      )}
    </div>
  );
};

export default ContactPage;
