import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';

// Opened from the link in the sign-up email.
const VerifyEmailPage = () => {
  const [params] = useSearchParams();
  const { user, setUser } = useAuth();
  const [state, setState] = useState({ status: 'working', message: '' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api
      .patch('/email_verification', { token: params.get('token') ?? '' })
      .then(() => {
        setState({ status: 'done' });
        if (user) setUser({ ...user, email_verified: true });
      })
      .catch((err) => setState({ status: 'failed', message: errorMessageFrom(err) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-28 pb-24" aria-live="polite">
      {state.status === 'working' && <p className="text-xl">Confirming your email...</p>}
      {state.status === 'done' && (
        <>
          <h1 className="text-5xl font-bold tracking-tight">Email confirmed.</h1>
          <Link to={user ? '/account' : '/login'} className={`${buttonVariants()} mt-6`}>
            {user ? 'Go to your account' : 'Sign in'}
          </Link>
        </>
      )}
      {state.status === 'failed' && (
        <>
          <h1 className="text-5xl font-bold tracking-tight">That link didn't work.</h1>
          <p className="mt-3 text-ink/70">{state.message}</p>
          <Link to="/account/settings" className={`${buttonVariants()} mt-6`}>
            Get a new link
          </Link>
        </>
      )}
    </div>
  );
};

export default VerifyEmailPage;
