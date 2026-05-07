// Service Worker for VidyaPath AI PWA
// Features: App shell caching, offline fallback, network-first for API

const CACHE_NAME = 'vidyapath-v3'
const API_CACHE  = 'vidyapath-api-v3'
const OFFLINE_URL = '/offline.html'

// Static assets to pre-cache (app shell)
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/logo.png'
]

// VidyaPath API prefixes — network-first, cache fallback when offline
// (GET requests to these paths will be cached for offline use)
const CACHEABLE_API_PREFIXES = [
    '/api/vp/study/syllabi',
    '/api/vp/lessons',
    '/api/vp/profile',
    '/api/vp/quiz',
    '/api/users/me',
    '/api/leaderboard'
]

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching static assets')
            return cache.addAll(STATIC_ASSETS).catch(err => {
                console.warn('[SW] Some assets failed to cache:', err)
            })
        })
    )
    self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_NAME && name !== API_CACHE)
                    .map(name => {
                        console.log('[SW] Deleting old cache:', name)
                        return caches.delete(name)
                    })
            )
        })
    )
    self.clients.claim()
})

// Fetch: Smart caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return
    }

    // Skip chrome-extension and other non-http requests
    if (!url.protocol.startsWith('http')) {
        return
    }

    // API requests: Network-first, cache GET responses for offline use
    if (url.pathname.startsWith('/api/')) {
        const isCacheable = CACHEABLE_API_PREFIXES.some(p => url.pathname.startsWith(p))
        event.respondWith(networkFirstStrategy(request, isCacheable))
        return
    }

    // Static assets: Cache-first with network fallback
    if (isStaticAsset(url.pathname)) {
        event.respondWith(cacheFirstStrategy(request))
        return
    }

    // Navigation requests: Network-first, fallback to cached index
    if (request.mode === 'navigate') {
        event.respondWith(navigationStrategy(request))
        return
    }

    // Default: Network-first
    event.respondWith(networkFirstStrategy(request))
})

// Network-first strategy (API calls, dynamic content)
async function networkFirstStrategy(request, shouldCache = false) {
    try {
        const response = await fetch(request)
        if (response.ok && shouldCache && request.method === 'GET') {
            const cache = await caches.open(API_CACHE)
            cache.put(request, response.clone())
        }
        return response
    } catch (err) {
        const cached = await caches.match(request)
        if (cached) {
            return cached
        }
        // Return offline JSON for API requests
        return new Response(
            JSON.stringify({ error: 'Offline', offline: true, message: 'You are offline. Data will sync when connected.' }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
        )
    }
}

// Cache-first strategy (static assets)
async function cacheFirstStrategy(request) {
    const cached = await caches.match(request)
    if (cached) {
        return cached
    }
    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME)
            cache.put(request, response.clone())
        }
        return response
    } catch (err) {
        return new Response('', { status: 408 })
    }
}

// Navigation strategy (SPA routing)
async function navigationStrategy(request) {
    try {
        const response = await fetch(request)
        return response
    } catch (err) {
        // Try cached index.html for SPA routing
        const cached = await caches.match('/index.html')
        if (cached) {
            return cached
        }
        // Last resort: offline page
        const offlinePage = await caches.match(OFFLINE_URL)
        if (offlinePage) {
            return offlinePage
        }
        return new Response('<h1>Offline</h1><p>Please check your connection.</p>', {
            headers: { 'Content-Type': 'text/html' },
            status: 503
        })
    }
}

function isStaticAsset(pathname) {
    return /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2?|ttf|eot)$/i.test(pathname)
}

// Background Sync for offline form submissions
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-submissions') {
        event.waitUntil(syncOfflineSubmissions())
    }
    if (event.tag === 'sync-progress') {
        event.waitUntil(syncOfflineProgress())
    }
})

async function syncOfflineSubmissions() {
    try {
        const db = await openDB()
        const tx = db.transaction('offlineQueue', 'readonly')
        const store = tx.objectStore('offlineQueue')
        const requests = await getAllFromStore(store)

        for (const item of requests) {
            try {
                await fetch(item.url, {
                    method: item.method,
                    headers: item.headers,
                    body: JSON.stringify(item.body)
                })
                // Remove from queue on success
                const delTx = db.transaction('offlineQueue', 'readwrite')
                delTx.objectStore('offlineQueue').delete(item.id)
            } catch (err) {
                console.warn('[SW] Sync failed for item:', item.id)
            }
        }
    } catch (err) {
        console.error('[SW] Sync error:', err)
    }
}

async function syncOfflineProgress() {
    // Similar to syncOfflineSubmissions but for progress updates
    console.log('[SW] Syncing progress data...')
}

// IndexedDB helper
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('MentorHubOffline', 1)
        request.onupgradeneeded = (e) => {
            const db = e.target.result
            if (!db.objectStoreNames.contains('offlineQueue')) {
                db.createObjectStore('offlineQueue', { keyPath: 'id', autoIncrement: true })
            }
            if (!db.objectStoreNames.contains('cachedData')) {
                db.createObjectStore('cachedData', { keyPath: 'key' })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

function getAllFromStore(store) {
    return new Promise((resolve, reject) => {
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    const data = event.data?.json() || { title: 'VidyaPath AI', body: 'New notification' }
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/logo.png',
            badge: '/logo.png',
            vibrate: [100, 50, 100],
            data: { url: data.url || '/' }
        })
    )
})

self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    )
})
