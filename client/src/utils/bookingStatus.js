// Plain-language booking statuses, shared by the guest's booking pages.
export const BOOKING_STATUS_LABELS = {
  confirmed: 'Confirmed',
  pending_payment: 'Awaiting payment',
  requested: 'Requested',
  declined: 'Declined',
  expired: 'Expired',
  cancelled_by_guest: 'Cancelled by you',
  cancelled_by_owner: 'Cancelled by the owner',
  completed: 'Completed',
};

// The owner sees the same statuses from the other side.
const OWNER_LABELS = {
  ...BOOKING_STATUS_LABELS,
  cancelled_by_guest: 'Cancelled by the guest',
  cancelled_by_owner: 'Cancelled by you',
};

export const bookingStatusLabel = (status, { owner = false } = {}) =>
  (owner ? OWNER_LABELS : BOOKING_STATUS_LABELS)[status] ?? status;

const CHANNELS = { mobile_money: 'M-Pesa', card: 'card', bank: 'bank', bank_transfer: 'bank transfer', ussd: 'USSD' };

// "Paid by M-Pesa", "Refund due" and so on, for the owner's booking lists.
export const paymentSummary = (booking) => {
  const payments = booking.payments ?? [];
  if (booking.refund_due) return { label: 'Refund due', tone: 'alert' };
  if (payments.some((p) => p.refunded_at)) return { label: 'Refunded', tone: 'muted' };
  const paid = payments.find((p) => p.status === 'succeeded');
  if (paid) return { label: `Paid by ${channelName(paid.channel)}`, tone: 'ok' };
  if (booking.pay_online && booking.status === 'pending_payment') return { label: 'Not paid yet', tone: 'muted' };
  if (!booking.pay_online) return { label: 'No online payment', tone: 'muted' };
  return { label: 'Not paid', tone: 'muted' };
};

export const channelName = (channel) => CHANNELS[channel] ?? channel ?? 'Paystack';
