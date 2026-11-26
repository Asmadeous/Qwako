// TG-Homes service worker: shows push notifications and opens the right page
// when one is tapped.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'TG-Homes', body: event.data?.text() ?? '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'TG-Homes', {
      body: data.body || '',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: { url: data.url || '/account' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/account', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => w.url.startsWith(self.location.origin));
      if (open) return open.navigate(url).then((w) => w?.focus());
      return self.clients.openWindow(url);
    }),
  );
});
