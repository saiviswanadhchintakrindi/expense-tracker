const CACHE = 'expense-tracker-v2';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/','/index.html','/manifest.json','/icon-192.png','/icon-512.png']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetched = fetch(e.request).then(res => {
        if (res && res.status === 200) { const clone = res.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});

// Push notification event
self.addEventListener('push', (e) => {
  let data = { title: 'Expense Tracker', body: 'Reminder' };
  try { data = e.data.json(); } catch {}
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    data: data.data || {},
    requireInteraction: data.requireInteraction !== false,
    tag: data.tag,
    vibrate: [200, 100, 200]
  };
  e.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click - focus or open the app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) {
        clientList[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
