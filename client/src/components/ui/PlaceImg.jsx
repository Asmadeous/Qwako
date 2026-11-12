import { listingPhotoProps } from '@/utils/images';

// A home's photo at thumbnail size. Pass `sizes` when it is shown wider.
const PlaceImg = ({ place, index = 0, className = 'object-cover', sizes = '(min-width: 640px) 208px, 100vw' }) => {
  const url = place.photos?.[index];
  if (!url) return null;
  return <img {...listingPhotoProps(url, { sizes, width: 400 })} alt="" className={className} />;
};

export default PlaceImg;
