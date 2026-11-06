import { forwardRef } from 'react';

// Labelled input whose error text is tied to the field for screen readers.
const AuthField = forwardRef(({ id, label, error, ...inputProps }, ref) => {
  const errorId = `${id}-error`;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`!my-0 min-h-11 ${error ? 'border-red-700' : ''}`}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
});

AuthField.displayName = 'AuthField';

export default AuthField;
