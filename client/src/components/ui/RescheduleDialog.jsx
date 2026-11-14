import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog';
import DatePickerWithRange from '@/components/ui/DatePickerWithRange';
import { api, errorMessageFrom } from '@/utils/axios';
import { formatPrice } from '@/utils/currency';
import { toISODate } from '@/utils/format';

// Moves a stay to other free dates: the same number of nights or fewer.
// `path` is the guest's or the owner's reschedule endpoint.
const RescheduleDialog = ({ booking, path, open, onOpenChange, onDone, byOwner = false }) => {
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [unavailable, setUnavailable] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setRange({ from: undefined, to: undefined });
    setError('');
    api
      .get(`/listings/${booking.listing.id}`)
      .then(({ data }) =>
        // This stay's own nights are free to move into.
        setUnavailable(
          (data.listing.unavailable ?? []).filter((r) => !(r.from === booking.check_in && r.to === booking.check_out)),
        ),
      )
      .catch(() => setUnavailable([]));
  }, [open, booking]);

  const nights = range.from && range.to ? differenceInCalendarDays(range.to, range.from) : 0;
  const refund = nights > 0 && nights < booking.nights ? (booking.nights - nights) * booking.nightly_price_cents : 0;
  const tooLong = nights > booking.nights;
  const sameDates = useMemo(
    () => range.from && range.to && toISODate(range.from) === booking.check_in && toISODate(range.to) === booking.check_out,
    [range, booking],
  );

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post(path, { check_in: toISODate(range.from), check_out: toISODate(range.to) });
      onDone(data.booking);
      onOpenChange(false);
    } catch (err) {
      const details = err?.response?.data?.error?.details;
      setError(details ? Object.values(details).flat().join(' ') : errorMessageFrom(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogTitle className="text-3xl font-bold leading-tight tracking-tight">Change dates</DialogTitle>
        <DialogDescription asChild>
          <div className="grid gap-3 text-sm text-ink/75">
            <p>
              Pick new dates for up to {booking.nights} {booking.nights === 1 ? 'night' : 'nights'} at the same nightly
              price. For a longer stay, book the extra nights separately.
            </p>
            <DatePickerWithRange
              id="reschedule-dates"
              value={range}
              onChange={setRange}
              unavailable={unavailable}
              placeholder="Choose new dates"
            />
            {tooLong && <p className="font-semibold text-red-800">That's longer than your booking. Pick {booking.nights} nights or fewer.</p>}
            {refund > 0 && (
              <p>
                A shorter stay: {formatPrice(refund, booking.currency)} {byOwner ? 'is due back to the guest' : 'comes back to you'}.
              </p>
            )}
            {error && (
              <p role="alert" className="font-semibold text-red-800">
                {error}
              </p>
            )}
          </div>
        </DialogDescription>
        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep current dates
          </Button>
          <Button onClick={save} disabled={busy || nights < 1 || tooLong || sameDates} aria-busy={busy}>
            {busy ? 'Saving...' : 'Save new dates'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RescheduleDialog;
