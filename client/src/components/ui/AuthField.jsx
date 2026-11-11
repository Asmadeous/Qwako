import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

// Labelled input for the sign-in, sign-up and password pages. Password fields
// get a show/hide button. `hint` sits under the field until an error replaces it.
const AuthField = forwardRef(
  (
    {
      id,
      label,
      labelAside,
      hint,
      error,
      type = 'text',
      className,
      ...inputProps
    },
    ref,
  ) => {
    const [shown, setShown] = useState(false);
    const isPassword = type === 'password';
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
      <div className={cn('mb-5', className)}>
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <label htmlFor={id} className="text-sm font-semibold text-ink">
            {label}
          </label>
          {labelAside}
        </div>
        <div className="relative">
          <input
            id={id}
            ref={ref}
            type={isPassword && shown ? 'text' : type}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={describedBy}
            className={cn(
              '!my-0 h-12 !rounded-xl !border-ink/30 !bg-white !text-base hover:!border-ink/50 focus:!border-ink',
              isPassword && '!pr-12',
              error && '!border-red-700 focus:!ring-red-700/15',
            )}
            {...inputProps}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShown((value) => !value)}
              aria-label={shown ? 'Hide password' : 'Show password'}
              aria-pressed={shown}
              aria-controls={id}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-ink/60 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink/30"
            >
              {shown ? (
                <EyeOff aria-hidden className="size-5" />
              ) : (
                <Eye aria-hidden className="size-5" />
              )}
            </button>
          )}
        </div>
        {error ? (
          <p
            id={`${id}-error`}
            className="mt-2 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        ) : (
          hint && (
            <div id={`${id}-hint`} className="mt-2 text-sm text-ink/70">
              {hint}
            </div>
          )
        )}
      </div>
    );
  },
);

AuthField.displayName = 'AuthField';

export default AuthField;
