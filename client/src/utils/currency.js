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

export const getCurrency = (address = '') => {
  const country = address.split(',').pop().trim().toLowerCase();
  return COUNTRY_CURRENCY[country] || 'USD';
};

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
