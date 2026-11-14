import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import GoogleButton from '@/components/ui/GoogleButton';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import AuthLayout, {
  FormError,
  authLinkClass,
  checkField,
} from '@/components/ui/AuthLayout';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';
import { returnPathFrom } from '@/utils';
import { Button } from '@/components/ui/button';

const FIELDS = ['email', 'password'];
const check = { email: checkField.email, password: checkField.password };

const LoginPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
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
    if (fieldErrors[name])
      setFieldErrors((current) => ({ ...current, [name]: check[name](value) }));
  };

  // Only flag a field once the guest has typed in it and moved on.
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (value)
      setFieldErrors((current) => ({ ...current, [name]: check[name](value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    setFormError('');
    setFocusField(null);

    const errors = Object.fromEntries(
      FIELDS.map((field) => [field, check[field](formData[field])]),
    );
    setFieldErrors(errors);
    const firstInvalid = FIELDS.find((field) => errors[field]);
    if (firstInvalid) {
      setFocusField(firstInvalid);
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    const response = await auth.login({
      ...formData,
      email: formData.email.trim(),
    });
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
          New to T&amp;G BnB?{' '}
          <Link className={authLinkClass} to="/register" state={location.state}>
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError>{formError}</FormError>
        <AuthField
          id="login-email"
          ref={fieldRefs.email}
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          required
          value={formData.email}
          error={fieldErrors.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <AuthField
          id="login-password"
          ref={fieldRefs.password}
          label="Password"
          labelAside={
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-ink/75 underline decoration-ink/30 underline-offset-4 hover:text-ink hover:decoration-ink"
            >
              Forgot password?
            </Link>
          }
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={formData.password}
          error={fieldErrors.password}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <Button
          type="submit"
          size="lg"
          className="mt-2 w-full"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
      <GoogleButton />
    </AuthLayout>
  );
};

export default LoginPage;
