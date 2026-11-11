import { useState } from 'react';
import { Link } from 'react-router-dom';

import AuthField from '@/components/ui/AuthField';
import AuthLayout, {
  FormError,
  authLinkClass,
} from '@/components/ui/AuthLayout';
import { Button } from '@/components/ui/button';
import { api, errorMessageFrom } from '@/utils/axios';

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
    <AuthLayout
      title="Reset your password"
      intro={
        sentTo
          ? null
          : "Enter the email you signed up with and we'll send you a reset link."
      }
      footer={
        <>
          Remembered it?{' '}
          <Link className={authLinkClass} to="/login">
            Sign in
          </Link>
        </>
      }
    >
      {sentTo ? (
        <div role="status">
          <p className="text-ink/70">
            If there's an account for{' '}
            <span className="font-semibold text-ink">{sentTo}</span>, we've
            emailed it a link to choose a new password. The link works for 15
            minutes.
          </p>
          <p className="mt-3 text-ink/70">
            Nothing there? Check your spam folder, or try again with another
            email.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setSentTo('')}
          >
            Use another email
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormError>{formError}</FormError>
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
          <Button
            type="submit"
            size="lg"
            className="mt-4 w-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
