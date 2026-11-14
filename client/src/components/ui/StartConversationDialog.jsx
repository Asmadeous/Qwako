import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import { api, errorMessageFrom } from '@/utils/axios';

// First message to the owner, about a booking ({ booking_id }), a home
// ({ listing_id }) or anything ({}). Calls onSent with the conversation id.
const StartConversationDialog = ({ open, onOpenChange, params, title, onSent }) => {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async (e) => {
    e.preventDefault();
    if (!body.trim()) return setError('Write a message first.');
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/conversations', { ...params, body });
      setBody('');
      onOpenChange(false);
      onSent(data.conversation.id);
    } catch (err) {
      setError(errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <form onSubmit={send} className="grid gap-4">
          <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">{title}</DialogTitle>
          <DialogDescription className="text-sm text-ink/70">
            The owner usually replies within a day. You'll get an email and a notification when they do.
          </DialogDescription>
          <label className="grid gap-1.5">
            <span className="text-sm font-medium">Your message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              maxLength={4000}
              className="rounded-xl border border-ink/25 bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-800">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Close
            </Button>
            <Button type="submit" disabled={busy} aria-busy={busy}>
              {busy ? 'Sending...' : 'Send message'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StartConversationDialog;
