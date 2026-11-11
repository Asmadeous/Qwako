// Shared frame for the sign-in, sign-up and password pages: one solid card,
// centred on the page. On phones the card's frame drops away and the form
// runs full width.
const AuthLayout = ({ title, intro, footer, children }) => (
  <div className="flex grow items-start justify-center px-4 pb-16 pt-24 sm:items-center sm:pt-28">
    <div className="w-full max-w-[440px] sm:rounded-3xl sm:border sm:border-ink/15 sm:bg-paper sm:p-10 sm:shadow-[0_24px_60px_-30px_rgba(42,39,37,0.35)]">
      <h1 className="text-balance text-3xl font-bold leading-tight tracking-tight text-ink">
        {title}
      </h1>
      {intro && (
        <div className="mt-2 text-pretty text-base text-ink/75">{intro}</div>
      )}
      <div className="mt-8">{children}</div>
      {footer && (
        <div className="mt-8 border-t border-ink/15 pt-6 text-center text-sm text-ink/75">
          {footer}
        </div>
      )}
    </div>
  </div>
);

export const authLinkClass =
  'font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink';

export const FormError = ({ children }) =>
  children ? (
    <p
      role="alert"
      className="mb-6 rounded-xl border border-red-700/40 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
    >
      {children}
    </p>
  ) : null;

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field checks run when a field loses focus and again on submit.
export const checkField = {
  name: (value) => (value.trim() ? '' : 'Enter your full name.'),
  email: (value) =>
    !value.trim()
      ? 'Enter your email.'
      : EMAIL_FORMAT.test(value.trim())
        ? ''
        : 'Enter an email like name@example.com.',
  password: (value) => (value ? '' : 'Enter your password.'),
  newPassword: (value) =>
    value.length >= 8 ? '' : 'Use at least 8 characters.',
};

export default AuthLayout;
