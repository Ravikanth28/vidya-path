// Keep-Alive ping. Detects connectivity by hitting /api/vp/sync/ping.
// Emits a CustomEvent('vp:online') / ('vp:offline') so UI can react.
import vpApi from '../services/vp/api'

let timer = null

export function startKeepAlive({ intervalMs = 20000 } = {}) {
    if (timer) return
    let lastOnline = navigator.onLine
    const ping = async () => {
        try {
            await vpApi.syncPing()
            if (!lastOnline) {
                lastOnline = true
                window.dispatchEvent(new CustomEvent('vp:online'))
            }
        } catch {
            if (lastOnline) {
                lastOnline = false
                window.dispatchEvent(new CustomEvent('vp:offline'))
            }
        }
    }
    timer = setInterval(ping, intervalMs)
    ping()
}

export function stopKeepAlive() {
    if (timer) { clearInterval(timer); timer = null }
}
