import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import { Button } from '@/components/ui/button';
import { api, errorMessageFrom } from '@/utils/axios';
import { useAuth } from '../../hooks';

const linkClass = 'text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { setUser } = useAuth();
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [formError, setFormError] = useState('');
  const [expired, setExpired] = useState(!token);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFieldError('');
    setFormError('');
    try {
      const { data } = await api.patch('/password_reset', { token, password });
      setUser(data.user);
      toast.success('Password changed. You are signed in.');
      setDone(true);
    } catch (error) {
      const body = error?.response?.data?.error;
      if (body?.code === 'invalid_token') setExpired(true);
      else if (body?.details?.password) setFieldError(body.details.password[0]);
      else setFormError(errorMessageFrom(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) return <Navigate to="/account" replace />;

  return (
    <div className="flex grow justify-center px-4 pt-24 pb-24 md:pt-28">
      <div className="w-full max-w-md">
        <h1 className="font-bold tracking-tight text-5xl leading-[1.05] md:text-6xl">Choose a new password</h1>
        {expired ? (
          <div role="alert">
            <p className="mt-3 text-ink/70">
              This reset link has expired or was already used. Links work for 15 minutes and only once.
            </p>
            <Link to="/forgot-password" className={`${linkClass} mt-6 inline-block`}>
              Send a new link
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-3 mb-8 text-ink/70">
              Use at least 8 characters. You'll be signed out on other devices.
            </p>
            <form onSubmit={handleSubmit}>
              {formError && (
                <p role="alert" className="mb-4 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
                  {formError}
                </p>
              )}
              <AuthField
                id="reset-password"
                label="New password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                error={fieldError}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" size="lg" className="mt-4 w-full" disabled={submitting} aria-busy={submitting}>
                {submitting ? 'Saving...' : 'Save new password'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
