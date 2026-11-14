const KEY = 'tg_recently_viewed';

// The last few homes opened on this device, for the guest overview.
export const rememberViewed = (place) => {
  try {
    const entry = { id: place.id, title: place.title, address: place.address, photo: place.photos?.[0] ?? null };
    const list = [entry, ...readViewed().filter((p) => p.id !== place.id)].slice(0, 6);
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Private browsing can refuse storage; nothing to remember then.
  }
};

export const readViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
};
