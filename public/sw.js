const CACHE = "matrixverse-v1"
const PRECACHE_URLS = ["/", "/dashboard", "/journal", "/education", "/glossary"]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS).catch(() => {}))
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  event.waitUntil(clients.claim())
})

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE).then((cache) => {
            if (event.request.url.startsWith(self.location.origin)) {
              cache.put(event.request, clone)
            }
          })
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})

self.addEventListener("push", (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    const options = {
      body: data.body || "",
      icon: data.icon || "/icon-192.png",
      badge: data.icon || "/icon-192.png",
      data: { url: data.url || "/" },
      vibrate: [200, 100, 200],
      tag: data.tag || "default",
      requireInteraction: true,
    }
    event.waitUntil(
      self.registration.showNotification(data.title || "MatrixVerse", options)
    )
  } catch (e) {}
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/"
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
