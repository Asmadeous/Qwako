import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

// Dates as "5 Nov 2026" across the site.
export const formatDate = (iso) => (iso ? format(typeof iso === 'string' ? parseISO(iso) : iso, 'd MMM yyyy') : '');
export const formatDateTime = (iso) => (iso ? format(parseISO(iso), "d MMM yyyy, HH:mm") : '');
export const timeAgo = (iso) => (iso ? `${formatDistanceToNowStrict(parseISO(iso))} ago` : '');
export const toISODate = (date) => format(date, 'yyyy-MM-dd');

export const PROPERTY_TYPES = {
  house: 'House',
  apartment: 'Apartment',
  cottage: 'Cottage',
  villa: 'Villa',
  cabin: 'Cabin',
  bungalow: 'Bungalow',
  studio: 'Studio',
  room: 'Private room',
};

export const POLICIES = {
  flexible: { label: 'Flexible', text: 'Full refund if you cancel before the day of check-in.' },
  moderate: { label: 'Moderate', text: 'Full refund if you cancel at least 5 days before check-in, half after that.' },
  strict: { label: 'Strict', text: 'Half refund if you cancel at least 7 days before check-in, nothing after that.' },
};

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
