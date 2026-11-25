import { api } from '@/utils/axios';

// Web Push for this browser or phone: ask permission, subscribe through the
// service worker, and tell the API where to send notifications.
export const pushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

const keyBytes = (base64) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const registration = () => navigator.serviceWorker.register('/sw.js');

export const currentPushSubscription = async () => {
  if (!pushSupported()) return null;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  return reg ? reg.pushManager.getSubscription() : null;
};

// Returns '' on success, or a sentence explaining why push couldn't be turned on.
export const turnOnPush = async () => {
  if (!pushSupported()) return "This browser can't show push notifications.";
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'Notifications are blocked for this site. Allow them in your browser settings.';

  const { data } = await api.get('/push_subscription');
  if (!data.enabled) return "Push notifications aren't set up yet.";
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const subscription =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(data.public_key) }));
  await api.post('/push_subscription', subscription.toJSON());
  return '';
};

export const turnOffPush = async () => {
  const subscription = await currentPushSubscription();
  if (!subscription) return;
  await api.delete('/push_subscription', { data: { endpoint: subscription.endpoint } });
  await subscription.unsubscribe();
};
