import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';
import { returnPathFrom } from '@/utils';

const FIELDS = ['name', 'email', 'password'];

const RegisterPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const inFlight = useRef(false);
  const fieldRefs = { name: useRef(null), email: useRef(null), password: useRef(null) };

  const [failedSubmits, setFailedSubmits] = useState(0);

  // Move focus only after a failed submit, not while the user edits fields.
  useEffect(() => {
    const firstInvalid = FIELDS.find((field) => fieldErrors[field]);
    if (firstInvalid) fieldRefs[firstInvalid].current?.focus();
  }, [failedSubmits]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({ ...current, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(({ [name]: _cleared, ...rest }) => rest);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    setFormError('');

    const response = await auth.register(formData);

    inFlight.current = false;
    setSubmitting(false);
    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
      return;
    }
    setFieldErrors(response.fieldErrors);
    setFormError(response.message);
    setFailedSubmits((count) => count + 1);
  };

  if (redirect) return <Navigate to={returnPathFrom(location.state)} replace />;
  if (auth.loading) return <Spinner />;
  if (auth.user) return <Navigate to="/account" />;

  return (
    <div className="flex grow justify-center px-4 pt-32 pb-24 md:pt-40">
      <div className="w-full max-w-md">
        <h1 className="font-bold tracking-tight text-5xl leading-none md:text-6xl">Create an account</h1>
        <p className="mt-3 mb-8 text-ink/70">Book stays directly with the owner. It takes a minute.</p>
        <form onSubmit={handleSubmit}>
          {formError && (
            <p role="alert" className="mb-4 rounded-xl border border-red-700/40 bg-red-50 p-3 text-sm text-red-800">
              {formError}
            </p>
          )}
          <AuthField
            id="register-name"
            ref={fieldRefs.name}
            label="Full name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            value={formData.name}
            error={fieldErrors.name}
            onChange={handleChange}
          />
          <AuthField
            id="register-email"
            ref={fieldRefs.email}
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={formData.email}
            error={fieldErrors.email}
            onChange={handleChange}
          />
          <AuthField
            id="register-password"
            ref={fieldRefs.password}
            label="Password (at least 8 characters)"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={72}
            value={formData.password}
            error={fieldErrors.password}
            onChange={handleChange}
          />
          <button
            className="primary mt-4 mb-0 min-h-12"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 border-t border-ink/15 pt-6 text-ink/70">
          Already have an account?{' '}
          <Link className="text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink" to="/login" state={location.state}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
