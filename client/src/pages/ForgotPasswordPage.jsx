import { useState } from 'react';
import { Link } from 'react-router-dom';

import AuthField from '@/components/ui/AuthField';
import { Button } from '@/components/ui/button';
import { api, errorMessageFrom } from '@/utils/axios';

const linkClass = 'text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/password_reset', { email });
      setSentTo(email.trim());
    } catch (error) {
      setFormError(errorMessageFrom(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex grow justify-center px-4 pt-24 pb-24 md:pt-28">
      <div className="w-full max-w-md">
        <h1 className="font-bold tracking-tight text-5xl leading-[1.05] md:text-6xl">Reset your password</h1>
        {sentTo ? (
          <div role="status">
            <p className="mt-3 text-ink/70">
              If there's an account for <span className="font-semibold text-ink">{sentTo}</span>, we've emailed it a
              link to choose a new password. The link works for 15 minutes.
            </p>
            <p className="mt-3 text-ink/70">Nothing there? Check your spam folder, or try again with another email.</p>
            <Button variant="outline" className="mt-6" onClick={() => setSentTo('')}>
              Use another email
            </Button>
          </div>
        ) : (
          <>
            <p className="mt-3 mb-8 text-ink/70">Enter the email you signed up with and we'll send you a reset link.</p>
            <form onSubmit={handleSubmit}>
              {formError && (
                <p role="alert" className="mb-4 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
                  {formError}
                </p>
              )}
              <AuthField
                id="reset-email"
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button type="submit" size="lg" className="mt-4 w-full" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          </>
        )}
        <p className="mt-6 border-t border-ink/15 pt-6 text-ink/70">
          Remembered it?{' '}
          <Link className={linkClass} to="/login">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
