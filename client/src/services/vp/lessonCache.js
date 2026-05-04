// Plain IndexedDB cache for lessons (no external `idb` dependency).
// Two object stores:
//   - `lessons`         : keyPath = id, holds {id, subject, title, body, ...}
//   - `sync_queue`      : autoIncrement, holds pending offline events
// Used by the LessonsList / LessonDetail / sync engine.

const DB_NAME = 'vidyapath'
const DB_VERSION = 1

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION)
        req.onupgradeneeded = (e) => {
            const db = e.target.result
            if (!db.objectStoreNames.contains('lessons')) {
                db.createObjectStore('lessons', { keyPath: 'id' })
            }
            if (!db.objectStoreNames.contains('sync_queue')) {
                const s = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
                s.createIndex('by_kind', 'kind', { unique: false })
            }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
    })
}

async function tx(store, mode, fn) {
    const db = await openDB()
    return new Promise((resolve, reject) => {
        const t = db.transaction(store, mode)
        const s = t.objectStore(store)
        const out = fn(s)
        t.oncomplete = () => resolve(out)
        t.onerror = () => reject(t.error)
    })
}

export async function cacheLesson(lesson) {
    if (!lesson?.id) return
    return tx('lessons', 'readwrite', s => s.put({ ...lesson, _cachedAt: Date.now() }))
}

export async function getCachedLesson(id) {
    return new Promise(async (resolve) => {
        try {
            const db = await openDB()
            const r = db.transaction('lessons', 'readonly').objectStore('lessons').get(id)
            r.onsuccess = () => resolve(r.result || null)
            r.onerror = () => resolve(null)
        } catch { resolve(null) }
    })
}

export async function listCachedLessons() {
    return new Promise(async (resolve) => {
        try {
            const db = await openDB()
            const r = db.transaction('lessons', 'readonly').objectStore('lessons').getAll()
            r.onsuccess = () => resolve(r.result || [])
            r.onerror = () => resolve([])
        } catch { resolve([]) }
    })
}

export async function enqueueSync(event) {
    const item = { kind: event.kind, payload: event.payload || {}, client_ts: new Date().toISOString() }
    return tx('sync_queue', 'readwrite', s => s.add(item))
}

export async function drainSync() {
    return new Promise(async (resolve) => {
        try {
            const db = await openDB()
            const r = db.transaction('sync_queue', 'readonly').objectStore('sync_queue').getAll()
            r.onsuccess = () => resolve(r.result || [])
            r.onerror = () => resolve([])
        } catch { resolve([]) }
    })
}

export async function clearSync(ids) {
    if (!ids?.length) return
    return tx('sync_queue', 'readwrite', s => {
        for (const id of ids) s.delete(id)
    })
}
