import axios from 'axios';

// Legacy Express API (bookings, places, uploads) until each part moves to Rails.
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || '/api',
  withCredentials: true,
});

// Rails API. Same origin by default: Vite proxies /api/v1 in development and
// Rails serves the client in production. VITE_API_URL overrides the host.
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || ''}/api/v1`,
  withCredentials: true,
});

export default axiosInstance;
