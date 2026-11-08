// Unsplash resizes on request, so each device downloads only the width it
// needs. Other URLs (uploaded photos) are served as they are.
const WIDTHS = [400, 640, 1080, 1600, 2400];

export const unsplashSrcSet = (url, maxW = 2400) =>
  url?.includes('images.unsplash.com')
    ? WIDTHS.filter((w) => w <= maxW)
        .map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`)
        .join(', ')
    : undefined;
