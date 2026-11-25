import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { api, errorMessageFrom } from '@/utils/axios';

// Footer sign-up. A confirmation email is sent before anything else.
const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'sending', message: '' });
    try {
      await api.post('/newsletter_subscription', { email });
      setState({ status: 'sent', message: `Check ${email.trim()} for a link to confirm.` });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: errorMessageFrom(err) });
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 grid max-w-md gap-2">
      <label htmlFor="newsletter-email" className="text-sm font-medium">
        News and offers by email
      </label>
      <div className="flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink/25 bg-paper px-3 text-sm focus:border-ink focus:outline-none"
        />
        <Button type="submit" disabled={state.status === 'sending'} aria-busy={state.status === 'sending'}>
          {state.status === 'sending' ? 'Signing up...' : 'Sign up'}
        </Button>
      </div>
      <p aria-live="polite" className={state.status === 'error' ? 'text-sm font-semibold text-red-800' : 'text-sm text-ink/70'}>
        {state.message || 'A few emails a year. Unsubscribe any time.'}
      </p>
    </form>
  );
};

export default NewsletterSignup;
