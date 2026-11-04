// Picks the local currency from the country at the end of a listing's address
// (e.g. "Diani Beach, Kenya" -> KES) and formats prices with it.

const COUNTRY_CURRENCY = {
  kenya: 'KES',
  tanzania: 'TZS',
  uganda: 'UGX',
  rwanda: 'RWF',
  ethiopia: 'ETB',
  'south africa': 'ZAR',
  nigeria: 'NGN',
  ghana: 'GHS',
  morocco: 'MAD',
  egypt: 'EGP',
  mauritius: 'MUR',
  seychelles: 'SCR',
  namibia: 'NAD',
  zanzibar: 'TZS',
  usa: 'USD',
  'united states': 'USD',
  canada: 'CAD',
  mexico: 'MXN',
  brazil: 'BRL',
  argentina: 'ARS',
  peru: 'PEN',
  colombia: 'COP',
  'costa rica': 'CRC',
  uk: 'GBP',
  'united kingdom': 'GBP',
  scotland: 'GBP',
  england: 'GBP',
  ireland: 'EUR',
  france: 'EUR',
  italy: 'EUR',
  spain: 'EUR',
  portugal: 'EUR',
  greece: 'EUR',
  germany: 'EUR',
  netherlands: 'EUR',
  austria: 'EUR',
  croatia: 'EUR',
  switzerland: 'CHF',
  norway: 'NOK',
  sweden: 'SEK',
  denmark: 'DKK',
  iceland: 'ISK',
  turkey: 'TRY',
  uae: 'AED',
  'united arab emirates': 'AED',
  india: 'INR',
  maldives: 'MVR',
  'sri lanka': 'LKR',
  thailand: 'THB',
  indonesia: 'IDR',
  vietnam: 'VND',
  japan: 'JPY',
  'south korea': 'KRW',
  singapore: 'SGD',
  australia: 'AUD',
  'new zealand': 'NZD',
  fiji: 'FJD',
};

export const getCountry = (address = '') => address.split(',').pop().trim();

export const getCurrency = (address = '') =>
  COUNTRY_CURRENCY[getCountry(address).toLowerCase()] || 'USD';

// Approximate value of 1 unit in US dollars, only used to compare and filter
// prices across currencies (never shown as an exact amount).
const USD_RATE = {
  USD: 1, KES: 0.0077, TZS: 0.00039, UGX: 0.00027, RWF: 0.0007, ETB: 0.008,
  ZAR: 0.055, NGN: 0.00065, GHS: 0.065, MAD: 0.1, EGP: 0.02, MUR: 0.022,
  SCR: 0.07, NAD: 0.055, CAD: 0.73, MXN: 0.055, BRL: 0.18, ARS: 0.001,
  PEN: 0.27, COP: 0.00025, CRC: 0.002, GBP: 1.27, EUR: 1.08, CHF: 1.13,
  NOK: 0.093, SEK: 0.095, DKK: 0.145, ISK: 0.0072, TRY: 0.03, AED: 0.272,
  INR: 0.012, MVR: 0.065, LKR: 0.0033, THB: 0.029, IDR: 0.000062,
  VND: 0.00004, JPY: 0.0067, KRW: 0.00073, SGD: 0.75, AUD: 0.66, NZD: 0.6,
  FJD: 0.45,
};

export const toUSD = (amount, address) =>
  (Number(amount) || 0) * (USD_RATE[getCurrency(address)] ?? 1);

export const formatPrice = (amount, address) => {
  const value = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en', {
      style: 'currency',
      currency: getCurrency(address),
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
  }
};
