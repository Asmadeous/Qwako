import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Check } from 'lucide-react';

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

const FIELDS = ['name', 'email', 'password'];
const check = {
  name: checkField.name,
  email: checkField.email,
  password: checkField.newPassword,
};

const RegisterPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const inFlight = useRef(false);
  const fieldRefs = {
    name: useRef(null),
    email: useRef(null),
    password: useRef(null),
  };
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
    const response = await auth.register({
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
    });
    inFlight.current = false;
    setSubmitting(false);

    if (response.success) {
      toast.success(response.message);
      setRedirect(true);
      return;
    }
    const serverErrors = response.fieldErrors || {};
    setFieldErrors(serverErrors);
    const firstServerError = FIELDS.find((field) => serverErrors[field]);
    // Field problems show under their field; anything else shows at the top.
    if (firstServerError) setFocusField(firstServerError);
    else setFormError(response.message);
  };

  if (redirect)
    return <Navigate to={returnPathFrom(location.state, '/homes')} replace />;
  if (auth.loading) return <Spinner />;
  if (auth.user) return <Navigate to="/account" />;

  const longEnough = formData.password.length >= 8;

  return (
    <AuthLayout
      title="Create an account"
      intro="Book homes directly with the owner. It takes a minute."
      footer={
        <>
          Already have an account?{' '}
          <Link className={authLinkClass} to="/login" state={location.state}>
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate>
        <FormError>{formError}</FormError>
        <AuthField
          id="register-name"
          ref={fieldRefs.name}
          label="Full name"
          name="name"
          type="text"
          autoComplete="name"
          autoFocus
          required
          maxLength={100}
          value={formData.name}
          error={fieldErrors.name}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <AuthField
          id="register-email"
          ref={fieldRefs.email}
          label="Email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={formData.email}
          error={fieldErrors.email}
          onChange={handleChange}
          onBlur={handleBlur}
        />
        <AuthField
          id="register-password"
          ref={fieldRefs.password}
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          maxLength={72}
          value={formData.password}
          error={fieldErrors.password}
          hint={
            <span
              className={`inline-flex items-center gap-1.5 ${longEnough ? 'font-medium text-ink' : ''}`}
            >
              {longEnough && (
                <Check
                  aria-hidden
                  strokeWidth={2.5}
                  className="size-4 text-emerald-700"
                />
              )}
              At least 8 characters
            </span>
          }
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
          {submitting ? 'Creating account...' : 'Create account'}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
