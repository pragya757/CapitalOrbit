const CACHE_NAME = 'spendwise-cache-v1'
const URLS_TO_CACHE = [
  '/',
  '/dashboard',
  '/expenses',
  '/budgets',
  '/analytics',
  '/income',
  '/settings',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE)
    })
  )
})

self.addEventListener('fetch', (event) => {
  // Service worker for offline capability
  // Uses Network First, falling back to cache strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})
