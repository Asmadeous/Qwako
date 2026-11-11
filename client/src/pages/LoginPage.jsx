import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import AuthLayout, {
  FormError,
  authLinkClass,
} from '@/components/ui/AuthLayout';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';
import { returnPathFrom } from '@/utils';
import { Button } from '@/components/ui/button';

const LoginPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const inFlight = useRef(false);
  const fieldRefs = { email: useRef(null), password: useRef(null) };
  const [focusField, setFocusField] = useState(null);

  useEffect(() => {
    if (focusField) fieldRefs[focusField].current?.focus();
  }, [focusField]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError('');
    setFocusField(null);

    const response = await auth.login(formData);

    inFlight.current = false;
    setSubmitting(false);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
      return;
    }
    setFormError(response.message);
    if (response.code === 'invalid_credentials') {
      setFormData((current) => ({ ...current, password: '' }));
      setFocusField('password');
    }
  };

  if (redirect)
    return <Navigate to={returnPathFrom(location.state, '/account')} replace />;
  if (auth.loading) return <Spinner />;
  if (auth.user) return <Navigate to="/account" />;

  return (
    <AuthLayout
      title="Sign in"
      intro="Welcome back. Sign in to book a home or see your bookings."
      footer={
        <>
          New here?{' '}
          <Link className={authLinkClass} to="/register" state={location.state}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FormError>{formError}</FormError>
        <AuthField
          id="login-email"
          ref={fieldRefs.email}
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={formData.email}
          onChange={handleChange}
        />
        <AuthField
          id="login-password"
          ref={fieldRefs.password}
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          onChange={handleChange}
        />
        <div className="-mt-2 flex justify-end">
          <Link
            to="/forgot-password"
            className="inline-flex min-h-11 items-center text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink"
          >
            Forgot your password?
          </Link>
        </div>
        <Button
          type="submit"
          size="lg"
          className="mt-4 w-full"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
