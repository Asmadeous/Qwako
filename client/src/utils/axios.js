import axios from 'axios';

// Rails API. Same origin by default: Vite proxies /api/v1 in development and
// Vercel rewrites it to Render in production (vercel.json). VITE_API_URL overrides the host.
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  withCredentials: true,
});

// Field errors from a Rails validation_failed response, joined per field.
export const fieldErrorsFrom = (error) =>
  Object.fromEntries(
    Object.entries(error?.response?.data?.error?.details || {}).map(([field, messages]) => [
      field,
      messages.join(' '),
    ]),
  );

export const errorMessageFrom = (error) =>
  error?.response?.data?.error?.message ||
  'Could not reach the server. Check your connection and try again.';

export default api;

// What each field got wrong, as sentences, for forms that don't highlight fields.
export const fullErrorFrom = (error) => {
  const details = error?.response?.data?.error?.details;
  const lines = details ? Object.values(details).flat() : [];
  return lines.length ? lines.join(' ') : errorMessageFrom(error);
};
