import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import GoogleButton from '@/components/ui/GoogleButton';
import { Check } from 'lucide-react';

import AuthField from '@/components/ui/AuthField';
import AuthLayout, {
  FormError,
  authLinkClass,
  checkField,
} from '@/components/ui/AuthLayout';
import Spinner from '@/components/ui/Spinner';
import ResendConfirmation from '@/components/ui/ResendConfirmation';
import { useAuth } from '../../hooks';
import { Button } from '@/components/ui/button';

const FIELDS = ['name', 'email', 'phone', 'password'];
const check = {
  name: checkField.name,
  email: checkField.email,
  phone: checkField.phone,
  password: checkField.newPassword,
};

const RegisterPage = () => {
  const auth = useAuth();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const inFlight = useRef(false);
  const fieldRefs = {
    name: useRef(null),
    email: useRef(null),
    phone: useRef(null),
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
      phone: formData.phone.trim(),
    });
    inFlight.current = false;
    setSubmitting(false);

    if (response.success) {
      setSentTo(response.email);
      return;
    }
    const serverErrors = response.fieldErrors || {};
    setFieldErrors(serverErrors);
    const firstServerError = FIELDS.find((field) => serverErrors[field]);
    // Field problems show under their field; anything else shows at the top.
    if (firstServerError) setFocusField(firstServerError);
    else setFormError(response.message);
  };

  if (auth.loading) return <Spinner />;
  if (sentTo)
    return (
      <AuthLayout
        title="Check your email"
        intro={`We sent a link to ${sentTo}. Click it to confirm your email, then sign in.`}
        footer={
          <>
            Confirmed it?{' '}
            <Link className={authLinkClass} to="/login" state={location.state}>
              Sign in
            </Link>
          </>
        }
      >
        <p className="text-sm text-ink/70">
          No email after a few minutes? Check your spam folder, or{' '}
          <ResendConfirmation email={sentTo} />.
        </p>
      </AuthLayout>
    );
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
          id="register-phone"
          ref={fieldRefs.phone}
          label="Phone number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          maxLength={20}
          value={formData.phone}
          error={fieldErrors.phone}
          hint="So the owner can reach you about your stay, e.g. +254 712 345 678"
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
      <GoogleButton />
    </AuthLayout>
  );
};

export default RegisterPage;
