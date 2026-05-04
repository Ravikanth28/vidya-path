// Offline sync engine. When the browser comes back online (or every 30s while online),
// drain the IndexedDB queue and POST to /api/vp/sync/replay. Successful events are removed.
import { drainSync, clearSync, enqueueSync } from './lessonCache'
import vpApi from './api'

let running = false
let timer = null
const listeners = new Set()

function notify(state) { for (const fn of listeners) try { fn(state) } catch {} }

export function onSyncState(fn) { listeners.add(fn); return () => listeners.delete(fn) }

export async function flush() {
    if (running) return { skipped: true }
    running = true
    try {
        const events = await drainSync()
        if (!events.length) { notify({ pending: 0, lastFlushAt: Date.now() }); return { applied: 0 } }
        notify({ pending: events.length, syncing: true })
        const payload = events.map(e => ({ kind: e.kind, payload: e.payload, client_ts: e.client_ts }))
        const r = await vpApi.syncReplay(payload)
        const successIds = events
            .map((e, i) => (r.results?.[i]?.ok ? e.id : null))
            .filter(Boolean)
        await clearSync(successIds)
        notify({ pending: events.length - successIds.length, syncing: false, lastFlushAt: Date.now() })
        return r
    } catch (err) {
        notify({ syncing: false, error: err.message })
        return { error: err.message }
    } finally {
        running = false
    }
}

export function queueOfflineEvent(kind, payload) {
    return enqueueSync({ kind, payload })
}

export function startSyncEngine({ intervalMs = 30000 } = {}) {
    if (timer) return
    const tick = () => { if (navigator.onLine) flush() }
    window.addEventListener('online', () => { notify({ online: true }); flush() })
    window.addEventListener('offline', () => notify({ online: false }))
    timer = setInterval(tick, intervalMs)
    tick()
}

export function stopSyncEngine() {
    if (timer) { clearInterval(timer); timer = null }
}
