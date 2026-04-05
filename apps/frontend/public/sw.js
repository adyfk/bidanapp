self.addEventListener('push', (event) => {
  const payload = readPushPayload(event);
  const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : 'BidanApp';
  const body = typeof payload.body === 'string' ? payload.body : '';
  const tag = typeof payload.tag === 'string' && payload.tag.trim() ? payload.tag.trim() : 'bidanapp-notification';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      for (const client of clients) {
        client.postMessage({
          payload,
          type: 'bidanapp:push-received',
        });
      }

      await self.registration.showNotification(title, {
        body,
        data: payload,
        tag,
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  const payload = event.notification.data || {};
  const path = typeof payload.path === 'string' && payload.path.trim() ? payload.path.trim() : '/';

  event.notification.close();
  event.waitUntil(
    (async () => {
      const targetUrl = new URL(path, self.location.origin).href;
      const clients = await self.clients.matchAll({
        includeUncontrolled: true,
        type: 'window',
      });

      for (const client of clients) {
        client.postMessage({
          payload,
          type: 'bidanapp:push-clicked',
        });
        if (client.url === targetUrl && 'focus' in client) {
          await client.focus();
          return;
        }
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(path);
      }
    })(),
  );
});

function readPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    try {
      return {
        body: event.data.text(),
      };
    } catch {
      return {};
    }
  }
}
