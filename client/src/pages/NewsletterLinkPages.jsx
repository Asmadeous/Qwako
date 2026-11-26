import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { buttonVariants } from '@/components/ui/button';
import { api, errorMessageFrom } from '@/utils/axios';

// Opened from a link in a newsletter email: posts the token once and says how it went.
const TokenLinkPage = ({ path, working, done, doneText }) => {
  const [params] = useSearchParams();
  const [state, setState] = useState({ status: 'working', message: '' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api
      .post(path, { token: params.get('token') ?? '' })
      .then(() => setState({ status: 'done' }))
      .catch((err) => setState({ status: 'failed', message: errorMessageFrom(err) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto w-full max-w-xl px-4 pt-28 pb-24" aria-live="polite">
      {state.status === 'working' && <p className="text-xl">{working}</p>}
      {state.status === 'done' && (
        <>
          <h1 className="text-5xl font-bold tracking-tight">{done}</h1>
          <p className="mt-3 text-ink/70">{doneText}</p>
          <Link to="/homes" className={`${buttonVariants()} mt-6`}>
            Browse the homes
          </Link>
        </>
      )}
      {state.status === 'failed' && (
        <>
          <h1 className="text-5xl font-bold tracking-tight">That link didn't work.</h1>
          <p className="mt-3 text-ink/70">{state.message}</p>
        </>
      )}
    </div>
  );
};

export const NewsletterConfirmPage = () => (
  <TokenLinkPage
    path="/newsletter_subscription/confirm"
    working="Confirming your sign-up..."
    done="You're signed up."
    doneText="We'll email you TG-Homes news and offers. Every email has a link to unsubscribe."
  />
);

export const NewsletterUnsubscribePage = () => (
  <TokenLinkPage
    path="/newsletter_subscription/unsubscribe"
    working="Unsubscribing..."
    done="You're unsubscribed."
    doneText="You won't get the TG-Homes newsletter any more."
  />
);
