import { useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

const KEY = 'tg_cookie_notice';

// The site only sets the cookie that keeps people signed in, so there is
// nothing to opt into; this says so once.
const CookieNotice = () => {
  const [seen, setSeen] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return true;
    }
  });
  if (seen) return null;
  const close = () => {
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // Storage refused; hide for this visit.
    }
    setSeen(true);
  };
  return (
    <div
      role="region"
      aria-label="Cookies"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-ink/20 bg-paper p-4 text-sm shadow-lg"
    >
      <p className="grow basis-64">
        We use one cookie, to keep you signed in. No tracking or advertising cookies.{' '}
        <Link to="/privacy" className="underline underline-offset-4">
          Privacy notice
        </Link>
      </p>
      <Button onClick={close}>OK</Button>
    </div>
  );
};

export default CookieNotice;
