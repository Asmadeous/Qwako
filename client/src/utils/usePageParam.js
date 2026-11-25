import { useSearchParams } from 'react-router-dom';

// The page number of a paged list, kept in the address (?page=2) so the back
// button and shared links return to the same page. `key` lets one screen hold
// two paged lists; `scroll: false` keeps the scroll position for a list lower
// down the screen.
export const usePageParam = (key = 'page', { scroll = true } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get(key), 10) || 1);
  const setPage = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next > 1) params.set(key, String(next));
    else params.delete(key);
    setSearchParams(params);
    if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return [page, setPage];
};

export default usePageParam;
