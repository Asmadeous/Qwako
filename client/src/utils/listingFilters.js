
const REGION_OF = {
  Kenya: 'Kenya',
  Tanzania: 'Africa', Uganda: 'Africa', Rwanda: 'Africa', Ethiopia: 'Africa',
  'South Africa': 'Africa', Nigeria: 'Africa', Ghana: 'Africa', Morocco: 'Africa',
  Egypt: 'Africa', Mauritius: 'Africa', Seychelles: 'Africa', Namibia: 'Africa',
  UK: 'Europe', 'United Kingdom': 'Europe', Scotland: 'Europe', England: 'Europe',
  Ireland: 'Europe', France: 'Europe', Italy: 'Europe', Spain: 'Europe',
  Portugal: 'Europe', Greece: 'Europe', Germany: 'Europe', Netherlands: 'Europe',
  Austria: 'Europe', Croatia: 'Europe', Switzerland: 'Europe', Norway: 'Europe',
  Sweden: 'Europe', Denmark: 'Europe', Iceland: 'Europe', Turkey: 'Europe',
  UAE: 'Asia & Middle East', 'United Arab Emirates': 'Asia & Middle East',
  India: 'Asia & Middle East', Maldives: 'Asia & Middle East',
  'Sri Lanka': 'Asia & Middle East', Thailand: 'Asia & Middle East',
  Indonesia: 'Asia & Middle East', Vietnam: 'Asia & Middle East',
  Japan: 'Asia & Middle East', 'South Korea': 'Asia & Middle East',
  Singapore: 'Asia & Middle East',
  USA: 'Americas', 'United States': 'Americas', Canada: 'Americas',
  Mexico: 'Americas', Brazil: 'Americas', Argentina: 'Americas', Peru: 'Americas',
  Colombia: 'Americas', 'Costa Rica': 'Americas',
  Australia: 'Oceania', 'New Zealand': 'Oceania', Fiji: 'Oceania',
};

export const REGIONS = ['Kenya', 'Africa', 'Europe', 'Asia & Middle East', 'Americas', 'Oceania'];

// Category chips, matched against the listing's title and description
export const CATEGORIES = [
  { id: 'beach', label: 'Beachfront', words: ['beach', 'ocean', 'sea', 'lagoon', 'overwater', 'island', 'sand', 'surf'] },
  { id: 'pool', label: 'Pools', words: ['pool'] },
  { id: 'villa', label: 'Villas', words: ['villa', 'bungalow', 'riad'] },
  { id: 'apartment', label: 'Apartments', words: ['apartment', 'loft', 'flat', 'penthouse'] },
  { id: 'cabin', label: 'Cabins & Lodges', words: ['cabin', 'chalet', 'lodge'] },
  { id: 'house', label: 'Houses & Cottages', words: ['house', 'cottage', 'home', 'townhouse', 'farmhouse'] },
  { id: 'mountain', label: 'Mountains', words: ['mountain', 'alpine', 'ski', 'rockies', 'peaks', 'matterhorn', 'kilimanjaro'] },
  { id: 'lake', label: 'Lakeside', words: ['lake', 'loch', 'fjord'] },
  { id: 'city', label: 'City stays', words: ['city', 'heart of', 'market', 'tram', 'crossing', 'convention'] },
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
  country: 'all',
  guests: 0,
  budget: 'any',
  amenities: [],
  sort: 'recommended',
};

const regionOf = (place) => REGION_OF[place.country] || 'Other';

const hasWord = (text, word) => new RegExp(`\\b${word}`, 'i').test(text);

export const matchesCategory = (place, categoryId) => {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return true;
  const text = `${place.title} ${place.description || ''}`;
  return cat.words.some((w) => hasWord(text, w));
};

export const countriesIn = (places, region) =>
  [...new Set(places.filter((p) => region === 'all' || regionOf(p) === region).map((p) => p.country))].sort();

export const applyFilters = (places, f) => {
  const budget = BUDGETS.find((b) => b.id === f.budget) || BUDGETS[0];
  const list = places.filter((p) => {
    const price = p.nightly_price_pence;
    return (
      (f.category === 'all' || matchesCategory(p, f.category)) &&
      (f.region === 'all' || regionOf(p) === f.region) &&
      (f.country === 'all' || p.country === f.country) &&
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
  (f.category !== 'all') + (f.region !== 'all') + (f.country !== 'all') +
  (f.guests > 0) + (f.budget !== 'any') + f.amenities.length;
