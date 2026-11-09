export const setItemsInLocalStorage = (key, value) => {
  if (!key || !value) {
    return console.error('Cannot store in LS');
  }

  const valueToStore =
    typeof value !== 'string' ? JSON.stringify(value) : value;
  localStorage.setItem(key, valueToStore);
};

export const getItemFromLocalStorage = (key) => {
  if (!key) {
    return console.error(`Cannot get value from LS`);
  }
  return localStorage.getItem(key);
};

export const removeItemFromLocalStorage = (key) => {
  if (!key) {
    return console.error(`Cannot remove item from LS`);
  }
  localStorage.removeItem(key);
};

// Where to send someone after they sign in or sign up: the page that sent them
// to sign in (passed in router state), or the fallback. Only same-site paths.
export const returnPathFrom = (state, fallback = '/') => {
  const from = state?.from;
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : fallback;
};
