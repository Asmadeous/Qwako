import { createContext, useContext, useEffect } from 'react';

import { useAuth } from '../../hooks';
import useFetch from '@/utils/useFetch';
import { getConsumer, resetConsumer } from '@/utils/cable';

const NotificationsContext = createContext({ data: null, reload: () => {} });

// Notifications for the bell and the notifications page. They update the moment
// something happens (websocket), with a check every minute as a fallback.
export const NotificationsProvider = ({ children }) => {
  const { user } = useAuth();
  const state = useFetch(user ? '/notifications' : null);

  useEffect(() => {
    resetConsumer();
    if (!user) return undefined;
    const subscription = getConsumer().subscriptions.create('NotificationsChannel', {
      received: () => state.reload(),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    const timer = setInterval(() => document.visibilityState === 'visible' && state.reload(), 60000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return <NotificationsContext.Provider value={state}>{children}</NotificationsContext.Provider>;
};

export const useNotifications = () => useContext(NotificationsContext);
