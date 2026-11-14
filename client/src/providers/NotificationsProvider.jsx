import { createContext, useContext, useEffect } from 'react';

import { useAuth } from '../../hooks';
import useFetch from '@/utils/useFetch';

const NotificationsContext = createContext({ data: null, reload: () => {} });

// Notifications for the bell and the notifications page; checked every minute.
export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const state = useFetch(user ? '/notifications' : null);

  useEffect(() => {
    if (!user) return undefined;
    const timer = setInterval(() => document.visibilityState === 'visible' && state.reload(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return <NotificationsContext.Provider value={state}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => useContext(NotificationsContext);
