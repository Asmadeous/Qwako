import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const LoginPage = () => {
  const auth = useAuth();
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

  if (redirect) return <Navigate to="/" />;
  if (auth.loading) return <Spinner />;
  if (auth.user) return <Navigate to="/account" />;

  return (
    <div className="flex grow justify-center px-4 pt-32 pb-24 md:pt-40">
      <div className="w-full max-w-md">
        <h1 className="font-serif text-5xl leading-none md:text-6xl">Sign in</h1>
        <p className="mt-3 mb-8 text-ink/70">Welcome back. Sign in to book a stay or see your bookings.</p>
        <form onSubmit={handleSubmit}>
          {formError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
              {formError}
            </p>
          )}
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
          <button
            className="primary mt-4 mb-0 min-h-12"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 border-t border-ink/15 pt-6 text-ink/70">
          Don't have an account yet?{' '}
          <Link className="text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink" to="/register">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
