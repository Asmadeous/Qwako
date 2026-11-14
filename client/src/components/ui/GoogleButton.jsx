import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

import { useAuth } from '../../../hooks';
import { api, errorMessageFrom } from '@/utils/axios';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT = 'https://accounts.google.com/gsi/client';

// "Continue with Google". Shown only when the site has a Google client ID
// (VITE_GOOGLE_CLIENT_ID here, GOOGLE_CLIENT_ID on the server).
const GoogleButton = () => {
  const { setUser } = useAuth();
  const box = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !box.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async ({ credential }) => {
          try {
            const { data } = await api.post('/google_session', { credential });
            setUser(data.user);
            toast.success('Signed in with Google.');
          } catch (err) {
            toast.error(errorMessageFrom(err));
          }
        },
      });
      window.google.accounts.id.renderButton(box.current, { theme: 'outline', size: 'large', shape: 'pill', width: 320, text: 'continue_with' });
    };
    let script = document.querySelector(`script[src="${SCRIPT}"]`);
    if (!script) {
      script = document.createElement('script');
      script.src = SCRIPT;
      script.async = true;
      script.onerror = () => setFailed(true);
      document.head.appendChild(script);
    }
    if (window.google?.accounts?.id) render();
    else script.addEventListener('load', render);
    return () => {
      cancelled = true;
      script.removeEventListener('load', render);
    };
  }, [setUser]);

  if (!CLIENT_ID || failed) return null;
  return (
    <div className="mt-6 grid justify-items-center gap-4">
      <p className="flex w-full items-center gap-3 text-sm text-ink/55 before:h-px before:grow before:bg-ink/15 after:h-px after:grow after:bg-ink/15">
        or
      </p>
      <div ref={box} className="min-h-11" />
    </div>
  );
};

export default GoogleButton;
