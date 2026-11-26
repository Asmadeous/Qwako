import { usePlaces } from '../../../hooks';
import { photoDescription } from '@/utils/images';

// The town a home is in: the first part of its address ("Tatu City, Ruiru, ..." -> "Tatu City").
export const areaOf = (home) => home?.address?.split(',')[0]?.trim() ?? '';

// Every photo of the published homes, taken in turn from each home (the first
// photo of each home, then the second of each, and so on). New homes and new
// photos show on the home page by themselves; drafts never do.
export const useHomePhotos = () => {
  const { places, loading } = usePlaces();
  const homes = places.filter((home) => home.photos?.length);
  const longest = Math.max(0, ...homes.map((home) => home.photos.length));
  const pool = [];
  for (let i = 0; i < longest; i += 1) {
    homes.forEach((home) => {
      const url = home.photos[i];
      if (url) pool.push({ url, home, alt: photoDescription(url) || home.title });
    });
  }
  // A photo for a fixed spot on the page; wraps round when there are few.
  const pick = (i) => (pool.length ? pool[i % pool.length] : null);
  const areas = [...new Set(homes.map(areaOf).filter(Boolean))];
  return { homes, pool, pick, areas, loading };
};
