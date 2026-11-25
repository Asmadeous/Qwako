import { useState } from 'react';
import { toast } from 'react-toastify';

import { api, errorMessageFrom } from '@/utils/axios';

// Sends the email confirmation link again to an address that is not confirmed yet.
const ResendConfirmation = ({ email }) => {
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/email_verification', { email });
      toast.success(`We sent a new link to ${email}.`);
    } catch (error) {
      toast.error(errorMessageFrom(error));
    } finally {
      setSending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={resend}
      disabled={sending}
      className="font-semibold text-ink underline decoration-ink/40 underline-offset-4 hover:decoration-ink disabled:opacity-60"
    >
      {sending ? 'Sending...' : 'Send the link again'}
    </button>
  );
};

export default ResendConfirmation;
