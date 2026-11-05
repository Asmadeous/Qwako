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
    <div className="mt-4 flex grow items-center justify-around p-4 md:p-0">
      <div className="mb-40 w-full max-w-md">
        <h1 className="mb-4 text-center text-4xl">Sign in</h1>
        <form className="mx-auto max-w-md" onSubmit={handleSubmit}>
          {formError && (
            <p role="alert" className="mb-3 rounded-[10px] border border-red-700 p-3 text-sm text-red-700">
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
            className="primary my-4 min-h-[44px] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="py-2 text-center text-gray-600">
          Don't have an account yet?{' '}
          <Link className="text-black underline" to="/register">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
