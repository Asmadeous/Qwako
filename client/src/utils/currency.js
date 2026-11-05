// All prices are stored and sent as integer pence in GBP.

const GBP = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

export const formatPrice = (pence) => GBP.format((Number(pence) || 0) / 100);

export const poundsToPence = (pounds) => Math.round(Number(pounds) * 100);

export const penceToPounds = (pence) => (Number(pence) || 0) / 100;
