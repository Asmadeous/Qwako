
// Listings store their country (the last part of the address): Kenya, or a
// UK nation. Kenyan stays are priced in KES, UK stays in GBP.
const COUNTRY_ORDER = ['Kenya', 'England', 'Scotland', 'Wales', 'Northern Ireland'];
const byCountryOrder = (a, b) => COUNTRY_ORDER.indexOf(a) - COUNTRY_ORDER.indexOf(b) || a.localeCompare(b);

export const countriesIn = (places) => [...new Set(places.map((p) => p.country))].sort(byCountryOrder);

// "Kenya", "the UK" or "Kenya and the UK", for page copy.
export const areaLabel = (places) => {
  const countries = countriesIn(places);
  const names = [];
  if (countries.includes('Kenya')) names.push('Kenya');
  if (countries.some((c) => c !== 'Kenya')) names.push('the UK');
  return names.join(' and ') || 'Kenya';
};

// Category chips, matched against the listing's title and description
export const CATEGORIES = [
  { id: 'coast', label: 'Beach & Coast', words: ['beach', 'sea', 'coast', 'ocean', 'creek', 'harbour', 'cove', 'marine'] },
  { id: 'apartment', label: 'Apartments', words: ['apartment', 'loft', 'flat'] },
  { id: 'house', label: 'Houses & Villas', words: ['house', 'villa', 'home', 'cottage', 'townhouse', 'farmhouse'] },
  { id: 'cabin', label: 'Cabins & Lodges', words: ['cabin', 'lodge', 'cottage'] },
  { id: 'wildlife', label: 'Near the parks', words: ['national park', 'conservancy', 'reserve', 'safari', 'giraffe'] },
  { id: 'mountain', label: 'Highlands', words: ['mountain', 'mount', 'highlands', 'hillside'] },
  { id: 'lake', label: 'Lakes', words: ['lake', 'loch', 'river'] },
  { id: 'city', label: 'City homes', words: ['city', 'town', 'centre', 'restaurants'] },
];

// Nightly price bands in cents, per currency.
export const BUDGETS = {
  KES: [
    { id: 'any', label: 'Any price', min: 0, max: Infinity },
    { id: 'kes-lt10k', label: 'Under Ksh 10,000', min: 0, max: 1000000 },
    { id: 'kes-10-20k', label: 'Ksh 10,000 to 20,000', min: 1000000, max: 2000000 },
    { id: 'kes-20-30k', label: 'Ksh 20,000 to 30,000', min: 2000000, max: 3000000 },
    { id: 'kes-gt30k', label: 'Ksh 30,000+', min: 3000000, max: Infinity },
  ],
  GBP: [
    { id: 'any', label: 'Any price', min: 0, max: Infinity },
    { id: 'gbp-lt100', label: 'Under £100', min: 0, max: 10000 },
    { id: 'gbp-100-200', label: '£100 to £200', min: 10000, max: 20000 },
    { id: 'gbp-200-400', label: '£200 to £400', min: 20000, max: 40000 },
    { id: 'gbp-gt400', label: '£400+', min: 40000, max: Infinity },
  ],
};

// Price bands only make sense when the stays in view share one currency.
export const budgetsFor = (places, region) => {
  const currencies = new Set(places.filter((p) => region === 'all' || p.country === region).map((p) => p.currency));
  return currencies.size === 1 ? BUDGETS[[...currencies][0]] ?? null : null;
};

const findBudgetCurrency = (id) => Object.keys(BUDGETS).find((c) => BUDGETS[c].some((b) => b.id === id));

const findBudget = (id) => Object.values(BUDGETS).flat().find((b) => b.id === id);

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'parking', label: 'Free parking' },
  { id: 'tv', label: 'TV' },
  { id: 'pets', label: 'Pets allowed' },
  { id: 'entrance', label: 'Private entrance' },
];

export const SORTS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'guests-desc', label: 'Most guests' },
];

export const DEFAULT_FILTERS = {
  query: '',
  category: 'all',
  region: 'all',
  county: 'all',
  guests: 0,
  budget: 'any',
  amenities: [],
  sort: 'recommended',
};

const regionOf = (place) => place.country;

// The county (or UK county) is the part of the address just before the country.
export const countyOf = (place) => {
  const parts = (place.address || '').split(',').map((part) => part.trim());
  return parts.length > 1 ? parts[parts.length - 2] : '';
};

const hasWord = (text, word) => new RegExp(`\\b${word}`, 'i').test(text);

export const matchesCategory = (place, categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return true;
  const text = `${place.title} ${place.description || ''}`;
  return cat.words.some((w) => hasWord(text, w));
};

export const countiesIn = (places, region) =>
  [...new Set(places.filter((p) => region === 'all' || regionOf(p) === region).map(countyOf).filter(Boolean))].sort();

export const applyFilters = (places, f) => {
  const budget = findBudget(f.budget) || BUDGETS.KES[0];
  const query = f.query.trim().toLowerCase();
  const list = places.filter((p) => {
    const price = p.nightly_price_cents;
    return (
      (!query || `${p.title} ${p.address}`.toLowerCase().includes(query)) &&
      (f.category === 'all' || matchesCategory(p, f.category)) &&
      (f.region === 'all' || regionOf(p) === f.region) &&
      (f.county === 'all' || countyOf(p) === f.county) &&
      p.max_guests >= f.guests &&
      (budget.id === 'any' || (price >= budget.min && price < budget.max && (findBudgetCurrency(budget.id) === p.currency))) &&
      f.amenities.every((a) => (p.amenities || []).includes(a))
    );
  });
  const byPrice = (p) => p.nightly_price_cents;
  if (f.sort === 'price-asc') list.sort((a, b) => byPrice(a) - byPrice(b));
  if (f.sort === 'price-desc') list.sort((a, b) => byPrice(b) - byPrice(a));
  if (f.sort === 'guests-desc') list.sort((a, b) => b.max_guests - a.max_guests);
  return list;
};

export const activeFilterCount = (f) =>
  (f.query.trim() !== '') + (f.category !== 'all') + (f.region !== 'all') + (f.county !== 'all') +
  (f.guests > 0) + (f.budget !== 'any') + f.amenities.length;

// Filters that live behind the "More filters" toggle.
export const moreFilterCount = (f, countyInPanel = true) =>
  (countyInPanel && f.county !== 'all') + (f.budget !== 'any') + f.amenities.length;
