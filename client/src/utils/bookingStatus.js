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

export const bookingStatusLabel = (status) => BOOKING_STATUS_LABELS[status] ?? status;
