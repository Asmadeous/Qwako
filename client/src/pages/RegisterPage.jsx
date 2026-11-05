import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import AuthField from '@/components/ui/AuthField';
import Spinner from '@/components/ui/Spinner';
import { useAuth } from '../../hooks';

const FIELDS = ['name', 'email', 'password'];

const RegisterPage = () => {
  const auth = useAuth();
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

  if (redirect) return <Navigate to="/" />;
  if (auth.loading) return <Spinner />;
  if (auth.user) return <Navigate to="/account" />;

  return (
    <div className="mt-4 flex grow items-center justify-around p-4 md:p-0">
      <div className="mb-40 w-full max-w-md">
        <h1 className="mb-4 text-center text-4xl">Sign up</h1>
        <form className="mx-auto max-w-md" onSubmit={handleSubmit}>
          {formError && (
            <p role="alert" className="mb-3 rounded-[10px] border border-red-700 p-3 text-sm text-red-700">
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
            className="primary my-2 min-h-[44px] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <div className="py-2 text-center text-gray-600">
          Already have an account?{' '}
          <Link className="text-black underline" to="/login">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
