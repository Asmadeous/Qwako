
// Listings store the UK nation as `country` (the last part of the address).
export const REGIONS = ['England', 'Scotland', 'Wales', 'Northern Ireland'];

// Category chips, matched against the listing's title and description
export const CATEGORIES = [
  { id: 'coast', label: 'Coast', words: ['beach', 'sea', 'coast', 'harbour', 'estuary', 'cove'] },
  { id: 'apartment', label: 'Apartments', words: ['apartment', 'loft', 'flat'] },
  { id: 'cabin', label: 'Cabins & Lodges', words: ['cabin', 'lodge'] },
  { id: 'house', label: 'Houses & Cottages', words: ['house', 'cottage', 'townhouse', 'farmhouse', 'barn'] },
  { id: 'countryside', label: 'Countryside', words: ['forest', 'woodland', 'farmland', 'hills', 'fells', 'national park', 'village'] },
  { id: 'mountain', label: 'Mountains', words: ['mountain', 'cairngorms'] },
  { id: 'lake', label: 'Lakes & Lochs', words: ['lake', 'loch', 'river', 'broads'] },
  { id: 'city', label: 'City stays', words: ['city', 'quarter', 'heart of', 'station', 'tram'] },
];

// Nightly price bands in pence.
export const BUDGETS = [
  { id: 'any', label: 'Any price', min: 0, max: Infinity },
  { id: 'lt100', label: 'Under £100', min: 0, max: 10000 },
  { id: '100-200', label: '£100 to £200', min: 10000, max: 20000 },
  { id: '200-400', label: '£200 to £400', min: 20000, max: 40000 },
  { id: 'gt400', label: '£400+', min: 40000, max: Infinity },
];

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
  category: 'all',
  region: 'all',
  county: 'all',
  guests: 0,
  budget: 'any',
  amenities: [],
  sort: 'recommended',
};

const regionOf = (place) => place.country;

// The county is the part of the address just before the nation.
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
  const budget = BUDGETS.find((b) => b.id === f.budget) || BUDGETS[0];
  const list = places.filter((p) => {
    const price = p.nightly_price_pence;
    return (
      (f.category === 'all' || matchesCategory(p, f.category)) &&
      (f.region === 'all' || regionOf(p) === f.region) &&
      (f.county === 'all' || countyOf(p) === f.county) &&
      p.max_guests >= f.guests &&
      price >= budget.min &&
      price < budget.max &&
      f.amenities.every((a) => (p.amenities || []).includes(a))
    );
  });
  const byPrice = (p) => p.nightly_price_pence;
  if (f.sort === 'price-asc') list.sort((a, b) => byPrice(a) - byPrice(b));
  if (f.sort === 'price-desc') list.sort((a, b) => byPrice(b) - byPrice(a));
  if (f.sort === 'guests-desc') list.sort((a, b) => b.max_guests - a.max_guests);
  return list;
};

export const activeFilterCount = (f) =>
  (f.category !== 'all') + (f.region !== 'all') + (f.county !== 'all') +
  (f.guests > 0) + (f.budget !== 'any') + f.amenities.length;
