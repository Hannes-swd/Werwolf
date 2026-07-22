const CACHE_PREFIX = 'werewolf-pwa-'
// Bump this when the offline shell changes.
const CACHE_VERSION = 'v4'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/icon.svg',
  '/icons/pwa-icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

function isCacheableAsset(pathname) {
  return pathname.startsWith('/_next/static/')
    || pathname === '/icon.svg'
    || pathname.startsWith('/icons/')
}

async function offlineResponse() {
  const cache = await caches.open(CACHE_NAME)
  const page = await cache.match(OFFLINE_URL)
  if (page) return page

  return new Response('You are offline. Reconnect to play Werewolf.', {
    status: 503,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(PRECACHE_URLS)
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map(key => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    // Navigation stays network-only, so private room HTML is never cached.
    event.respondWith((async () => {
      try {
        return await fetch(request)
      } catch {
        return offlineResponse()
      }
    })())
    return
  }

  if (!isCacheableAsset(url.pathname)) return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME)
    const cached = await cache.match(request)
    if (cached) return cached

    const response = await fetch(request)
    if (response.ok && response.type === 'basic') {
      await cache.put(request, response.clone())
    }
    return response
  })())
})
