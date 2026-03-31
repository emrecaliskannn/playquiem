const CACHE = 'playquiem-v1'
const STATIC = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
]

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const { request } = e
  const url = new URL(request.url)

  // Let API calls and Supabase through — never cache these
  if (url.hostname.includes('supabase') ||
      url.hostname.includes('igdb') ||
      url.hostname.includes('steamspy') ||
      url.pathname.startsWith('/api/')) {
    return
  }

  // For navigation requests: network first, fallback to cached index.html
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .catch(() => caches.match('/index.html'))
    )
    return
  }

  // For static assets: cache first
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached
      return fetch(request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res
        const clone = res.clone()
        caches.open(CACHE).then(c => c.put(request, clone))
        return res
      })
    })
  )
})
