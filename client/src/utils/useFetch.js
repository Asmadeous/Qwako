import { useCallback, useEffect, useState } from 'react';

import { api, errorMessageFrom } from './axios';

// Loads one API path. `reload` fetches again after a change.
export const useFetch = (path, params) => {
  const key = path ? `${path}?${JSON.stringify(params ?? {})}` : null;
  const [state, setState] = useState({ data: null, error: '', loading: Boolean(path) });

  const load = useCallback(async () => {
    if (!path) return;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const { data } = await api.get(path, { params });
      setState({ data, error: '', loading: false });
    } catch (err) {
      setState({ data: null, error: errorMessageFrom(err), loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load, setData: (data) => setState((s) => ({ ...s, data })) };
};

export default useFetch;
