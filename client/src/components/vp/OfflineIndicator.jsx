import { useEffect, useState } from 'react'
import { onSyncState } from '@/services/vp/syncEngine'

export default function OfflineIndicator() {
    const [online, setOnline] = useState(navigator.onLine)
    const [pending, setPending] = useState(0)
    const [syncing, setSyncing] = useState(false)

    useEffect(() => {
        const onSyncTick = (st) => {
            if (typeof st.pending === 'number') setPending(st.pending)
            if (typeof st.syncing === 'boolean') setSyncing(st.syncing)
            if (typeof st.online === 'boolean') setOnline(st.online)
        }
        const offSync = onSyncState(onSyncTick)
        const onUp = () => setOnline(true)
        const onDown = () => setOnline(false)
        const onAppOnline = () => setOnline(true)
        const onAppOffline = () => setOnline(false)
        window.addEventListener('online', onUp)
        window.addEventListener('offline', onDown)
        window.addEventListener('vp:online', onAppOnline)
        window.addEventListener('vp:offline', onAppOffline)
        return () => {
            offSync()
            window.removeEventListener('online', onUp)
            window.removeEventListener('offline', onDown)
            window.removeEventListener('vp:online', onAppOnline)
            window.removeEventListener('vp:offline', onAppOffline)
        }
    }, [])

    if (online && !pending && !syncing) return null
    return (
        <div className="vp-offline-banner">
            {!online && '⚠️ Offline mode — changes will sync when connected.'}
            {online && syncing && `Syncing ${pending} pending change${pending === 1 ? '' : 's'}…`}
            {online && !syncing && pending > 0 && `${pending} change${pending === 1 ? '' : 's'} queued for sync.`}
        </div>
    )
}
