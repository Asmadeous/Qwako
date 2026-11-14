// Prices are integer cents (minor units) of Kenyan shillings: every home is in Kenya.

const LOCALES = { KES: 'en-KE' };
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

export const amountToCents = (amount) => Math.round(Number(amount) * 100);

export const centsToAmount = (cents) => (Number(cents) || 0) / 100;
