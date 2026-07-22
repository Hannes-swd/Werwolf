const CACHE = 'werewolf-shell-v3'
const SHELL = ['/', '/icon.svg']

self.addEventListener('install', event => {
  self.skipWaiting()
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)))
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const copy = response.clone()
            event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
          }
          return response
        })
        .catch(async () => (
          (await caches.match(request))
          ?? (await caches.match('/'))
          ?? new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        ))
    )
    return
  }

  const isStaticAsset = url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.svg'
  if (!isStaticAsset) return

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone()
          event.waitUntil(caches.open(CACHE).then(cache => cache.put(request, copy)))
        }
        return response
      })
    })
  )
})
