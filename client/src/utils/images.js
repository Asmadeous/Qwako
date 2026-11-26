// Unsplash resizes on request, so each device downloads only the width it
// needs. Other URLs (uploaded photos) are served as they are.
const WIDTHS = [400, 640, 1080, 1600, 2400];

const isUnsplash = (url) => Boolean(url?.includes('images.unsplash.com'));

const withWidth = (url, width) => url.replace(/([?&])w=\d+/, `$1w=${width}`);

export const unsplashSrcSet = (url, maxW = 2400) =>
  isUnsplash(url)
    ? WIDTHS.filter((w) => w <= maxW)
        .map((w) => `${withWidth(url, w)} ${w}w`)
        .join(', ')
    : undefined;

// Spread onto an <img> for a listing photo. `sizes` says how wide the image is
// on screen so the browser picks the smallest copy that stays sharp; `width` is
// the fallback copy for browsers without srcset. Off-screen photos load lazily.
export const listingPhotoProps = (url, { sizes, width = 640, maxW = 1600, eager = false } = {}) => ({
  src: isUnsplash(url) ? withWidth(url, width) : url,
  srcSet: unsplashSrcSet(url, maxW),
  sizes,
  loading: eager ? 'eager' : 'lazy',
  decoding: 'async',
});

// What a photo shows, read from a plain-words file name such as
// "03-living-room.jpg" -> "Living room". Empty for camera or upload names
// ("IMG_1234.jpg") that say nothing about the picture.
export const photoDescription = (url) => {
  const file = (url ?? '').split(/[?#]/)[0].split('/').pop() ?? '';
  const name = decodeURIComponent(file).replace(/\.[a-z0-9]+$/i, '').replace(/^\d+[-_ ]*/, '');
  if (!/^[a-z]{3,}([-_ ][a-z]+)*$/i.test(name)) return '';
  const words = name.replace(/[-_]+/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};
