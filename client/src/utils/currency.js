// Prices are integer cents (minor units) of the listing's own currency:
// KES for stays in Kenya, GBP for stays in the UK.

const LOCALES = { KES: 'en-KE', GBP: 'en-GB' };
const formatters = {};

const formatterFor = (currency) => {
  if (!formatters[currency]) {
    formatters[currency] = new Intl.NumberFormat(LOCALES[currency] || 'en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    });
  }
  return formatters[currency];
};

export const formatPrice = (cents, currency = 'KES') =>
  formatterFor(currency).format((Number(cents) || 0) / 100);

// The country is the last part of an address; it sets the currency.
const UK_NATIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];
export const currencyForAddress = (address = '') => {
  const country = address.split(',').pop().trim();
  return UK_NATIONS.includes(country) ? 'GBP' : 'KES';
};

export const amountToCents = (amount) => Math.round(Number(amount) * 100);

export const centsToAmount = (cents) => (Number(cents) || 0) / 100;
