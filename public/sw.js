self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || "",
      icon: data.icon || "/icon.png",
      badge: data.badge || "/badge.png",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
      tag: data.tag || "default",
      requireInteraction: true,
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "MatrixVerse", options)
    );
  } catch (e) {
    // ignore malformed pushes
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
